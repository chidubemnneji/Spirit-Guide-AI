import { useState } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, MessageCircle, Sparkles, Timer, Moon, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Devotional } from "@shared/schema";
import { useFlags } from "@/hooks/useFlags";

function SectionBlock({
  label,
  content,
  accent = false,
  index = 0,
}: {
  label?: string;
  content: string;
  accent?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className={cn(
        "rounded-2xl p-5",
        accent
          ? "bg-primary/8 border border-primary/20"
          : "bg-card border border-border/50"
      )}
    >
      {label && (
        <p className={cn(
          "text-[10px] font-semibold uppercase tracking-widest mb-2",
          accent ? "text-primary" : "text-muted-foreground"
        )}>
          {label}
        </p>
      )}
      <p className={cn(
        "leading-relaxed text-sm",
        accent ? "font-serif text-base italic text-foreground" : "text-foreground/90"
      )}>
        {content}
      </p>
    </motion.div>
  );
}

function PracticeBlock({ content, index }: { content: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className="bg-card border border-border/50 rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Try this today
        </p>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{content}</p>
    </motion.div>
  );
}

function PrayerBlock({ content, index }: { content: string; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className="bg-primary/5 border border-primary/15 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Closing prayer
          </p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-primary" />
          : <ChevronDown className="w-4 h-4 text-primary" />
        }
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="font-serif text-sm italic text-foreground/90 leading-relaxed px-5 pb-5">
              "{content}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimedModeSection() {
  const flags = useFlags();
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [timedText, setTimedText] = useState<string | null>(null);
  const [eveningText, setEveningText] = useState<string | null>(null);
  const [mode, setMode] = useState<"timed" | "evening" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const timedMutation = useMutation({
    mutationFn: async (duration: number) => {
      const res = await fetch(`/api/devotional/timed?duration=${duration}`, { credentials: "include" });
      return res.json();
    },
    onSuccess: (data) => {
      setTimedText(data.text);
      setMode("timed");
    },
  });

  const eveningMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/prayer/evening", { credentials: "include" });
      return res.json();
    },
    onSuccess: (data) => {
      setEveningText(data.text);
      setMode("evening");
    },
  });

  const playText = async (text: string) => {
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, voice: "nova" }),
      });
      const data = await res.json();
      if (data.audio) {
        const blob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        const el = new Audio(url);
        el.onended = () => setIsPlaying(false);
        el.play();
        setAudio(el);
        setIsPlaying(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePlay = (text: string) => {
    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
    } else {
      playText(text);
    }
  };

  if (!flags.TIMED_DEVOTIONALS && !flags.EVENING_PRAYER) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3 pt-2"
    >
      {/* Timed devotionals */}
      {flags.TIMED_DEVOTIONALS && !mode && (
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Guided Meditation</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            A spoken devotional timed to your schedule
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[2, 5, 10, 15].map(d => (
              <button
                key={d}
                onClick={() => { setSelectedDuration(d); timedMutation.mutate(d); }}
                className={cn(
                  "py-2.5 rounded-xl text-sm font-semibold border transition-all",
                  selectedDuration === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 hover:border-primary/40"
                )}
              >
                {d}m
              </button>
            ))}
          </div>
          {timedMutation.isPending && (
            <p className="text-xs text-muted-foreground text-center mt-3 animate-pulse">
              Preparing your meditation...
            </p>
          )}
        </div>
      )}

      {/* Evening prayer */}
      {flags.EVENING_PRAYER && !mode && (
        <button
          onClick={() => eveningMutation.mutate()}
          disabled={eveningMutation.isPending}
          className="w-full bg-card border border-border/50 rounded-2xl p-5 text-left hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Evening Prayer</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {eveningMutation.isPending ? "Preparing your prayer..." : "A gentle prayer to close your day"}
          </p>
        </button>
      )}

      {/* Generated content */}
      {(timedText || eveningText) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {mode === "timed" ? <Timer className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                {mode === "timed" ? `${selectedDuration}-Minute Meditation` : "Evening Prayer"}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl gap-1.5"
              onClick={() => togglePlay((timedText || eveningText)!)}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? "Pause" : "Listen"}
            </Button>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {timedText || eveningText}
          </p>
          <button
            onClick={() => { setMode(null); setTimedText(null); setEveningText(null); setSelectedDuration(null); }}
            className="text-xs text-muted-foreground mt-4 hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function DevotionalReading() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data, isLoading } = useQuery<{ success: boolean; data: Devotional; completedTaskIds: string[] }>({
    queryKey: ["/api/devotional/today"],
    enabled: !!user,
  });

  const devotional = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!devotional) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-muted-foreground mb-4">Today's devotional isn't ready yet.</p>
        <Button onClick={() => setLocation("/devotion")} variant="outline" className="rounded-xl">
          Go back
        </Button>
      </div>
    );
  }

  const sections = [
    devotional.openingHook && { type: "block", label: undefined, content: devotional.openingHook, accent: false },
    devotional.reflectionContent && { type: "block", label: "Reflection", content: devotional.reflectionContent, accent: false },
    devotional.todaysPractice && { type: "practice", content: devotional.todaysPractice },
    devotional.closingPrayer && { type: "prayer", content: devotional.closingPrayer },
  ].filter(Boolean) as Array<{ type: string; label?: string; content: string; accent?: boolean }>;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Audio Player overlay */}
      {showAudioPlayer && (
        <AudioPlayer
          title={devotional?.title || "Guided Reflection"}
          subtitle={devotional?.scriptureReference || "A moment of stillness"}
          duration={selectedDuration || 600}
          sections={["Presence", "Gratitude", "Review"]}
          onClose={() => setShowAudioPlayer(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/devotion")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-serif text-base font-semibold flex-1">Today's Devotional</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAudioPlayer(true)}
            className="gap-1.5 text-xs font-semibold uppercase tracking-wider"
          >
            <Play className="w-3.5 h-3.5" />
            Listen
          </Button>
        </div>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* Scripture card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-primary/8 border border-primary/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">
              Verse of the day
            </span>
          </div>
          <p className="font-serif text-lg leading-relaxed italic text-foreground mb-3">
            "{devotional.scriptureText}"
          </p>
          <p className="text-sm font-medium text-primary">{devotional.scriptureReference}</p>
          {devotional.title && (
            <p className="text-xs text-muted-foreground mt-3 border-t border-primary/10 pt-3">
              {devotional.title}
            </p>
          )}
        </motion.div>

        {/* Content sections */}
        {sections.map((section, i) => {
          if (section.type === "practice") {
            return <PracticeBlock key={i} content={section.content} index={i} />;
          }
          if (section.type === "prayer") {
            return <PrayerBlock key={i} content={section.content} index={i} />;
          }
          return (
            <SectionBlock
              key={i}
              label={section.label}
              content={section.content}
              accent={section.accent}
              index={i}
            />
          );
        })}

        {/* Timed / Evening modes */}
        <TimedModeSection />

        {/* Begin prayer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-2"
        >
          <Button
            className="w-full h-14 rounded-2xl gap-2 text-base font-semibold"
            onClick={() => setLocation("/chat?mode=devotional")}
          >
            <MessageCircle className="w-5 h-5" />
            Begin Prayer
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Continue the reflection with your companion
          </p>
        </motion.div>
      </main>
    </div>
  );
}
