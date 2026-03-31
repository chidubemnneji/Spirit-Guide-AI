import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, ChevronRight, Flame, BookOpen,
  Bell, Moon, Sun, X, Loader2,
  MessageCircle, Zap, Cloud, Heart, HelpCircle, Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserPersona } from "@shared/schema";

interface UserStats {
  conversationCount: number;
  messageCount: number;
  practicesCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

// ── Archetype display map ────────────────────────────────────────────────────
const ARCHETYPE_DISPLAY: Record<string, { name: string; description: string }> = {
  wounded_seeker:    { name: "Wounded Seeker",    description: "Finding God through the pain" },
  eager_builder:     { name: "Eager Builder",     description: "Growing deliberately, day by day" },
  curious_explorer:  { name: "Curious Explorer",  description: "Following questions toward faith" },
  returning_prodigal:{ name: "Returning Prodigal",description: "Coming home after time away" },
  struggling_saint:  { name: "Struggling Saint",  description: "Faithful despite the doubts" },
};

const ARCHETYPE_EXPLAINER: Record<string, string> = {
  wounded_seeker:    "You're carrying pain — maybe loss, betrayal, or years of unanswered prayer. Your faith hasn't disappeared but it's bruised. Your companion meets you in that honesty rather than rushing you past it.",
  eager_builder:     "You show up consistently and want to grow. You're less interested in feelings and more in formation — building habits, understanding scripture, becoming someone different. Your companion helps you build with intention.",
  curious_explorer:  "Questions don't scare you — they drive you. You follow threads, challenge assumptions, and want a faith that can hold up to scrutiny. Your companion engages your mind, not just your heart.",
  returning_prodigal:"You've been away — maybe a long time. You're finding your way back, carrying some shame about the distance. Your companion doesn't make you earn trust back. You start where you are.",
  struggling_saint:  "You've been faithful for a long time, but right now it's hard. The gap between what you know and what you feel is wide. Your companion sits with you in that tension without offering easy answers.",
};

const STRUGGLE_DISPLAY: Record<string, string> = {
  distant_from_god:  "Feeling distant from God",
  wrestling_doubts:  "Wrestling with doubts",
  feel_alone:        "Feeling alone in faith",
  guilt_shame:       "Carrying guilt or shame",
  life_overwhelming: "Life feeling overwhelming",
  new_to_faith:      "New to faith",
};

const GOAL_DISPLAY: Record<string, string> = {
  gods_presence:     "Feel God's presence daily",
  doubts_controlled: "My doubts don't control me",
  prayer_meaningful: "Prayer means something to me",
  free_from_guilt:   "Free from guilt I'm carrying",
  faith_steady:      "Faith is steady, not up and down",
  understand_bible:  "Understand the Bible better",
  peace_not_anxiety: "Peace instead of anxiety",
  friends_understand:"Friends who get my journey",
};

// ── Relational description based on conversations ───────────────────────────
function getRelationalDescription(conversationCount: number): string {
  if (conversationCount === 0) return "Your journey together is just beginning.";
  if (conversationCount < 3)   return "You've just started getting to know each other.";
  if (conversationCount < 8)   return "Your companion is learning your story.";
  if (conversationCount < 20)  return "Your companion knows where you've been.";
  return "Your companion has walked a real road with you.";
}

const STRUGGLE_OPTIONS = [
  { id: "distant_from_god",  icon: <Cloud className="w-5 h-5 text-primary" />,       text: "I feel distant from God" },
  { id: "wrestling_doubts",  icon: <HelpCircle className="w-5 h-5 text-primary" />,  text: "I'm wrestling with doubts" },
  { id: "feel_alone",        icon: <MessageCircle className="w-5 h-5 text-primary" />,text: "I feel alone in my faith" },
  { id: "guilt_shame",       icon: <Heart className="w-5 h-5 text-primary" />,       text: "Carrying guilt or shame" },
  { id: "life_overwhelming", icon: <Zap className="w-5 h-5 text-primary" />,         text: "Life is overwhelming" },
  { id: "new_to_faith",      icon: <Sprout className="w-5 h-5 text-primary" />,      text: "New to faith" },
];

const GOAL_OPTIONS = [
  { id: "gods_presence",    text: "Feel God's presence daily" },
  { id: "doubts_controlled",text: "My doubts don't control me" },
  { id: "prayer_meaningful",text: "Prayer means something to me" },
  { id: "free_from_guilt",  text: "Free from guilt I'm carrying" },
  { id: "faith_steady",     text: "Faith is steady, not up and down" },
  { id: "understand_bible", text: "Understand the Bible better" },
  { id: "peace_not_anxiety",text: "Peace instead of anxiety" },
  { id: "friends_understand",text: "Friends who get my journey" },
];

// ── Edit Journey sheet ───────────────────────────────────────────────────────
function EditJourneySheet({
  open,
  persona,
  onClose,
}: {
  open: boolean;
  persona: UserPersona | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [struggle, setStruggle] = useState<string>(persona?.primaryStruggle || "");
  const [goals, setGoals] = useState<string[]>(
    (persona?.transformationGoals as string[]) || []
  );

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/persona", {
        primaryStruggle: struggle,
        transformationGoals: goals,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/persona"] });
      toast({ title: "Journey updated", description: "Your companion will adapt to where you are now." });
      onClose();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Couldn't save", description: "Please try again." });
    },
  });

  const toggleGoal = (id: string) => {
    setGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[92vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <div>
                <h2 className="font-serif text-lg font-semibold">
                  {step === 1 ? "Where are you right now?" : "What would feel like a win?"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step === 1
                    ? "Your companion adapts as you grow"
                    : "Pick up to 3 — your goals can change any time"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {step === 1 ? (
                STRUGGLE_OPTIONS.map((opt, i) => (
                  <OptionCard
                    key={opt.id}
                    id={opt.id}
                    text={opt.text}
                    icon={opt.icon}
                    selected={struggle === opt.id}
                    onClick={() => setStruggle(opt.id)}
                    index={i}
                  />
                ))
              ) : (
                GOAL_OPTIONS.map((opt, i) => (
                  <OptionCard
                    key={opt.id}
                    id={opt.id}
                    text={opt.text}
                    selected={goals.includes(opt.id)}
                    disabled={!goals.includes(opt.id) && goals.length >= 3}
                    onClick={() => toggleGoal(opt.id)}
                    index={i}
                  />
                ))
              )}
            </div>

            <div className="px-5 py-4 border-t border-border flex gap-3">
              {step === 2 && (
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl h-12"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              )}
              <Button
                className="flex-1 rounded-2xl h-12"
                disabled={step === 1 ? !struggle : goals.length === 0 || updateMutation.isPending}
                onClick={() => {
                  if (step === 1) setStep(2);
                  else updateMutation.mutate();
                }}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step === 1 ? (
                  "Next"
                ) : (
                  "Save journey"
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest px-1 mb-2 mt-5 first:mt-0">
      {children}
    </p>
  );
}

// ── Pref row ──────────────────────────────────────────────────────────────────
function PrefRow({
  icon: Icon,
  label,
  value,
  onClick,
  disabled = false,
  right,
  testId,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  disabled?: boolean;
  right?: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/50 transition-colors text-left disabled:opacity-60"
      data-testid={testId}
    >
      <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      {right ?? (
        value
          ? <span className="text-sm text-muted-foreground">{value}</span>
          : onClick && <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}

// ── Stat cell ─────────────────────────────────────────────────────────────────
function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-muted/50 rounded-2xl p-3.5 flex flex-col gap-1">
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(); }}
      className={cn(
        "w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0",
        on ? "bg-primary" : "bg-border"
      )}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white absolute top-0.5"
        animate={{ left: on ? "calc(100% - 22px)" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Account() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isManualOverride, resetToSystem } = useTheme();
  const { toast } = useToast();
  const [editJourneyOpen, setEditJourneyOpen] = useState(false);
  const [showArchetypeInfo, setShowArchetypeInfo] = useState(false);

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const { data: personaData } = useQuery<UserPersona>({
    queryKey: ["/api/persona"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const userName = user?.name || "Friend";
  const firstName = userName.split(" ")[0];
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const currentStreak = stats?.currentStreak ?? 0;

  const archetypeKey = personaData?.graceArchetype || "";
  const archetype = ARCHETYPE_DISPLAY[archetypeKey];
  const goals = ((personaData?.transformationGoals as string[]) || [])
    .map(g => GOAL_DISPLAY[g] || g.replace(/_/g, " "));
  const struggle = personaData?.primaryStruggle
    ? STRUGGLE_DISPLAY[personaData.primaryStruggle] || personaData.primaryStruggle.replace(/_/g, " ")
    : null;
  const conversationCount = stats?.conversationCount ?? 0;
  const relationalDescription = getRelationalDescription(conversationCount);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between px-5 h-14">
          <span className="font-serif text-lg font-semibold">Profile</span>
        </div>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto">

        {/* ── Identity card ── */}
        <motion.div
          className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3 mb-1"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Avatar className="w-14 h-14" data-testid="avatar-user">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-foreground truncate" data-testid="text-user-name">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
              {user?.email}
            </p>
          </div>
          <div className="flex flex-col items-center gap-0.5 bg-primary/8 rounded-xl px-3 py-2 flex-shrink-0">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-base font-bold text-primary leading-none">{currentStreak}</span>
            <span className="text-[10px] text-muted-foreground">days</span>
          </div>
        </motion.div>

        {/* ── Your Journey ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
        >
          <SectionLabel>Your journey</SectionLabel>
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            {archetype && (
              <div className="px-4 pt-4 pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Archetype</p>
                  <button
                    onClick={() => setShowArchetypeInfo(!showArchetypeInfo)}
                    className="text-[10px] text-primary font-medium mb-1"
                  >
                    {showArchetypeInfo ? "Less" : "What's this?"}
                  </button>
                </div>
                <p className="text-sm font-semibold text-foreground">{archetype.name}</p>
                <p className="text-xs text-muted-foreground">{archetype.description}</p>
                <AnimatePresence>
                  {showArchetypeInfo && ARCHETYPE_EXPLAINER[archetypeKey] && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50 leading-relaxed overflow-hidden"
                    >
                      {ARCHETYPE_EXPLAINER[archetypeKey]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}
            {struggle && (
              <div className="px-4 py-3 border-b border-border/50">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Current focus</p>
                <p className="text-sm text-foreground capitalize">{struggle}</p>
              </div>
            )}
            {goals.length > 0 && (
              <div className="px-4 py-3 border-b border-border/50">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Goals</p>
                <div className="flex flex-wrap gap-1.5">
                  {goals.map(g => (
                    <span
                      key={g}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/8 text-primary capitalize"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground italic flex-1 pr-4">
                {relationalDescription}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditJourneyOpen(true)}
                className="text-primary text-xs font-medium h-8 rounded-xl hover:bg-primary/8 flex-shrink-0"
                data-testid="button-edit-journey"
              >
                Edit →
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ── Progress ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          <SectionLabel>Progress</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <StatCell value={stats?.conversationCount ?? 0} label="Conversations" />
            <StatCell value={stats?.messageCount ?? 0} label="Messages sent" />
            <StatCell value={stats?.practicesCompleted ?? 0} label="Practices done" />
            <StatCell value={stats?.longestStreak ?? 0} label="Longest streak" />
          </div>
        </motion.div>

        {/* ── Preferences ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
        >
          <SectionLabel>Preferences</SectionLabel>
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/50">
            <PrefRow
              icon={BookOpen}
              label="Prayer Journal"
              onClick={() => setLocation("/journal")}
              testId="button-prayer-journal"
            />
            <PrefRow
              icon={Bell}
              label="Daily reminder"
              value="8:25 AM"
              disabled
              testId="button-daily-reminder"
            />
            <PrefRow
              icon={theme === "dark" ? Moon : Sun}
              label="Dark mode"
              value={!isManualOverride ? "Auto" : undefined}
              onClick={toggleTheme}
              right={
                <div className="flex items-center gap-2">
                  {isManualOverride && (
                    <button
                      onClick={e => { e.stopPropagation(); resetToSystem(); }}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Auto
                    </button>
                  )}
                  <Toggle
                    on={theme === "dark"}
                    onToggle={toggleTheme}
                  />
                </div>
              }
              testId="button-dark-mode"
            />
          </div>
        </motion.div>

        {/* ── Log out ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22 }}
          className="mt-5"
        >
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-4 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </motion.div>

        {/* ── Delete account ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.28 }}
          className="mt-3 pb-2"
        >
          <button
            onClick={async () => {
              if (window.confirm("Delete your account? This permanently removes all your conversations, journal entries, and personal data. This cannot be undone.")) {
                await apiRequest("DELETE", "/api/auth/account");
                window.location.href = "/";
              }
            }}
            className="w-full text-xs text-muted-foreground/40 hover:text-destructive transition-colors py-2"
          >
            Delete account and all data
          </button>
        </motion.div>

        {/* ── Legal footer ── */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</button>
          <span className="w-1 h-1 rounded-full bg-border" />
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</button>
          <span className="w-1 h-1 rounded-full bg-border" />
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Help</button>
        </div>

      </main>

      <EditJourneySheet
        open={editJourneyOpen}
        persona={personaData ?? null}
        onClose={() => setEditJourneyOpen(false)}
      />
    </div>
  );
}
