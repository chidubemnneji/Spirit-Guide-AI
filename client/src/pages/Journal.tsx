import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, BookOpen, X, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { PrayerJournalEntry } from "@shared/schema";

const MOODS = [
  { id: "grateful",  emoji: "🙏", label: "Grateful" },
  { id: "hopeful",   emoji: "✨", label: "Hopeful" },
  { id: "peaceful",  emoji: "🕊️", label: "Peaceful" },
  { id: "anxious",   emoji: "😟", label: "Anxious" },
  { id: "sad",       emoji: "😔", label: "Sad" },
  { id: "wrestling", emoji: "⚡", label: "Wrestling" },
];

interface NewEntrySheetProps {
  open: boolean;
  onClose: () => void;
  prefillVerse?: { reference: string; text: string } | null;
}

function NewEntrySheet({ open, onClose, prefillVerse }: NewEntrySheetProps) {
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/journal", {
        content,
        mood: selectedMood,
        verseReference: prefillVerse?.reference || null,
        verseText: prefillVerse?.text || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setContent("");
      setSelectedMood(null);
      onClose();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Couldn't save entry", description: "Please try again" });
    },
  });

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
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[90vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
              <h2 className="font-serif text-lg font-semibold">New entry</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {prefillVerse && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-xs font-medium text-primary mb-1">{prefillVerse.reference}</p>
                  <p className="text-sm text-foreground italic">"{prefillVerse.text}"</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">How are you feeling?</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMood(selectedMood === m.id ? null : m.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        selectedMood === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <span>{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Write your prayer, reflection, or whatever is on your heart..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-[180px] resize-none rounded-xl border-border text-base"
                autoFocus
              />
            </div>

            <div className="px-5 py-4 border-t border-border">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!content.trim() || createMutation.isPending}
                className="w-full rounded-2xl h-12"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : "Save entry"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function EntryCard({ entry, onDelete }: { entry: PrayerJournalEntry; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const mood = MOODS.find(m => m.id === entry.mood);

  return (
    <motion.div
      layout
      className="bg-card border border-border/50 rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {mood && <span className="text-base">{mood.emoji}</span>}
              <span className="text-xs text-muted-foreground">
                {format(new Date(entry.createdAt), "MMM d, yyyy")}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
              </span>
            </div>
            {entry.verseReference && (
              <div className="flex items-center gap-1 mb-2">
                <BookOpen className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">{entry.verseReference}</span>
              </div>
            )}
            <p className={cn(
              "text-sm text-foreground leading-relaxed",
              !expanded && "line-clamp-2"
            )}>
              {entry.content}
            </p>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(entry.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/5 gap-1.5 rounded-xl"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Journal() {
  const [, setLocation] = useLocation();
  const [newEntryOpen, setNewEntryOpen] = useState(false);

  const { data, isLoading } = useQuery<{ entries: PrayerJournalEntry[] }>({
    queryKey: ["/api/journal"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/journal/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    },
  });

  const entries = data?.entries || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/account")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-serif text-lg font-semibold">Prayer Journal</span>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={() => setNewEntryOpen(true)}
            className="rounded-xl gap-1.5"
            data-testid="button-new-journal-entry"
          >
            <Plus className="w-4 h-4" />
            New entry
          </Button>
        </div>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-serif text-lg font-semibold mb-2">Your journal is empty</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Write your first prayer or reflection. This is your private space.
            </p>
            <Button onClick={() => setNewEntryOpen(true)} className="rounded-xl">
              Write your first entry
            </Button>
          </motion.div>
        ) : (
          entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onDelete={id => deleteMutation.mutate(id)}
            />
          ))
        )}
      </main>

      <NewEntrySheet
        open={newEntryOpen}
        onClose={() => setNewEntryOpen(false)}
      />
    </div>
  );
}
