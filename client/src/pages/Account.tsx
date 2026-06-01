import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import type { UserPersona } from "@shared/schema";

interface UserStats { conversationCount: number; messageCount: number; practicesCompleted: number; currentStreak: number; longestStreak: number; }

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
    <div className="min-h-screen pb-20" style={{ background: "#EBEAE5" }}>
      {/* Header */}
      <header className="flex bg-white border-b border-[#D8D7D2]">
        <div className="flex-1 py-6 px-6 flex items-center">
          <h1 className="font-serif text-[26px] leading-none text-black tracking-wide">Profile</h1>
        </div>
        <div className="border-l border-[#D8D7D2] py-6 px-7 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="0.75" strokeLinecap="square">
            <line x1="2" y1="7" x2="22" y2="7" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="17" x2="22" y2="17" />
          </svg>
        </div>
      </header>

      {/* Profile hero */}
      <section className="flex flex-col items-center pt-12 pb-10 bg-white border-b border-[#D8D7D2]">
        {/* Avatar with circular progress */}
        <div className="relative w-[116px] h-[116px] flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 116 116">
            <circle cx="58" cy="58" r="56" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          </svg>
          <svg className="absolute inset-0 w-full h-full -rotate-[110deg]" viewBox="0 0 116 116">
            <circle cx="58" cy="58" r="56" fill="none" stroke="#1b291d" strokeWidth="3"
              strokeDasharray={dashArray} />
          </svg>
          <div className="absolute inset-[11px] rounded-full flex items-center justify-center" style={{ background: "#e9e8e4" }}>
            <span className="font-serif text-[32px] text-black">{userInitials}</span>
          </div>
        </div>

        <h2 className="font-serif text-[30px] font-bold mt-7 tracking-tight text-black" data-testid="text-user-name">{userName}</h2>
        {memberSince && <p className="text-[10px] font-semibold tracking-[0.15em] text-[#73726C] mt-2.5 uppercase">Member Since {memberSince}</p>}

        {archetype && (
          <p className="text-[13px] text-[#1b291d] mt-2 font-medium">{archetype.name} · {archetype.description}</p>
        )}

        {/* Stats */}
        <div className="flex gap-16 mt-9">
          <div className="flex flex-col items-center">
            <span className="font-serif text-[22px] text-black leading-none mb-2">{currentStreak}</span>
            <span className="text-[10px] font-semibold tracking-[0.1em] text-[#73726C] uppercase">Day Streak</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-serif text-[22px] text-black leading-none mb-2">{stats?.conversationCount ?? 0}</span>
            <span className="text-[10px] font-semibold tracking-[0.1em] text-[#73726C] uppercase">Sessions</span>
          </div>
        </div>
      </section>

      {/* Daily Progress */}
      <section className="flex flex-col">
        <div className="section-band">
          <span>Daily Progress</span>
          <span className="text-[11px] font-medium tracking-[0.08em] text-[#73726C] uppercase">{weekRange}</span>
        </div>
        <div className="flex justify-between px-6 py-6 bg-white">
          {weekDays.map((d, i) => (
            <div key={i} className="w-10 h-10 flex items-center justify-center text-[13px] font-medium"
              style={{
                background: d.isComplete ? "#1b291d" : "transparent",
                color: d.isComplete ? "#fff" : "#111",
                border: d.isComplete ? "none" : "1px solid #D8D7D2",
              }}>
              {d.letter}
            </div>
          ))}
        </div>
      </section>

      {/* Saved Passages */}
      <section className="flex flex-col mt-4">
        <div className="section-band">
          <span>Saved Passages</span>
          <span className="text-[11px] font-medium tracking-[0.08em] text-[#73726C] uppercase cursor-pointer" onClick={() => setLocation("/bible")}>View All</span>
        </div>
        {savedPassages?.passages?.length ? (
          savedPassages.passages.slice(0, 3).map((p, i) => (
            <article key={i} className="px-6 py-6 bg-white border-b border-[#f0f0ee]">
              <h4 className="font-serif text-[18px] font-bold text-black mb-1.5">{p.reference}</h4>
              <p className="text-[15px] text-[#73726C]">{p.text}</p>
            </article>
          ))
        ) : (
          <article className="px-6 py-6 bg-white border-b border-[#f0f0ee]">
            <p className="text-[15px] text-[#73726C] italic">No saved passages yet. Highlight verses in the Bible reader to save them here.</p>
          </article>
        )}
      </section>

      {/* Preferences */}
      <section className="flex flex-col mt-4">
        <div className="section-band"><span>Preferences</span></div>

        {/* Beta access */}
        <div className="px-6 py-5 bg-white border-b border-[#f0f0ee] flex justify-between items-center">
          <div>
            <label className="text-[10px] font-semibold tracking-[0.1em] text-[#73726C] uppercase block">Beta Access</label>
            <p className="font-serif text-[18px] text-black">{isBetaUser ? "Joined" : "Not enrolled"}</p>
          </div>
          <button
            onClick={toggleBeta}
            disabled={betaLoading || isBetaUser}
            className="w-12 h-6 rounded-full relative transition-colors"
            style={{ background: isBetaUser ? "#1b291d" : "#D8D7D2" }}
            data-testid="button-beta-access"
          >
            <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
              style={{ left: isBetaUser ? "calc(100% - 20px)" : "4px" }} />
          </button>
        </div>

        {/* Daily reminder placeholder */}
        <div className="px-6 py-5 bg-white border-b border-[#f0f0ee] flex justify-between items-center">
          <div>
            <label className="text-[10px] font-semibold tracking-[0.1em] text-[#73726C] uppercase block">Daily Reminder</label>
            <p className="font-serif text-[18px] text-black">Coming soon</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D8D7D2" strokeWidth="1.5"><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </section>

      {/* Membership */}
      <section className="flex flex-col mt-4">
        <div className="section-band"><span>Membership</span></div>
        <div className="px-6 py-5 bg-white border-b border-[#f0f0ee] flex justify-between items-center">
          <div>
            <label className="text-[10px] font-semibold tracking-[0.1em] text-[#73726C] uppercase block">Current Plan</label>
            <p className="font-serif text-[18px] text-black">Free</p>
          </div>
          <span className="text-[11px] font-semibold text-[#1b291d] border border-[#1b291d] px-3 py-1 uppercase tracking-wider">Free forever</span>
        </div>
      </section>

      {/* Logout */}
      <div className="p-6 mt-4">
        <button
          onClick={handleLogout}
          className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase transition-colors"
          style={{ background: "#1b291d", color: "#fff" }}
          data-testid="button-logout"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
