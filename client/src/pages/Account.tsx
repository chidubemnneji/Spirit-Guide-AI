import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import type { UserPersona } from "@shared/schema";

interface UserStats { conversationCount: number; messageCount: number; practicesCompleted: number; currentStreak: number; longestStreak: number; }

interface WeeklyRecap {
  hasEnoughData: boolean;
  summary: string | null;
  stats: { journalEntries: number; answeredPrayers: number; devotionalsCompleted: number; currentStreak: number; dominantMood: string | null };
}

function WeeklyRecapCard() {
  const { data, isLoading } = useQuery<WeeklyRecap>({ queryKey: ["/api/weekly-recap"], staleTime: 1000 * 60 * 30 });

  if (isLoading) {
    return (
      <div className="px-6 py-8 bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <div className="h-4 w-2/3 bg-[var(--app-border)] animate-pulse rounded mb-2" />
        <div className="h-4 w-1/2 bg-[var(--app-border)] animate-pulse rounded" />
      </div>
    );
  }

  if (!data?.hasEnoughData || !data.summary) {
    return (
      <div className="px-6 py-8 bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <p className="font-serif text-[16px] italic text-[var(--app-gray-lt)]">
          Write a journal entry or complete a devotional this week, and your reflection will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 bg-[var(--app-white)] border-b border-[var(--app-border)]">
      <p className="font-serif text-[18px] italic leading-relaxed text-[var(--app-dark)]">{data.summary}</p>
      <div className="flex gap-5 mt-5 flex-wrap">
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--app-gray-lt)]">{data.stats.journalEntries} journal {data.stats.journalEntries === 1 ? "entry" : "entries"}</span>
        {data.stats.answeredPrayers > 0 && (
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--app-green)]">{data.stats.answeredPrayers} answered</span>
        )}
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--app-gray-lt)]">{data.stats.devotionalsCompleted} devotionals</span>
      </div>
    </div>
  );
}

const ARCHETYPE_DISPLAY: Record<string, { name: string; description: string }> = {
  wounded_seeker:     { name: "Wounded Seeker",     description: "Finding God through the pain" },
  eager_builder:      { name: "Eager Builder",       description: "Growing deliberately, day by day" },
  curious_explorer:   { name: "Curious Explorer",    description: "Following questions toward faith" },
  returning_prodigal: { name: "Returning Prodigal",  description: "Coming home after time away" },
  struggling_saint:   { name: "Struggling Saint",    description: "Faithful despite the doubts" },
};

const STRUGGLE_DISPLAY: Record<string, string> = {
  distant_from_god:  "Feeling distant from God",
  wrestling_doubts:  "Wrestling with doubts",
  feel_alone:        "Feeling alone in faith",
  guilt_shame:       "Carrying guilt or shame",
  life_overwhelming: "Life feeling overwhelming",
  new_to_faith:      "New to faith",
};

export default function Account() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [betaLoading, setBetaLoading] = useState(false);

  const { data: betaData, refetch: refetchBeta } = useQuery<{ isBetaUser: boolean }>({ queryKey: ["/api/me/beta"], enabled: !!user });
  const isBetaUser = betaData?.isBetaUser ?? false;

  async function toggleBeta() {
    setBetaLoading(true);
    try { await apiRequest("POST", "/api/me/beta/join"); await refetchBeta(); }
    catch {}
    finally { setBetaLoading(false); }
  }

  const { data: stats } = useQuery<UserStats>({ queryKey: ["/api/user/stats"], enabled: !!user });
  const { data: personaData } = useQuery<UserPersona>({ queryKey: ["/api/persona"], enabled: !!user });

  const { data: savedPassages } = useQuery<{ passages: { reference: string; text: string }[] }>({
    queryKey: ["/api/bible/saved"], enabled: !!user,
  });

  const { data: journeyData } = useQuery<{ success: boolean; data: any[] }>({ queryKey: ["/api/devotional/journey"] });

  const handleLogout = async () => { await logout(); setLocation("/"); };
  const { theme, toggleTheme } = useTheme();

  const userName = user?.name || "Friend";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const currentStreak = stats?.currentStreak ?? 0;
  const archetypeKey = personaData?.graceArchetype || "";
  const archetype = ARCHETYPE_DISPLAY[archetypeKey];
  const memberSince = user?.createdAt ? format(new Date(user.createdAt), "MMM yyyy") : "";

  // Week calendar data
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const completedDays = journeyData?.data?.filter((e: any) => e.completedAt).map((e: any) => format(new Date(e.completedAt), "yyyy-MM-dd")) || [];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return { letter: format(date, "EEEEE"), isComplete: completedDays.includes(format(date, "yyyy-MM-dd")), isToday: isToday(date) };
  });
  const weekRange = `${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "d")}`;

  // Circular progress
  const progressPct = Math.min(completedDays.length / 7, 1);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${circumference * progressPct} ${circumference}`;

  return (
    <>
      {/* ─────────────  DESKTOP: EDITORIAL THREE-ZONE ACCOUNT  ───────────── */}
      <div className="hidden md:block min-h-screen" style={{ background: "var(--app-bg)" }}>
        <header className="flex items-stretch border-b-2 border-[var(--app-dark)] max-w-[1600px] mx-auto w-full">
          <div className="px-8 py-6 flex items-center border-r border-[var(--app-border)]">
            <h1 className="font-serif text-[30px] italic leading-none text-[var(--app-dark)]">SoulGuide</h1>
          </div>
          <div className="flex-1 flex items-center px-8">
            <span className="font-serif text-[18px] italic text-[var(--app-gray-lt)]">Pilgrim Profile</span>
          </div>
          <button onClick={handleLogout} className="px-8 flex items-center">
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-danger)]">Sign Out</span>
          </button>
        </header>

        <div className="grid grid-cols-[1fr_1.4fr_1fr] max-w-[1600px] mx-auto items-stretch" style={{ minHeight: "calc(100vh - 89px)" }}>
          {/* LEFT — Profile + Journey Statistics */}
          <section className="border-r border-[var(--app-dark)]">
            <div className="px-6 py-4 border-b border-[var(--app-dark)]">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">Profile</span>
            </div>
            <div className="flex flex-col items-center px-6 py-10 border-b border-[var(--app-border)]">
              <div className="relative w-[116px] h-[116px] flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 116 116"><circle cx="58" cy="58" r="56" fill="none" stroke="var(--app-border)" strokeWidth="3" /></svg>
                <svg className="absolute inset-0 w-full h-full -rotate-[110deg]" viewBox="0 0 116 116"><circle cx="58" cy="58" r="56" fill="none" stroke="var(--app-green)" strokeWidth="3" strokeDasharray={dashArray} /></svg>
                <div className="absolute inset-[11px] rounded-full flex items-center justify-center" style={{ background: "var(--app-bg-inner)" }}>
                  <span className="font-serif text-[32px] text-[var(--app-dark)]">{userInitials}</span>
                </div>
              </div>
              <h2 className="font-serif text-[28px] text-[var(--app-dark)] mt-6 text-center">{userName}</h2>
              {memberSince && <p className="text-[10px] font-semibold tracking-[0.15em] text-[var(--app-gray-lt)] mt-2 uppercase">Member Since {memberSince}</p>}
              {archetype && <p className="text-[13px] text-[var(--app-green)] mt-3 text-center font-medium">{archetype.name}</p>}
            </div>
            <div className="px-6 py-4 border-b border-[var(--app-border)]">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">Journey Statistics</span>
            </div>
            <div className="grid grid-cols-2">
              {[
                { n: currentStreak, l: "Day Streak" },
                { n: stats?.practicesCompleted ?? 0, l: "Practices" },
                { n: stats?.longestStreak ?? 0, l: "Longest Streak" },
                { n: stats?.conversationCount ?? 0, l: "Sessions" },
              ].map((s, i) => (
                <div key={i} className={`px-6 py-8 border-b border-[var(--app-border)] ${i % 2 === 0 ? "border-r border-[var(--app-border)]" : ""}`}>
                  <span className="font-serif text-[44px] leading-none text-[var(--app-dark)]">{s.n}</span>
                  <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--app-gray-lt)] mt-3">{s.l}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CENTER — Favorite Scripture + Settings */}
          <section className="border-r border-[var(--app-dark)]">
            <div className="px-7 py-4 border-b border-[var(--app-dark)]">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">Favorite Scripture</span>
            </div>
            <div className="px-7 py-10 border-b border-[var(--app-border)]">
              {savedPassages?.passages?.length ? (
                <div className="border border-[var(--app-border)] bg-[var(--app-white)] px-8 py-10 relative">
                  <p className="font-serif text-[26px] italic leading-[1.4] text-[var(--app-dark)] text-center">"{savedPassages.passages[0].text}"</p>
                  <p className="text-[12px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)] mt-6 text-center">— {savedPassages.passages[0].reference}</p>
                </div>
              ) : (
                <p className="font-serif text-[20px] italic text-[var(--app-gray-lt)] text-center py-8">Highlight verses in the reader to save your favorites here.</p>
              )}
            </div>
            <div className="px-7 py-4 border-b border-[var(--app-border)]">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">Account Settings</span>
            </div>
            {/* Beta */}
            <div className="px-7 py-6 border-b border-[var(--app-border)] flex justify-between items-center">
              <div>
                <p className="font-serif text-[18px] text-[var(--app-dark)]">Beta Access</p>
                <p className="text-[13px] text-[var(--app-gray-lt)] mt-0.5">{isBetaUser ? "Enrolled in early features" : "Not enrolled"}</p>
              </div>
              <button onClick={toggleBeta} disabled={betaLoading || isBetaUser} className="w-12 h-6 rounded-full relative transition-colors" style={{ background: isBetaUser ? "var(--app-green)" : "var(--app-border)" }}>
                <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: isBetaUser ? "calc(100% - 20px)" : "4px" }} />
              </button>
            </div>
            {/* Dark mode */}
            <div className="px-7 py-6 border-b border-[var(--app-border)] flex justify-between items-center">
              <div>
                <p className="font-serif text-[18px] text-[var(--app-dark)]">Dark Mode</p>
                <p className="text-[13px] text-[var(--app-gray-lt)] mt-0.5">A quiet, candlelit palette for evening prayer</p>
              </div>
              <button onClick={toggleTheme} role="switch" aria-checked={theme === "dark"} aria-label="Toggle dark mode" className="w-12 h-6 rounded-full relative transition-colors" style={{ background: theme === "dark" ? "var(--app-green)" : "var(--app-border)" }}>
                <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: theme === "dark" ? "calc(100% - 20px)" : "4px" }} />
              </button>
            </div>
            {/* Plan */}
            <div className="px-7 py-6 border-b border-[var(--app-border)] flex justify-between items-center">
              <div>
                <p className="font-serif text-[18px] text-[var(--app-dark)]">Current Plan</p>
                <p className="text-[13px] text-[var(--app-gray-lt)] mt-0.5">Free forever</p>
              </div>
              <span className="text-[11px] font-semibold text-[var(--app-green)] border border-[var(--app-green)] rounded-full px-4 py-1.5 uppercase tracking-wider">Free</span>
            </div>
          </section>

          {/* RIGHT — This Week + Saved Passages */}
          <section>
            <div className="px-6 py-4 border-b border-[var(--app-dark)]">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">Weekly Reflection</span>
            </div>
            <WeeklyRecapCard />
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--app-dark)]">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">Weekly Path</span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">{weekRange}</span>
            </div>
            <div className="px-6 py-6 border-b border-[var(--app-border)]">
              <div className="flex justify-between gap-1">
                {weekDays.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--app-gray-lt)]">{d.letter}</span>
                    <div className="w-full aspect-square flex items-center justify-center text-[12px] font-semibold"
                      style={{ background: d.isComplete ? "var(--cta-bg)" : "transparent", color: d.isComplete ? "var(--cta-fg)" : "var(--app-dark)", border: d.isComplete ? "none" : d.isToday ? "2px solid var(--app-green)" : "1px solid var(--app-border)" }}>
                      {format(addDays(weekStart, i), "d")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--app-border)]">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">Saved Passages</span>
              <button onClick={() => setLocation("/bible")} className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">View All</button>
            </div>
            {savedPassages?.passages?.length ? (
              savedPassages.passages.slice(0, 4).map((p, i) => (
                <div key={i} className="px-6 py-5 border-b border-[var(--app-border)]">
                  <p className="font-serif text-[16px] text-[var(--app-dark)] mb-1">{p.reference}</p>
                  <p className="text-[13px] text-[var(--app-gray-lt)] leading-relaxed" style={{ WebkitLineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>{p.text}</p>
                </div>
              ))
            ) : (
              <div className="px-6 py-6"><p className="text-[14px] text-[var(--app-gray-lt)] italic">No saved passages yet.</p></div>
            )}
          </section>
        </div>
      </div>

      {/* ─────────────  MOBILE: ORIGINAL (UNTOUCHED)  ───────────── */}
      <div className="md:hidden min-h-screen pb-20" style={{ background: "var(--app-bg)" }}>
      {/* Header */}
      <header className="flex bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <div className="flex-1 py-6 px-6 flex items-center">
          <h1 className="font-serif text-[26px] leading-none text-[var(--app-dark)] tracking-wide">Pilgrim Profile</h1>
        </div>
        <div className="border-l border-[var(--app-border)] py-6 px-7 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--app-gray)" strokeWidth="0.75" strokeLinecap="square">
            <line x1="2" y1="7" x2="22" y2="7" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="17" x2="22" y2="17" />
          </svg>
        </div>
      </header>

      {/* Profile hero */}
      <section className="flex flex-col items-center pt-12 pb-10 bg-[var(--app-white)] border-b border-[var(--app-border)]">
        {/* Avatar with circular progress */}
        <div className="relative w-[116px] h-[116px] flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 116 116">
            <circle cx="58" cy="58" r="56" fill="none" stroke="var(--app-border)" strokeWidth="3" />
          </svg>
          <svg className="absolute inset-0 w-full h-full -rotate-[110deg]" viewBox="0 0 116 116">
            <circle cx="58" cy="58" r="56" fill="none" stroke="var(--app-green)" strokeWidth="3"
              strokeDasharray={dashArray} />
          </svg>
          <div className="absolute inset-[11px] rounded-full flex items-center justify-center" style={{ background: "var(--app-bg-inner)" }}>
            <span className="font-serif text-[32px] text-[var(--app-dark)]">{userInitials}</span>
          </div>
        </div>

        <h2 className="font-serif text-[30px] font-bold mt-7 tracking-tight text-[var(--app-dark)]" data-testid="text-user-name">{userName}</h2>
        {memberSince && <p className="text-[10px] font-semibold tracking-[0.15em] text-[var(--app-gray-lt)] mt-2.5 uppercase">Member Since {memberSince}</p>}

        {archetype && (
          <p className="text-[13px] text-[var(--app-green)] mt-2 font-medium">{archetype.name} · {archetype.description}</p>
        )}

        {/* Stats */}
        <div className="flex gap-16 mt-9">
          <div className="flex flex-col items-center">
            <span className="font-serif text-[22px] text-[var(--app-dark)] leading-none mb-2">{currentStreak}</span>
            <span className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase">Day Streak</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-serif text-[22px] text-[var(--app-dark)] leading-none mb-2">{stats?.conversationCount ?? 0}</span>
            <span className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase">Sessions</span>
          </div>
        </div>
      </section>

      {/* Daily Progress */}
      <section className="flex flex-col">
        <div className="section-band">
          <span>Daily Progress</span>
          <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--app-gray-lt)] uppercase">{weekRange}</span>
        </div>
        <div className="flex justify-between px-6 py-6 bg-[var(--app-white)]">
          {weekDays.map((d, i) => (
            <div key={i} className="w-10 h-10 flex items-center justify-center text-[13px] font-medium"
              style={{
                background: d.isComplete ? "var(--cta-bg)" : "transparent",
                color: d.isComplete ? "var(--cta-fg)" : "var(--app-dark)",
                border: d.isComplete ? "none" : "1px solid var(--app-border)",
              }}>
              {d.letter}
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Reflection */}
      <section className="flex flex-col mt-4">
        <div className="section-band"><span>Weekly Reflection</span></div>
        <WeeklyRecapCard />
      </section>

      {/* Saved Passages */}
      <section className="flex flex-col mt-4">
        <div className="section-band">
          <span>Saved Passages</span>
          <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--app-gray-lt)] uppercase cursor-pointer" onClick={() => setLocation("/bible")}>View All</span>
        </div>
        {savedPassages?.passages?.length ? (
          savedPassages.passages.slice(0, 3).map((p, i) => (
            <article key={i} className="px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
              <h4 className="font-serif text-[18px] font-bold text-[var(--app-dark)] mb-1.5">{p.reference}</h4>
              <p className="text-[15px] text-[var(--app-gray-lt)]">{p.text}</p>
            </article>
          ))
        ) : (
          <article className="px-6 py-6 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
            <p className="text-[15px] text-[var(--app-gray-lt)] italic">No saved passages yet. Highlight verses in the Bible reader to save them here.</p>
          </article>
        )}
      </section>

      {/* Preferences */}
      <section className="flex flex-col mt-4">
        <div className="section-band"><span>Preferences</span></div>

        {/* Beta access */}
        <div className="px-6 py-5 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex justify-between items-center">
          <div>
            <label className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase block">Beta Access</label>
            <p className="font-serif text-[18px] text-[var(--app-dark)]">{isBetaUser ? "Joined" : "Not enrolled"}</p>
          </div>
          <button
            onClick={toggleBeta}
            disabled={betaLoading || isBetaUser}
            className="w-12 h-6 rounded-full relative transition-colors"
            style={{ background: isBetaUser ? "var(--app-green)" : "var(--app-border)" }}
            data-testid="button-beta-access"
          >
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
              style={{ left: isBetaUser ? "calc(100% - 20px)" : "4px" }} />
          </button>
        </div>

        {/* Daily reminder placeholder */}
        <div className="px-6 py-5 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex justify-between items-center">
          <div>
            <label className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase block">Daily Reminder</label>
            <p className="font-serif text-[18px] text-[var(--app-dark)]">Coming soon</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-border)" strokeWidth="1.5"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </section>

      {/* Membership */}
      <section className="flex flex-col mt-4">
        <div className="section-band"><span>Membership</span></div>
        <div className="px-6 py-5 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex justify-between items-center">
          <div>
            <label className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase block">Current Plan</label>
            <p className="font-serif text-[18px] text-[var(--app-dark)]">Free</p>
          </div>
          <span className="text-[11px] font-semibold text-[var(--app-green)] border border-[var(--app-green)] px-3 py-1 uppercase tracking-wider">Free forever</span>
        </div>
      </section>

      {/* Appearance */}
      <div className="section-band"><span>Appearance</span></div>
      <div className="px-6 py-5 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex items-center justify-between">
        <span className="text-[14px] text-[var(--app-dark)]">Dark mode</span>
        <button
          onClick={toggleTheme}
          role="switch"
          aria-checked={theme === "dark"}
          aria-label="Toggle dark mode"
          className="relative w-12 h-7 transition-colors"
          style={{ background: theme === "dark" ? "var(--app-green)" : "var(--app-border)" }}
          data-testid="button-theme-toggle"
        >
          <span
            className="absolute top-1 w-5 h-5 bg-white transition-all"
            style={{ left: theme === "dark" ? "26px" : "4px" }}
          />
        </button>
      </div>

      {/* Logout */}
      <div className="p-6 mt-4">
        <button
          onClick={handleLogout}
          className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase transition-colors"
          style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
          data-testid="button-logout"
        >
          Sign out
        </button>
      </div>
      </div>
    </>
  );
}
