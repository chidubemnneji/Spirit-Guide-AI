import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
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
    <div className="flex justify-between px-6 py-5 bg-white">
      {days.map((d, i) => (
        <div
          key={i}
          className="w-10 h-10 flex items-center justify-center text-[13px] font-medium"
          style={{
            background: d.isComplete ? "#1b291d" : "transparent",
            color: d.isComplete ? "#fff" : d.isBeforeJoin ? "#ccc" : "#111",
            border: d.isComplete ? "none" : "1px solid #D8D7D2",
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
      {/* ─────────────────────────  DESKTOP: EDITORIAL BROADSHEET  ───────────────────────── */}
      <div className="hidden md:block min-h-screen" style={{ background: "#EBEAE5" }}>
        {/* Masthead */}
        <header className="flex items-stretch border-b-2 border-black bg-[#EBEAE5] max-w-[1600px] mx-auto w-full">
          <div className="px-8 py-6 flex items-center border-r border-[#D8D7D2]">
            <h1 className="font-serif text-[30px] italic leading-none text-black">SoulGuide</h1>
          </div>
          <div className="flex-1 flex items-center px-8">
            <span className="font-serif text-[18px] italic text-[#73726C]">{greeting?.greeting || `Grace and peace, ${userName}.`}</span>
          </div>
          <button
            className="px-8 flex items-center justify-center border-l border-[#D8D7D2] relative"
            onClick={() => setShowNotifications(true)}
          >
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black">{format(new Date(), "MMMM d")}</span>
            {(notifData?.unreadCount ?? 0) > 0 && <span className="absolute top-5 right-5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
          </button>
        </header>

        {/* Three-column broadsheet */}
        <div className="grid grid-cols-[1fr_1.4fr_1fr] max-w-[1600px] mx-auto">
          {/* LEFT RAIL — Today's Readings */}
          <section className="border-r border-black">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black">Today's Readings</span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#73726C]">
                {journeyTasks.filter(t => t.isCompleted).length.toString().padStart(2, "0")}/{journeyTasks.length.toString().padStart(2, "0")}
              </span>
            </div>
            {journeyTasks.map((task) => (
              <button
                key={task.id}
                onClick={task.action}
                className="w-full text-left px-6 py-7 border-b border-[#D8D7D2] block transition-colors hover:bg-white/50"
              >
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#73726C]">{task.duration}</span>
                <p className="font-serif text-[26px] leading-[1.1] text-black mt-2 mb-3">{task.title}</p>
                <p className="text-[14px] leading-[1.55] text-[#545454] mb-4">{task.subtitle}</p>
                {task.isCompleted ? (
                  <span className="inline-block text-[10px] font-semibold tracking-[0.15em] uppercase text-[#1b291d] border border-[#1b291d] rounded-full px-3 py-1">Completed</span>
                ) : (
                  <span className="inline-block text-[10px] font-semibold tracking-[0.15em] uppercase text-white bg-[#1b291d] rounded-full px-3 py-1">Begin →</span>
                )}
              </button>
            ))}
          </section>

          {/* CENTER — Featured Devotion */}
          <section className="border-r border-black">
            <div className="px-7 py-4 border-b border-black">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black">Morning Devotion</span>
            </div>
            <div className="relative w-full aspect-[16/10] overflow-hidden border-b border-black">
              <img
                src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1000&auto=format&fit=crop&q=80"
                alt="Peaceful morning nature"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-7 py-7">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#73726C]">
                {struggle ? struggle : "Today's Reflection"}
              </span>
              <h2 className="font-serif text-[44px] leading-[1.08] text-black mt-3 mb-5">
                {devotional?.title || `${userName}'s Journey`}
              </h2>
              <p className="text-[17px] leading-[1.65] text-[#444] mb-7 max-w-[46ch]">
                {devotional?.scriptureText
                  ? `"${devotional.scriptureText.slice(0, 160)}${devotional.scriptureText.length > 160 ? "…" : ""}"`
                  : "A space to be still, reflect, and reconnect with what matters most."}
              </p>
              <button
                onClick={() => { handleComplete(); setLocation("/devotional"); }}
                className="inline-flex items-center gap-3 bg-black text-white text-[12px] font-semibold tracking-[0.15em] uppercase rounded-full px-7 py-3.5"
              >
                Read Devotion →
              </button>
            </div>
          </section>

          {/* RIGHT RAIL — This Week + Verse */}
          <section>
            <div className="flex items-center justify-between px-6 py-4 border-b border-black">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black">This Week</span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#73726C]">{weekRange}</span>
            </div>
            <div className="px-6 py-6 border-b border-[#D8D7D2]">
              <div className="flex justify-between gap-1">
                {(() => {
                  const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
                  return Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(ws, i);
                    const done = completedDays.includes(format(date, "yyyy-MM-dd"));
                    const today = isToday(date);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#73726C]">{format(date, "EEEEE")}</span>
                        <div
                          className="w-full aspect-square flex items-center justify-center text-[12px] font-semibold"
                          style={{
                            background: done ? "#1b291d" : "transparent",
                            color: done ? "#fff" : "#111",
                            border: done ? "none" : today ? "2px solid #1b291d" : "1px solid #D8D7D2",
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
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1b291d] mt-5 text-center">{currentStreak} day streak</p>
              )}
            </div>

            {devotional && (
              <div className="px-6 py-6">
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black">Verse of the Day</span>
                <p className="font-serif text-[24px] italic leading-[1.4] text-black mt-4 mb-3">
                  "{devotional.scriptureText}"
                </p>
                <p className="text-[12px] font-semibold tracking-[0.12em] uppercase text-[#73726C] mb-5">— {devotional.scriptureReference}</p>
                <button
                  onClick={() => setLocation(buildBibleLink(devotional.scriptureReference || ""))}
                  className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1b291d] border border-[#1b291d] rounded-full px-5 py-2.5"
                >
                  Read in Context
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ─────────────────────────  MOBILE: ORIGINAL COLUMN (UNTOUCHED)  ───────────────────────── */}
      <div className="md:hidden min-h-screen pb-20" style={{ background: "#EBEAE5" }}>
      {/* Header */}
      <header className="flex bg-white border-b border-[#D8D7D2]">
        <div className="flex-1 py-6 px-6 flex items-center">
          <h1 className="font-serif text-[26px] leading-none text-black tracking-wide">SoulGuide</h1>
        </div>
        <button
          className="border-l border-[#D8D7D2] py-6 px-7 flex items-center justify-center relative"
          onClick={() => setShowNotifications(true)}
          data-testid="button-notifications"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="0.75" strokeLinecap="square">
            <line x1="2" y1="7" x2="22" y2="7" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="17" x2="22" y2="17" />
          </svg>
          {(notifData?.unreadCount ?? 0) > 0 && <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-red-500 rounded-full" />}
        </button>
      </header>

      {/* Hero card */}
      <div className="p-6 pb-0">
        <div className="bg-white p-7">
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
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#73726C]">Morning Devotion</span>
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#111]">{format(new Date(), "MMM d")}</span>
          </div>
          <h2 className="font-serif text-[36px] leading-[1.15] text-black mb-4" data-testid="text-greeting">
            {devotional?.title || `${userName}'s Journey`}
          </h2>
          <p className="text-[17px] leading-[1.65] text-[#545454]">
            {struggle ? `Today's reflection is shaped around: ${struggle}.` : "A space to be still, reflect, and reconnect with what matters most."}
          </p>
        </div>
      </div>

      {/* Daily Progress */}
      <div className="section-band mt-4">
        <span>Daily Progress</span>
        <span className="text-[11px] font-medium tracking-[0.08em] text-[#73726C] uppercase">{weekRange}</span>
      </div>
      <WeekStrip completedDays={completedDays} joinedAt={joinedAt} />

      {/* Today's Readings */}
      <div className="border-y border-[#D8D7D2] py-5 px-8 mt-4 bg-white flex items-center justify-between">
        <h3 className="text-[12px] font-semibold tracking-[0.15em] uppercase text-black">Today's Readings</h3>
        {currentStreak > 0 && (
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1b291d]">{currentStreak} day streak</span>
        )}
      </div>

      {/* Task list */}
      <div className="flex flex-col">
        {journeyTasks.map((task, i) => (
          <button
            key={task.id}
            onClick={task.action}
            className="w-full text-left px-6 py-6 bg-white border-b border-[#f0f0ee] flex items-center justify-between"
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#73726C]">{task.duration}</span>
                {task.isCompleted && (
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#1b291d] border border-[#1b291d] px-2 py-0.5">Done</span>
                )}
              </div>
              <p className="font-serif text-[20px] text-black mb-1">{task.title}</p>
              <p className="text-[14px] text-[#73726C] leading-relaxed">{task.subtitle}</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={task.isCompleted ? "#1b291d" : "#D8D7D2"} strokeWidth="1.5" strokeLinecap="square">
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
          <div className="px-6 py-7 bg-white border-b border-[#f0f0ee]">
            <h4 className="font-serif text-[20px] font-bold text-black mb-2">{devotional.scriptureReference}</h4>
            <p className="text-[16px] text-[#545454] leading-relaxed mb-5 italic">"{devotional.scriptureText}"</p>
            <button
              onClick={() => setLocation(buildBibleLink(devotional.scriptureReference || ""))}
              className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1b291d] border border-[#1b291d] px-4 py-2"
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
