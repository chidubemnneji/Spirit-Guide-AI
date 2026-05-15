import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CommunityPost {
  id: number;
  type: "prayer" | "reflection";
  content: string;
  anonLabel: string;
  prayerCount: number;
  hasPrayed: boolean;
  createdAt: string;
}

const CATEGORIES = ["All Threads", "Healing", "Guidance", "Gratitude", "Faith", "Peace"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}h ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function CandleIcon({ lit }: { lit: boolean }) {
  return (
    <div className="flex flex-col items-center justify-end h-[14px]">
      {lit && <div className="w-[5px] h-[7px] bg-[#eab308] rounded-[2px] rounded-t-full mb-[1px]" />}
      <div className="w-[12px] h-[4px]" style={{ background: lit ? "#333" : "#aaa" }} />
    </div>
  );
}

export default function Community() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Threads");
  const [showCompose, setShowCompose] = useState(false);
  const [composeType, setComposeType] = useState<"prayer" | "reflection">("prayer");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightingId, setLightingId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await apiRequest("GET", "/api/community");
      const json = await data.json();
      setPosts(json.posts || []);
    } catch {
      toast({ variant: "destructive", title: "Couldn't load threads" });
    } finally { setLoading(false); }
  }

  async function submitPost() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/community", { type: composeType, content: content.trim() });
      const json = await res.json();
      setPosts(prev => [json.post, ...prev]);
      setContent(""); setShowCompose(false);
      toast({ title: "Your thread has been shared" });
    } catch { toast({ variant: "destructive", title: "Couldn't share. Try again." }); }
    finally { setSubmitting(false); }
  }

  async function toggleLight(postId: number) {
    if (lightingId === postId) return;
    setLightingId(postId);
    try {
      const res = await apiRequest("POST", `/api/community/${postId}/pray`);
      const json = await res.json();
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, hasPrayed: json.hasPrayed, prayerCount: p.prayerCount + (json.hasPrayed ? 1 : -1) }
        : p));
    } catch { toast({ variant: "destructive", title: "Couldn't update" }); }
    finally { setLightingId(null); }
  }

  const categoryLabel = (post: CommunityPost) => {
    if (post.type === "reflection") return "Gratitude";
    if (post.anonLabel?.toLowerCase().includes("heal")) return "Healing";
    if (post.anonLabel?.toLowerCase().includes("overwhelm")) return "Guidance";
    return "Guidance";
  };

  const filtered = activeCategory === "All Threads" ? posts : posts.filter(p => categoryLabel(p) === activeCategory);

  return (
    <div className="min-h-screen pb-20" style={{ background: "#EBEAE5" }}>
      {/* Category tabs */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#D8D7D2] flex items-center overflow-x-auto gap-2 px-4 py-4"
        style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="whitespace-nowrap text-[10px] tracking-[0.15em] font-semibold px-4 py-2 uppercase transition-colors"
            style={{
              background: activeCategory === cat ? "#111" : "transparent",
              color: activeCategory === cat ? "#fff" : "#73726C",
              border: activeCategory === cat ? "none" : "1px solid #D8D7D2",
            }}
          >
            {cat}
          </button>
        ))}
      </header>

      {/* Posts */}
      <main>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-[#73726C]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="font-serif text-[24px] text-black mb-2">Be the first to share</p>
            <p className="text-[15px] text-[#73726C]">The community is waiting to pray with you.</p>
          </div>
        ) : (
          filtered.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="px-6 py-8 border-b border-[#f0f0ee] bg-white"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] tracking-[0.15em] font-medium uppercase text-[#73726C]">
                  {categoryLabel(post)}
                </span>
                <span className="text-[11px] tracking-[0.15em] font-medium uppercase text-[#111]">
                  {timeAgo(post.createdAt)}
                </span>
              </div>
              <p className="font-serif text-[22px] leading-[1.4] text-[#111] mb-8">
                "{post.content}"
              </p>
              <div className="flex justify-between items-center">
                <span className="text-[11px] tracking-[0.15em] font-medium uppercase text-[#111]">
                  — {post.anonLabel}
                </span>
                <button
                  onClick={() => toggleLight(post.id)}
                  disabled={lightingId === post.id}
                  className="flex items-center gap-2 px-3 py-1.5 transition-colors"
                  style={{ border: post.hasPrayed ? "1px solid #d8c3a5" : "1px solid #D8D7D2" }}
                >
                  {lightingId === post.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CandleIcon lit={post.hasPrayed} />
                  }
                  <span
                    className="text-[10px] tracking-[0.1em] font-medium uppercase mt-[1px]"
                    style={{ color: post.hasPrayed ? "#111" : "#73726C" }}
                  >
                    {post.prayerCount} Light{post.prayerCount !== 1 ? "s" : ""}
                  </span>
                </button>
              </div>
            </motion.article>
          ))
        )}
      </main>

      {/* Compose button */}
      <button
        onClick={() => setShowCompose(true)}
        className="fixed bottom-28 right-6 w-14 h-14 flex items-center justify-center shadow-lg z-50 transition-transform active:scale-95"
        style={{ background: "#1b291d" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Compose sheet */}
      <AnimatePresence>
        {showCompose && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCompose(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-white z-50 p-6"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-[20px]">Share with the community</h3>
                <button onClick={() => setShowCompose(false)}><X className="w-5 h-5 text-[#73726C]" /></button>
              </div>
              <div className="flex gap-2 mb-4">
                {(["prayer", "reflection"] as const).map(t => (
                  <button key={t} onClick={() => setComposeType(t)}
                    className="flex-1 py-2.5 text-sm font-semibold capitalize transition-all border"
                    style={{
                      background: composeType === t ? "#1b291d" : "transparent",
                      color: composeType === t ? "#fff" : "#73726C",
                      borderColor: composeType === t ? "#1b291d" : "#D8D7D2",
                    }}
                  >
                    {t === "prayer" ? "Prayer request" : "Reflection"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#73726C] mb-3 tracking-wide">Posted anonymously. Your name is never shared.</p>
              <textarea
                autoFocus value={content} onChange={e => setContent(e.target.value)}
                maxLength={500} rows={4}
                placeholder={composeType === "prayer" ? "What would you like the community to pray for?" : "What is God showing you today?"}
                className="w-full resize-none bg-[#EBEAE5] px-4 py-3 text-sm outline-none border border-[#D8D7D2] focus:border-[#1b291d] mb-2 transition-colors"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#73726C]">{content.length}/500</span>
                <button
                  onClick={submitPost} disabled={!content.trim() || submitting}
                  className="px-6 py-2.5 text-[13px] font-semibold tracking-[0.1em] uppercase transition-colors disabled:opacity-40"
                  style={{ background: "#1b291d", color: "#fff" }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
