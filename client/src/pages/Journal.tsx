import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { X, Loader2, Trash2, HandHeart, Check } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { PrayerJournalEntry } from "@shared/schema";

const MOODS = [
  { id: "grateful", emoji: "🙏", label: "Grateful" },
  { id: "hopeful", emoji: "✨", label: "Hopeful" },
  { id: "peaceful", emoji: "🕊️", label: "Peaceful" },
  { id: "anxious", emoji: "😟", label: "Anxious" },
  { id: "sad", emoji: "😔", label: "Sad" },
  { id: "wrestling", emoji: "⚡", label: "Wrestling" },
];

// A structured ACTS prayer flow (Adoration, Confession, Thanksgiving,
// Supplication) — an alternative to free-writing that gives people who feel
// stuck a shape to pray in. Sections combine into one journal entry on save,
// so it needs no new schema or backend route.
const ACTS_STEPS = [
  { id: "adoration", emoji: "🙌", label: "Adoration", prompt: "Who is God to you right now? Praise Him for who He is." },
  { id: "confession", emoji: "🕯️", label: "Confession", prompt: "Is there anything weighing on your conscience you want to bring to Him?" },
  { id: "thanksgiving", emoji: "🎁", label: "Thanksgiving", prompt: "What are you thankful for today, big or small?" },
  { id: "supplication", emoji: "🤲", label: "Supplication", prompt: "What do you need? For yourself, or for someone else." },
] as const;

function combineActsEntry(values: Record<string, string>): string {
  return ACTS_STEPS
    .filter((step) => values[step.id]?.trim())
    .map((step) => `${step.emoji} ${step.label}\n${values[step.id].trim()}`)
    .join("\n\n");
}

function NewEntrySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"free" | "guided">("free");
  const [content, setContent] = useState("");
  const [actsValues, setActsValues] = useState<Record<string, string>>({});
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();

  const finalContent = mode === "guided" ? combineActsEntry(actsValues) : content;

  const createMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/journal", { content: finalContent, mood: selectedMood, verseReference: null, verseText: null }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setContent(""); setActsValues({}); setSelectedMood(null); onClose();
    },
    onError: () => toast({ variant: "destructive", title: "Couldn't save entry" }),
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-[var(--app-white)] z-50 flex flex-col max-h-[88vh]"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--app-border)]">
              <h2 className="font-serif text-[22px]">New entry</h2>
              <button onClick={onClose}><X size={20} className="text-[var(--app-gray-lt)]" /></button>
            </div>

            {/* Free write / Guided prayer toggle */}
            <div className="flex px-6 pt-4 gap-2">
              {(["free", "guided"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2.5 text-[12px] font-semibold tracking-wider uppercase border transition-colors"
                  style={{
                    background: mode === m ? "var(--cta-bg)" : "transparent",
                    color: mode === m ? "var(--cta-fg)" : "var(--app-gray-lt)",
                    borderColor: mode === m ? "var(--app-green)" : "var(--app-border)",
                  }}
                >
                  {m === "free" ? "Free write" : "Guided prayer (ACTS)"}
                </button>
              ))}
            </div>

            <div className="px-6 py-4 overflow-y-auto">
              {/* Mood picker */}
              <div className="section-band -mx-6 mb-4"><span>How are you feeling?</span></div>
              <div className="flex gap-2 flex-wrap mb-4">
                {MOODS.map(m => (
                  <button key={m.id} onClick={() => setSelectedMood(selectedMood === m.id ? null : m.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold tracking-wider uppercase border transition-colors"
                    style={{
                      background: selectedMood === m.id ? "var(--cta-bg)" : "transparent",
                      color: selectedMood === m.id ? "var(--cta-fg)" : "var(--app-gray-lt)",
                      borderColor: selectedMood === m.id ? "var(--app-green)" : "var(--app-border)",
                    }}>
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>

              {mode === "free" ? (
                <textarea
                  autoFocus value={content} onChange={e => setContent(e.target.value)}
                  placeholder="Write your prayer or reflection..."
                  rows={8}
                  className="w-full font-serif text-[18px] text-[var(--app-dark)] bg-[var(--app-bg)] px-4 py-3 resize-none outline-none border border-[var(--app-border)] focus:border-[var(--app-green)] transition-colors mb-4"
                />
              ) : (
                <div className="space-y-4 mb-4">
                  {ACTS_STEPS.map((step) => (
                    <div key={step.id}>
                      <p className="text-[13px] font-semibold text-[var(--app-dark)] mb-1">{step.emoji} {step.label}</p>
                      <p className="text-[12px] text-[var(--app-gray-lt)] mb-2">{step.prompt}</p>
                      <textarea
                        value={actsValues[step.id] || ""}
                        onChange={(e) => setActsValues((v) => ({ ...v, [step.id]: e.target.value }))}
                        rows={2}
                        className="w-full font-serif text-[16px] text-[var(--app-dark)] bg-[var(--app-bg)] px-4 py-3 resize-none outline-none border border-[var(--app-border)] focus:border-[var(--app-green)] transition-colors"
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => createMutation.mutate()}
                disabled={!finalContent.trim() || createMutation.isPending}
                className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase disabled:opacity-40 flex items-center justify-center gap-2 mb-6"
                style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
                data-testid="button-save-journal-entry"
              >
                {createMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save entry"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function EntryCard({ entry, onDelete, onAnswer }: { entry: PrayerJournalEntry; onDelete: (id: number) => void; onAnswer: (id: number, answered: boolean, note?: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [notingAnswer, setNotingAnswer] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const mood = MOODS.find(m => m.id === entry.mood);
  const isAnswered = !!entry.answeredAt;

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
      <button className="w-full text-left px-6 py-6" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-gray-lt)]">
            {format(new Date(entry.createdAt), "MMM d, yyyy")}
          </span>
          <div className="flex items-center gap-2">
            {isAnswered && (
              <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase text-[var(--app-green)]">
                <Check size={12} /> Answered
              </span>
            )}
            {mood && <span className="text-[12px]">{mood.emoji} {mood.label}</span>}
          </div>
        </div>
        {entry.verseReference && (
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--app-green)] mb-2">{entry.verseReference}</p>
        )}
        <p className="font-serif text-[18px] text-[var(--app-dark)] leading-relaxed" style={{ WebkitLineClamp: expanded ? undefined : 3, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
          {entry.content}
        </p>
        {isAnswered && entry.answerNote && (
          <p className="mt-3 text-[14px] font-serif italic text-[var(--app-gray)] border-l-2 border-[var(--app-green)] pl-3">
            {entry.answerNote}
          </p>
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-6 pb-5">
              {notingAnswer ? (
                <div className="mb-3">
                  <textarea
                    autoFocus
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="How was this prayer answered? (optional)"
                    rows={2}
                    className="w-full text-[14px] text-[var(--app-dark)] bg-[var(--app-bg)] px-3 py-2 resize-none outline-none border border-[var(--app-border)] focus:border-[var(--app-green)] transition-colors mb-2"
                  />
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => { setNotingAnswer(false); setNoteDraft(""); }} className="text-[11px] font-semibold tracking-wider uppercase text-[var(--app-gray-lt)]">
                      Cancel
                    </button>
                    <button
                      onClick={() => { onAnswer(entry.id, true, noteDraft); setNotingAnswer(false); }}
                      className="text-[11px] font-semibold tracking-wider uppercase text-[var(--app-green)]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="flex justify-between items-center">
                {isAnswered ? (
                  <button onClick={() => onAnswer(entry.id, false)} className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-[var(--app-gray-lt)]">
                    Unmark as answered
                  </button>
                ) : !notingAnswer ? (
                  <button onClick={() => setNotingAnswer(true)} className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-[var(--app-green)]">
                    <HandHeart size={12} /> Mark as answered
                  </button>
                ) : <span />}
                <button onClick={() => onDelete(entry.id)} className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-red-600">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Journal() {
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "answered">("all");
  const { data, isLoading } = useQuery<{ entries: PrayerJournalEntry[] }>({ queryKey: ["/api/journal"] });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/journal/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/journal"] }),
  });
  const answerMutation = useMutation({
    mutationFn: async ({ id, answered, note }: { id: number; answered: boolean; note?: string }) => {
      await apiRequest("PATCH", `/api/journal/${id}/answer`, { answered, answerNote: note });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/journal"] }),
  });
  const handleAnswer = (id: number, answered: boolean, note?: string) => answerMutation.mutate({ id, answered, note });

  const allEntries = data?.entries || [];
  const answeredCount = allEntries.filter((e) => !!e.answeredAt).length;
  const entries = filter === "answered" ? allEntries.filter((e) => !!e.answeredAt) : allEntries;

  return (
    <>
      {/* ─────────────  DESKTOP: EDITORIAL TWO-PANE JOURNAL  ───────────── */}
      <div className="hidden md:flex flex-col min-h-screen" style={{ background: "var(--app-bg)" }}>
        {/* Masthead */}
        <header className="flex items-stretch border-b-2 border-[var(--app-dark)]">
          <div className="px-8 py-6 flex items-center border-r border-[var(--app-border)]">
            <h1 className="font-serif text-[30px] italic leading-none text-[var(--app-dark)]">SoulGuide</h1>
          </div>
          <div className="flex-1 flex items-center px-8">
            <span className="font-serif text-[18px] italic text-[var(--app-gray-lt)]">Prayer Journal</span>
          </div>
          <div className="px-8 flex items-center border-r border-[var(--app-border)]">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--app-gray-lt)]">Vol. 01 — Reflections</span>
          </div>
          <div className="px-8 flex items-center">
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">{format(new Date(), "EEEE • h:mm a")}</span>
          </div>
        </header>

        <div className="grid grid-cols-[1fr_1.6fr] flex-1 items-stretch" style={{ minHeight: "calc(100vh - 89px)" }}>
          {/* LEFT — Past reflections */}
          <section className="border-r border-[var(--app-dark)] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--app-dark)]">
              <div className="flex items-center gap-4">
                <button onClick={() => setFilter("all")} className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: filter === "all" ? "var(--app-dark)" : "var(--app-gray-lt)" }}>
                  All
                </button>
                <button onClick={() => setFilter("answered")} className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: filter === "answered" ? "var(--app-green)" : "var(--app-gray-lt)" }}>
                  Answered {answeredCount > 0 && `(${answeredCount})`}
                </button>
              </div>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">Total {entries.length}</span>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--app-gray-lt)]" /></div>
            ) : entries.length === 0 ? (
              <div className="px-6 py-16">
                <p className="font-serif text-[22px] text-[var(--app-dark)] mb-2">
                  {filter === "answered" ? "No answered prayers yet." : "No reflections yet."}
                </p>
                <p className="text-[14px] text-[var(--app-gray-lt)] leading-relaxed">
                  {filter === "answered" ? "Mark an entry as answered and it'll show up here." : "Begin writing on the right. This is your private space."}
                </p>
              </div>
            ) : (
              entries.map((entry) => {
                const mood = MOODS.find((m) => m.id === entry.mood);
                const isAnswered = !!entry.answeredAt;
                return (
                  <div key={entry.id} className="group px-6 py-6 border-b border-[var(--app-border)] relative">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">
                        {format(new Date(entry.createdAt), "MMMM d, yyyy")}
                      </span>
                      {isAnswered && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--app-green)]">
                          <Check size={11} /> Answered
                        </span>
                      )}
                    </div>
                    <p className="font-serif text-[17px] leading-[1.55] text-[var(--app-dark)] mt-2 mb-3"
                       style={{ WebkitLineClamp: 3, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
                      {entry.content}
                    </p>
                    {isAnswered && entry.answerNote && (
                      <p className="font-serif italic text-[14px] text-[var(--app-gray)] border-l-2 border-[var(--app-green)] pl-3 mb-3">
                        {entry.answerNote}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {mood ? (
                        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--app-gray-lt)]">{mood.emoji} {mood.label}</span>
                      ) : <span />}
                      {entry.verseReference && (
                        <span className="font-serif italic text-[13px] text-[var(--app-green)]">{entry.verseReference}</span>
                      )}
                    </div>
                    <div className="absolute top-5 right-5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleAnswer(entry.id, !isAnswered)}
                        className="text-[var(--app-gray-lt)] hover:text-[var(--app-green)]"
                        aria-label={isAnswered ? "Unmark as answered" : "Mark as answered"}
                        title={isAnswered ? "Unmark as answered" : "Mark as answered"}
                      >
                        <HandHeart size={14} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="text-[var(--app-gray-lt)] hover:text-red-600"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* RIGHT — New entry writing area */}
          <DesktopComposer />
        </div>
      </div>

      {/* ─────────────  MOBILE: ORIGINAL (UNTOUCHED)  ───────────── */}
      <div className="md:hidden min-h-screen pb-20" style={{ background: "var(--app-bg)" }}>
      {/* Header */}
      <header className="flex bg-[var(--app-white)] border-b border-[var(--app-border)] sticky top-0 z-10">
        <div className="flex-1 py-6 px-6 flex items-center">
          <h1 className="font-serif text-[26px] leading-none text-[var(--app-dark)] tracking-wide">Prayer Journal</h1>
        </div>
        <button
          onClick={() => setNewEntryOpen(true)}
          className="border-l border-[var(--app-border)] py-6 px-6 text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--app-green)]"
          data-testid="button-new-journal-entry"
        >
          + New
        </button>
      </header>

      {allEntries.length > 0 && (
        <div className="flex gap-5 px-6 py-3 bg-[var(--app-white)] border-b border-[var(--app-border)]">
          <button onClick={() => setFilter("all")} className="text-[12px] font-semibold tracking-[0.12em] uppercase" style={{ color: filter === "all" ? "var(--app-dark)" : "var(--app-gray-lt)" }}>
            All
          </button>
          <button onClick={() => setFilter("answered")} className="flex items-center gap-1 text-[12px] font-semibold tracking-[0.12em] uppercase" style={{ color: filter === "answered" ? "var(--app-green)" : "var(--app-gray-lt)" }}>
            Answered {answeredCount > 0 && `(${answeredCount})`}
          </button>
        </div>
      )}

      <main>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--app-gray-lt)]" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 px-8">
            {filter === "answered" ? (
              <>
                <p className="font-serif text-[28px] text-[var(--app-dark)] mb-3">No answered prayers yet.</p>
                <p className="text-[16px] text-[var(--app-gray-lt)] mb-8 leading-relaxed">Mark an entry as answered and it'll show up here.</p>
              </>
            ) : (
              <>
                <p className="font-serif text-[28px] text-[var(--app-dark)] mb-3">Your journal is empty.</p>
                <p className="text-[16px] text-[var(--app-gray-lt)] mb-8 leading-relaxed">Write your first prayer or reflection. This is your private space.</p>
                <button onClick={() => setNewEntryOpen(true)}
                  className="px-8 py-3 font-semibold text-[13px] tracking-[0.2em] uppercase"
                  style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}>
                  Write your first entry
                </button>
              </>
            )}
          </div>
        ) : (
          entries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onDelete={id => deleteMutation.mutate(id)} onAnswer={handleAnswer} />
          ))
        )}
      </main>

      <NewEntrySheet open={newEntryOpen} onClose={() => setNewEntryOpen(false)} />
      </div>
    </>
  );
}

// Desktop inline composer — persistent writing pane (mirrors NewEntrySheet logic).
function DesktopComposer() {
  const [mode, setMode] = useState<"free" | "guided">("free");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [actsValues, setActsValues] = useState<Record<string, string>>({});
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();

  const finalContent = mode === "guided" ? combineActsEntry(actsValues) : content;

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = title.trim() ? `${title.trim()}\n\n${finalContent}` : finalContent;
      await apiRequest("POST", "/api/journal", { content: body, mood: selectedMood, verseReference: null, verseText: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setTitle(""); setContent(""); setActsValues({}); setSelectedMood(null);
    },
    onError: () => toast({ variant: "destructive", title: "Couldn't save entry" }),
  });

  return (
    <section className="flex flex-col">
      <div className="px-8 py-4 border-b border-[var(--app-dark)] flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-dark)]">New Entry</span>
        <div className="flex gap-2">
          {(["free", "guided"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase border transition-colors"
              style={{
                background: mode === m ? "var(--cta-bg)" : "transparent",
                color: mode === m ? "var(--cta-fg)" : "var(--app-gray-lt)",
                borderColor: mode === m ? "var(--app-green)" : "var(--app-border)",
              }}
            >
              {m === "free" ? "Free write" : "Guided (ACTS)"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col px-8 py-8 overflow-y-auto">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this moment a name…"
          className="w-full font-serif text-[40px] leading-tight text-[var(--app-dark)] bg-transparent outline-none placeholder:text-[var(--app-placeholder)] mb-5"
        />
        <div className="border-t border-[var(--app-border)] pt-6 flex-1">
          {mode === "free" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Speak your truth into the silence. What is on your heart today?"
              className="w-full h-full min-h-[280px] font-serif text-[20px] leading-[1.7] text-[var(--app-gray)] bg-transparent outline-none resize-none placeholder:text-[var(--app-placeholder)]"
            />
          ) : (
            <div className="space-y-6">
              {ACTS_STEPS.map((step) => (
                <div key={step.id}>
                  <p className="text-[15px] font-semibold text-[var(--app-dark)] mb-1">{step.emoji} {step.label}</p>
                  <p className="text-[13px] text-[var(--app-gray-lt)] mb-2">{step.prompt}</p>
                  <textarea
                    value={actsValues[step.id] || ""}
                    onChange={(e) => setActsValues((v) => ({ ...v, [step.id]: e.target.value }))}
                    rows={2}
                    className="w-full font-serif text-[17px] leading-[1.6] text-[var(--app-gray)] bg-transparent outline-none resize-none border-b border-[var(--app-border)] focus:border-[var(--app-green)] transition-colors pb-2 placeholder:text-[var(--app-placeholder)]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-[var(--app-border)] pt-6 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">Current Mood</span>
            <div className="flex gap-2 flex-wrap mt-3">
              {MOODS.map((m) => (
                <button key={m.id} onClick={() => setSelectedMood(selectedMood === m.id ? null : m.id)}
                  className="px-4 py-2 text-[12px] font-semibold tracking-wider uppercase rounded-full border transition-colors"
                  style={{
                    background: selectedMood === m.id ? "var(--cta-bg)" : "transparent",
                    color: selectedMood === m.id ? "var(--cta-fg)" : "var(--app-gray-lt)",
                    borderColor: selectedMood === m.id ? "var(--app-green)" : "var(--app-border)",
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!finalContent.trim() || createMutation.isPending}
            className="bg-[var(--cta-bg)] text-[var(--cta-fg)] text-[12px] font-semibold tracking-[0.15em] uppercase rounded-full px-8 py-4 disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
          >
            {createMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Entry"}
          </button>
        </div>
      </div>
    </section>
  );
}
