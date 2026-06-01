import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { X, Loader2, Trash2 } from "lucide-react";
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

function NewEntrySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/journal", { content, mood: selectedMood, verseReference: null, verseText: null }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/journal"] }); setContent(""); setSelectedMood(null); onClose(); },
    onError: () => toast({ variant: "destructive", title: "Couldn't save entry" }),
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white z-50 flex flex-col"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#D8D7D2]">
              <h2 className="font-serif text-[22px]">New entry</h2>
              <button onClick={onClose}><X size={20} className="text-[#73726C]" /></button>
            </div>

            <div className="px-6 py-4">
              {/* Mood picker */}
              <div className="section-band -mx-6 mb-4"><span>How are you feeling?</span></div>
              <div className="flex gap-2 flex-wrap mb-4">
                {MOODS.map(m => (
                  <button key={m.id} onClick={() => setSelectedMood(selectedMood === m.id ? null : m.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold tracking-wider uppercase border transition-colors"
                    style={{
                      background: selectedMood === m.id ? "#1b291d" : "transparent",
                      color: selectedMood === m.id ? "#fff" : "#73726C",
                      borderColor: selectedMood === m.id ? "#1b291d" : "#D8D7D2",
                    }}>
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>

              <textarea
                autoFocus value={content} onChange={e => setContent(e.target.value)}
                placeholder="Write your prayer or reflection..."
                rows={8}
                className="w-full font-serif text-[18px] text-black bg-[#EBEAE5] px-4 py-3 resize-none outline-none border border-[#D8D7D2] focus:border-[#1b291d] transition-colors mb-4"
              />

              <button
                onClick={() => createMutation.mutate()}
                disabled={!content.trim() || createMutation.isPending}
                className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase disabled:opacity-40 flex items-center justify-center gap-2 mb-6"
                style={{ background: "#1b291d", color: "#fff" }}
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

function EntryCard({ entry, onDelete }: { entry: PrayerJournalEntry; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const mood = MOODS.find(m => m.id === entry.mood);

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-b border-[#f0f0ee]">
      <button className="w-full text-left px-6 py-6" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#73726C]">
            {format(new Date(entry.createdAt), "MMM d, yyyy")}
          </span>
          {mood && <span className="text-[12px]">{mood.emoji} {mood.label}</span>}
        </div>
        {entry.verseReference && (
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#1b291d] mb-2">{entry.verseReference}</p>
        )}
        <p className="font-serif text-[18px] text-black leading-relaxed" style={{ WebkitLineClamp: expanded ? undefined : 3, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
          {entry.content}
        </p>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-6 pb-5 flex justify-end">
              <button onClick={() => onDelete(entry.id)} className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-red-600">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Journal() {
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const { data, isLoading } = useQuery<{ entries: PrayerJournalEntry[] }>({ queryKey: ["/api/journal"] });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/journal/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/journal"] }),
  });

  const entries = data?.entries || [];

  return (
    <>
      {/* ─────────────  DESKTOP: EDITORIAL TWO-PANE JOURNAL  ───────────── */}
      <div className="hidden md:flex flex-col min-h-screen" style={{ background: "#EBEAE5" }}>
        {/* Masthead */}
        <header className="flex items-stretch border-b-2 border-black">
          <div className="px-8 py-6 flex items-center border-r border-[#D8D7D2]">
            <h1 className="font-serif text-[30px] italic leading-none text-black">SoulGuide</h1>
          </div>
          <div className="flex-1 flex items-center px-8">
            <span className="font-serif text-[18px] italic text-[#73726C]">Prayer Journal</span>
          </div>
          <div className="px-8 flex items-center">
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black">{format(new Date(), "EEEE • h:mm a")}</span>
          </div>
        </header>

        <div className="grid grid-cols-[1fr_1.6fr] flex-1 items-stretch" style={{ minHeight: "calc(100vh - 89px)" }}>
          {/* LEFT — Past reflections */}
          <section className="border-r border-black overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black">
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black">Past Reflections</span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#73726C]">Total {entries.length}</span>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#73726C]" /></div>
            ) : entries.length === 0 ? (
              <div className="px-6 py-16">
                <p className="font-serif text-[22px] text-black mb-2">No reflections yet.</p>
                <p className="text-[14px] text-[#73726C] leading-relaxed">Begin writing on the right. This is your private space.</p>
              </div>
            ) : (
              entries.map((entry) => {
                const mood = MOODS.find((m) => m.id === entry.mood);
                return (
                  <div key={entry.id} className="group px-6 py-6 border-b border-[#D8D7D2] relative">
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#73726C]">
                      {format(new Date(entry.createdAt), "MMMM d, yyyy")}
                    </span>
                    <p className="font-serif text-[17px] leading-[1.55] text-black mt-2 mb-3"
                       style={{ WebkitLineClamp: 3, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
                      {entry.content}
                    </p>
                    <div className="flex items-center justify-between">
                      {mood ? (
                        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#73726C]">{mood.emoji} {mood.label}</span>
                      ) : <span />}
                      {entry.verseReference && (
                        <span className="font-serif italic text-[13px] text-[#1b291d]">{entry.verseReference}</span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(entry.id)}
                      className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#73726C] hover:text-red-600"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
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
      <div className="md:hidden min-h-screen pb-20" style={{ background: "#EBEAE5" }}>
      {/* Header */}
      <header className="flex bg-white border-b border-[#D8D7D2] sticky top-0 z-10">
        <div className="flex-1 py-6 px-6 flex items-center">
          <h1 className="font-serif text-[26px] leading-none text-black tracking-wide">Prayer Journal</h1>
        </div>
        <button
          onClick={() => setNewEntryOpen(true)}
          className="border-l border-[#D8D7D2] py-6 px-6 text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1b291d]"
          data-testid="button-new-journal-entry"
        >
          + New
        </button>
      </header>

      <main>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#73726C]" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 px-8">
            <p className="font-serif text-[28px] text-black mb-3">Your journal is empty.</p>
            <p className="text-[16px] text-[#73726C] mb-8 leading-relaxed">Write your first prayer or reflection. This is your private space.</p>
            <button onClick={() => setNewEntryOpen(true)}
              className="px-8 py-3 font-semibold text-[13px] tracking-[0.2em] uppercase"
              style={{ background: "#1b291d", color: "#fff" }}>
              Write your first entry
            </button>
          </div>
        ) : (
          entries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onDelete={id => deleteMutation.mutate(id)} />
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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = title.trim() ? `${title.trim()}\n\n${content}` : content;
      await apiRequest("POST", "/api/journal", { content: body, mood: selectedMood, verseReference: null, verseText: null });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/journal"] }); setTitle(""); setContent(""); setSelectedMood(null); },
    onError: () => toast({ variant: "destructive", title: "Couldn't save entry" }),
  });

  return (
    <section className="flex flex-col">
      <div className="px-8 py-4 border-b border-black">
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-black">New Entry</span>
      </div>
      <div className="flex-1 flex flex-col px-8 py-8">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this moment a name…"
          className="w-full font-serif text-[40px] leading-tight text-black bg-transparent outline-none placeholder:text-[#b9b8b2] mb-5"
        />
        <div className="border-t border-[#D8D7D2] pt-6 flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Speak your truth into the silence. What is on your heart today?"
            className="w-full h-full min-h-[280px] font-serif text-[20px] leading-[1.7] text-[#333] bg-transparent outline-none resize-none placeholder:text-[#a9a8a2]"
          />
        </div>
        <div className="border-t border-[#D8D7D2] pt-6 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#73726C]">Current Mood</span>
            <div className="flex gap-2 flex-wrap mt-3">
              {MOODS.map((m) => (
                <button key={m.id} onClick={() => setSelectedMood(selectedMood === m.id ? null : m.id)}
                  className="px-4 py-2 text-[12px] font-semibold tracking-wider uppercase rounded-full border transition-colors"
                  style={{
                    background: selectedMood === m.id ? "#1b291d" : "transparent",
                    color: selectedMood === m.id ? "#fff" : "#73726C",
                    borderColor: selectedMood === m.id ? "#1b291d" : "#D8D7D2",
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!content.trim() || createMutation.isPending}
            className="bg-black text-white text-[12px] font-semibold tracking-[0.15em] uppercase rounded-full px-8 py-4 disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
          >
            {createMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Entry"}
          </button>
        </div>
      </div>
    </section>
  );
}
