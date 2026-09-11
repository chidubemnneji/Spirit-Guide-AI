import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { StreakCelebration } from "@/components/devotional/StreakCelebration";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { buildBibleLink } from "@/lib/bibleUtils";
import type { DevotionalGreeting, Devotional } from "@shared/schema";

interface JourneyEntry { devotional: Devotional; completedAt: Date | string | null; rating: number | null; }
interface JourneyTask { id: string; title: string; subtitle: string; duration: string; isCompleted: boolean; action: () => void; }

const STRUGGLE_DISPLAY: Record<string, string> = {
  distant_from_god: "Feeling distant from God",
  wrestling_doubts: "Wrestling with doubts",
  feel_alone: "Feeling alone in faith",
  guilt_shame: "Carrying guilt or shame",
  life_overwhelming: "Life feeling overwhelming",
  new_to_faith: "New to faith",
};

function WeekStrip({ completedDays, joinedAt }: { completedDays: string[]; joinedAt?: string | null }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const joinDate = joinedAt ? new Date(joinedAt) : null;
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      letter: format(date, "EEEEE"),
      isComplete: completedDays.includes(format(date, "yyyy-MM-dd")),
      isToday: isToday(date),
      isBeforeJoin: joinDate ? date < new Date(format(joinDate, "yyyy-MM-dd")) : false,
    };
  });

  return (
    <div className="flex justify-between px-6 py-5 bg-[var(--app-white)]">
      {days.map((d, i) => (
        <div
          key={i}
          className="w-10 h-10 flex items-center justify-center text-[13px] font-medium"
          style={{
            background: d.isComplete ? "var(--cta-bg)" : "transparent",
            color: d.isComplete ? "var(--cta-fg)" : d.isBeforeJoin ? "var(--app-placeholder)" : "var(--app-dark)",
            border: d.isComplete ? "none" : "1px solid var(--app-border)",
            opacity: d.isBeforeJoin ? 0.4 : 1,
          }}
        >
          {d.letter}
        </div>
      ))}
    </div>
  );
}

export default function Devotion() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(() => {
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(`soulguide_tasks_${today}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const startTime = useRef(Date.now()).current;
  const startedRef = useRef(false);
  const { toast } = useToast();

  const greetingQuery = useQuery<{ success: boolean; data: DevotionalGreeting }>({ queryKey: ["/api/devotional/greeting"] });
  const devotionalQuery = useQuery<{ success: boolean; data: Devotional; completedTaskIds: string[] }>({ queryKey: ["/api/devotional/today"] });
  const journeyQuery = useQuery<{ success: boolean; data: JourneyEntry[] }>({ queryKey: ["/api/devotional/journey"] });

  const startMutation = useMutation({ mutationFn: async (id: number) => { await apiRequest("POST", `/api/devotional/${id}/start`); } });
  const completeMutation = useMutation({
    mutationFn: async ({ devotionalId, timeSpentSeconds }: { devotionalId: number; timeSpentSeconds: number }) => {
      const res = await apiRequest("POST", `/api/devotional/${devotionalId}/complete`, { timeSpentSeconds });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/devotional/greeting"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devotional/journey"] });
      if (data?.data?.newMilestones?.length > 0) { setCelebrationMilestone(data.data.newMilestones[0]); setShowCelebration(true); }
      else if (data?.data?.freezeUsed) {
        toast({
          title: "Streak freeze used 🧊",
          description: `You missed a day, but your streak is safe. ${data.data.freezesAvailable} left this month.`,
        });
      }
    },
  });

  const { data: notifData } = useQuery<{ unreadCount: number }>({ queryKey: ["/api/notifications/unread-count"] });
  const { data: personaData } = useQuery<{ primaryStruggle?: string }>({ queryKey: ["/api/persona"], enabled: !!user });

  useEffect(() => {
    if (devotionalQuery.data?.data?.id && !startedRef.current) { startedRef.current = true; startMutation.mutate(devotionalQuery.data.data.id); }
    if (devotionalQuery.data?.completedTaskIds?.length) {
      setCompletedTaskIds(prev => { const next = new Set(prev); devotionalQuery.data.completedTaskIds.forEach(id => next.add(id)); return next; });
    }
  }, [devotionalQuery.data?.data?.id, devotionalQuery.data?.completedTaskIds]);

  const handleTaskComplete = (taskId: string) => {
    setCompletedTaskIds(prev => {
      const next = new Set(prev).add(taskId);
      localStorage.setItem(`soulguide_tasks_${new Date().toISOString().split("T")[0]}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleComplete = () => {
    if (devotionalQuery.data?.data?.id) {
      completeMutation.mutate({ devotionalId: devotionalQuery.data.data.id, timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000) });
    }
  };

  const greeting = greetingQuery.data?.data;
  const devotional = devotionalQuery.data?.data;
  const userName = user?.name?.split(" ")[0] || "Friend";
  const currentStreak = greeting?.currentStreak || 0;
  const joinedAt = greeting?.joinedAt as string | null ?? null;
  const struggle = personaData?.primaryStruggle ? STRUGGLE_DISPLAY[personaData.primaryStruggle] || personaData.primaryStruggle.replace(/_/g, " ") : null;

  const journeyTasks: JourneyTask[] = [
    { id: "soul-checkin", title: "Soul Check-In", subtitle: "A personalised reflection based on your journey", duration: "2 MIN", isCompleted: completedTaskIds.has("soul-checkin"), action: () => { handleTaskComplete("soul-checkin"); setLocation("/chat?mode=checkin"); } },
    { id: "devotional-prayer", title: "Daily Devotional & Prayer", subtitle: devotional?.scriptureReference ? `${devotional.scriptureReference} · ${devotional.title || "Reflection"}` : "Reflection and connection with God", duration: "5 MIN", isCompleted: completedTaskIds.has("devotional-prayer"), action: () => { handleTaskComplete("devotional-prayer"); handleComplete(); setLocation("/devotional"); } },
    { id: "prayer-journal", title: "Reflect & Journal", subtitle: "Record your thoughts, prayers and moments with God", duration: "3 MIN", isCompleted: completedTaskIds.has("prayer-journal"), action: () => { handleTaskComplete("prayer-journal"); setLocation("/journal"); } },
  ];

  const completedDays = journeyQuery.data?.data?.filter(e => e.completedAt).map(e => format(new Date(e.completedAt as string), "yyyy-MM-dd")) || [];
  const weekRange = (() => { const ws = startOfWeek(new Date(), { weekStartsOn: 1 }); return `${format(ws, "MMM d")} - ${format(addDays(ws, 6), "d")}`; })();

  return (
    <>
      {/* ─────────────────────────  DESKTOP: EDITORIAL BROADSHEET  ─────────────────────────
          A fixed one-screen dashboard rather than a page that scrolls: the
          whole thing is exactly h-screen, and each of the three columns below
          scrolls independently (only if its own content runs long) instead of
          the page growing taller than the viewport. */}
      <div className="hidden md:flex md:flex-col h-screen overflow-hidden" style={{ background: "var(--app-bg)" }}>
        {/* Masthead */}
        <header className="flex items-stretch border-b-2 border-[var(--app-dark)] bg-[var(--app-bg)] max-w-[1600px] mx-auto w-full flex-shrink-0">
          <div className="px-8 py-6 flex items-center border-r border-[var(--app-border)]">
            <h1 className="font-serif text-[30px] italic leading-none text-[var(--app-dark)]">SoulGuide</h1>
          </div>
          <div className="flex-1 flex items-center px-8">
            <span className="font-serif text-[18px] italic text-[var(--app-gray-lt)]">{greeting?.greeting || `Grace and peace, ${userName}.`}</span>
          </div>
          <div className="px-8 flex items-center border-l border-[var(--app-border)]">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--app-gray-lt)]">Daily Bread</span>
          </div>
          <button
            className="px-8 flex items-center justify-center border-l border-[var(--app-border)] relative"
            onClick={() => setShowNotifications(true)}
          >
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">{format(new Date(), "MMMM d")}</span>
            {(notifData?.unreadCount ?? 0) > 0 && <span className="absolute top-5 right-5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
          </button>
        </header>

        {/* Three-column broadsheet */}
        <div className="grid grid-cols-[1fr_1.4fr_1fr] max-w-[1600px] mx-auto items-stretch flex-1 min-h-0">
          {/* LEFT RAIL — Today's Readings */}
          <section className="border-r border-[var(--app-dark)] overflow-y-auto min-h-0">
            <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--app-dark)]">
              <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-dark)]">Today's Readings</span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">
                {journeyTasks.filter(t => t.isCompleted).length.toString().padStart(2, "0")}/{journeyTasks.length.toString().padStart(2, "0")}
              </span>
            </div>
            {journeyTasks.map((task) => (
              <button
                key={task.id}
                onClick={task.action}
                className="w-full text-left px-8 py-10 border-b border-[var(--app-border)] block transition-colors hover:bg-white/50"
              >
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--app-gray-lt)]">{task.duration}</span>
                <p className="font-serif text-[32px] leading-[1.1] text-[var(--app-dark)] mt-3 mb-4">{task.title}</p>
                <p className="text-[16px] leading-[1.55] text-[var(--app-gray)] mb-5">{task.subtitle}</p>
                {task.isCompleted ? (
                  <span className="inline-block text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--app-green)] border border-[var(--app-green)] rounded-full px-4 py-1.5">Completed</span>
                ) : (
                  <span className="inline-block text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--cta-fg)] bg-[var(--cta-bg)] rounded-full px-4 py-1.5">Begin →</span>
                )}
              </button>
            ))}
          </section>

          {/* CENTER — Featured Devotion */}
          <section className="border-r border-[var(--app-dark)] overflow-y-auto min-h-0">
            <div className="px-9 py-5 border-b border-[var(--app-dark)]">
              <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-dark)]">Morning Devotion</span>
            </div>
            <div className="relative w-full aspect-[16/10] overflow-hidden border-b border-[var(--app-dark)]">
              <img
                src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1000&auto=format&fit=crop&q=80"
                alt="Peaceful morning nature"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-9 py-9">
              <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-gray-lt)]">
                {struggle ? struggle : "Today's Reflection"}
              </span>
              <h2 className="font-serif text-[56px] leading-[1.05] text-[var(--app-dark)] mt-4 mb-6">
                {devotional?.title || `${userName}'s Journey`}
              </h2>
              <p className="text-[19px] leading-[1.7] text-[var(--app-gray)] mb-8 max-w-[48ch]">
                {devotional?.scriptureText
                  ? `"${devotional.scriptureText.slice(0, 160)}${devotional.scriptureText.length > 160 ? "…" : ""}"`
                  : "A space to be still, reflect, and reconnect with what matters most."}
              </p>
              <button
                onClick={() => { handleComplete(); setLocation("/devotional"); }}
                className="inline-flex items-center gap-3 bg-[var(--cta-bg)] text-[var(--cta-fg)] text-[13px] font-semibold tracking-[0.15em] uppercase rounded-full px-9 py-4"
              >
                Read Devotion →
              </button>
            </div>
          </section>

          {/* RIGHT RAIL — This Week + Verse */}
          <section className="overflow-y-auto min-h-0">
            <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--app-dark)]">
              <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-dark)]">Weekly Path</span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">{weekRange}</span>
            </div>
            <div className="px-6 py-6 border-b border-[var(--app-border)]">
              <div className="flex justify-between gap-1">
                {(() => {
                  const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
                  return Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(ws, i);
                    const done = completedDays.includes(format(date, "yyyy-MM-dd"));
                    const today = isToday(date);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--app-gray-lt)]">{format(date, "EEEEE")}</span>
                        <div
                          className="w-full aspect-square flex items-center justify-center text-[12px] font-semibold"
                          style={{
                            background: done ? "var(--cta-bg)" : "transparent",
                            color: done ? "var(--cta-fg)" : "var(--app-dark)",
                            border: done ? "none" : today ? "2px solid var(--app-green)" : "1px solid var(--app-border)",
                          }}
                        >
                          {format(date, "d")}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {currentStreak > 0 && (
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--app-green)] mt-5 text-center">{currentStreak} day streak</p>
              )}
            </div>

            {devotional && (
              <div className="px-6 py-6">
                <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-dark)]">Verse of the Day</span>
                <p className="font-serif text-[24px] italic leading-[1.4] text-[var(--app-dark)] mt-4 mb-3">
                  "{devotional.scriptureText}"
                </p>
                <p className="text-[12px] font-semibold tracking-[0.12em] uppercase text-[var(--app-gray-lt)] mb-5">— {devotional.scriptureReference}</p>
                <button
                  onClick={() => setLocation(buildBibleLink(devotional.scriptureReference || ""))}
                  className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--app-green)] border border-[var(--app-green)] rounded-full px-5 py-2.5"
                >
                  Read in Context
                </button>
              </div>
            )}

            {/* Recent Devotions — real completed journey entries */}
            {(() => {
              const recent = (journeyQuery.data?.data || [])
                .filter((e) => e.completedAt && e.devotional)
                .slice(0, 5);
              if (recent.length === 0) return null;
              return (
                <div className="border-t border-[var(--app-dark)]">
                  <div className="px-6 py-4 border-b border-[var(--app-border)]">
                    <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[var(--app-dark)]">Recent Devotions</span>
                  </div>
                  {recent.map((e, i) => (
                    <button
                      key={i}
                      onClick={() => setLocation(buildBibleLink(e.devotional.scriptureReference || ""))}
                      className="w-full text-left px-6 py-5 border-b border-[var(--app-border)] block transition-colors hover:bg-white/50"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)]">
                          {e.completedAt ? format(new Date(e.completedAt as string), "MMM d") : ""}
                        </span>
                        {e.rating ? (
                          <span className="text-[11px] text-[var(--app-green)]">{"★".repeat(e.rating)}</span>
                        ) : null}
                      </div>
                      <p className="font-serif text-[18px] leading-[1.2] text-[var(--app-dark)]">{e.devotional.title}</p>
                      <p className="text-[12px] text-[var(--app-gray-lt)] mt-1">{e.devotional.scriptureReference}</p>
                    </button>
                  ))}
                </div>
              );
            })()}
          </section>
        </div>
      </div>

      {/* ─────────────────────────  MOBILE: ORIGINAL COLUMN (UNTOUCHED)  ───────────────────────── */}
      <div className="md:hidden min-h-screen pb-20" style={{ background: "var(--app-bg)" }}>
      {/* Header */}
      <header className="flex bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <div className="flex-1 py-6 px-6 flex items-center">
          <h1 className="font-serif text-[26px] leading-none text-[var(--app-dark)] tracking-wide">SoulGuide</h1>
        </div>
        <button
          className="border-l border-[var(--app-border)] py-6 px-7 flex items-center justify-center relative"
          onClick={() => setShowNotifications(true)}
          data-testid="button-notifications"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--app-gray)" strokeWidth="0.75" strokeLinecap="square">
            <line x1="2" y1="7" x2="22" y2="7" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="17" x2="22" y2="17" />
          </svg>
          {(notifData?.unreadCount ?? 0) > 0 && <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-red-500 rounded-full" />}
        </button>
      </header>

      {/* Hero card */}
      <div className="p-6 pb-0">
        <div className="bg-[var(--app-white)] p-7">
          <div className="w-full aspect-[4/3] mb-7 overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80"
              alt="Peaceful morning nature"
              className="w-full h-full object-cover"
            />
            {devotional?.scriptureText && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-5 py-4">
                <p className="font-serif text-[15px] italic text-white leading-relaxed">
                  "{devotional.scriptureText.slice(0, 100)}{devotional.scriptureText.length > 100 ? "…" : ""}"
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">Morning Devotion</span>
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">{format(new Date(), "MMM d")}</span>
          </div>
          <h2 className="font-serif text-[36px] leading-[1.15] text-[var(--app-dark)] mb-4" data-testid="text-greeting">
            {devotional?.title || `${userName}'s Journey`}
          </h2>
          <p className="text-[17px] leading-[1.65] text-[var(--app-gray)]">
            {struggle ? `Today's reflection is shaped around: ${struggle}.` : "A space to be still, reflect, and reconnect with what matters most."}
          </p>
        </div>
      </div>

      {/* Daily Progress */}
      <div className="section-band mt-4">
        <span>Daily Progress</span>
        <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--app-gray-lt)] uppercase">{weekRange}</span>
      </div>
      <WeekStrip completedDays={completedDays} joinedAt={joinedAt} />

      {/* Today's Readings */}
      <div className="border-y border-[var(--app-border)] py-5 px-8 mt-4 bg-[var(--app-white)] flex items-center justify-between">
        <h3 className="text-[12px] font-semibold tracking-[0.15em] uppercase text-[var(--app-dark)]">Today's Readings</h3>
        {currentStreak > 0 && (
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--app-green)]">{currentStreak} day streak</span>
        )}
      </div>

      {/* Task list */}
      <div className="flex flex-col">
        {journeyTasks.map((task, i) => (
          <button
            key={task.id}
            onClick={task.action}
            className="w-full text-left px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex items-center justify-between"
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)]">{task.duration}</span>
                {task.isCompleted && (
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--app-green)] border border-[var(--app-green)] px-2 py-0.5">Done</span>
                )}
              </div>
              <p className="font-serif text-[20px] text-[var(--app-dark)] mb-1">{task.title}</p>
              <p className="text-[14px] text-[var(--app-gray-lt)] leading-relaxed">{task.subtitle}</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={task.isCompleted ? "var(--app-green)" : "var(--app-border)"} strokeWidth="1.5" strokeLinecap="square">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>

      {/* Verse of the day */}
      {devotional && (
        <div className="mt-4">
          <div className="section-band">
            <span>Verse of the Day</span>
          </div>
          <div className="px-6 py-7 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
            <h4 className="font-serif text-[20px] font-bold text-[var(--app-dark)] mb-2">{devotional.scriptureReference}</h4>
            <p className="text-[16px] text-[var(--app-gray)] leading-relaxed mb-5 italic">"{devotional.scriptureText}"</p>
            <button
              onClick={() => setLocation(buildBibleLink(devotional.scriptureReference || ""))}
              className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--app-green)] border border-[var(--app-green)] px-4 py-2"
              data-testid="button-read-in-context"
            >
              Read in Context
            </button>
          </div>
        </div>
      )}

      <StreakCelebration visible={showCelebration} milestone={celebrationMilestone} onClose={() => setShowCelebration(false)} />
      <AnimatePresence>{showNotifications && <NotificationDrawer onClose={() => setShowNotifications(false)} />}</AnimatePresence>
      </div>
    </>
  );
}
