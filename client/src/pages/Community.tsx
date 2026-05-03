import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Heart, Plus, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function Community() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [composeType, setComposeType] = useState<"prayer" | "reflection">("prayer");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [prayingId, setPrayingId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await apiRequest("GET", "/api/community");
      const json = await data.json();
      setPosts(json.posts || []);
    } catch {
      toast({ variant: "destructive", title: "Couldn't load community posts" });
    } finally {
      setLoading(false);
    }
  }

  async function submitPost() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/community", {
        type: composeType,
        content: content.trim(),
      });
      const json = await res.json();
      setPosts(prev => [json.post, ...prev]);
      setContent("");
      setShowCompose(false);
      toast({ title: composeType === "prayer" ? "Prayer shared 🙏" : "Reflection shared ✨" });
    } catch {
      toast({ variant: "destructive", title: "Couldn't share. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePray(postId: number) {
    if (prayingId === postId) return;
    setPrayingId(postId);
    try {
      const res = await apiRequest("POST", `/api/community/${postId}/pray`);
      const json = await res.json();
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, hasPrayed: json.hasPrayed, prayerCount: p.prayerCount + (json.hasPrayed ? 1 : -1) }
          : p
      ));
    } catch {
      toast({ variant: "destructive", title: "Couldn't update prayer" });
    } finally {
      setPrayingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between px-5 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-serif text-lg font-semibold">Community</span>
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={() => setShowCompose(true)}
          >
            <Plus className="w-4 h-4" />
            Share
          </Button>
        </div>
      </header>

      {/* Compose sheet */}
      <AnimatePresence>
        {showCompose && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompose(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 z-50 max-w-lg mx-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg font-semibold">Share with the community</h3>
                <button onClick={() => setShowCompose(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Type picker */}
              <div className="flex gap-2 mb-4">
                {(["prayer", "reflection"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setComposeType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      composeType === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {t === "prayer" ? "🙏 Prayer request" : "✨ Reflection"}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Posted anonymously — the community will only see a label, never your name.
              </p>

              <textarea
                autoFocus
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder={
                  composeType === "prayer"
                    ? "Share what you'd like the community to pray for..."
                    : "Share what God is showing you today..."
                }
                className="w-full resize-none bg-background rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary transition-colors mb-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{content.length}/500</span>
                <Button
                  onClick={submitPost}
                  disabled={!content.trim() || submitting}
                  className="rounded-xl gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {composeType === "prayer" ? "Share request" : "Share reflection"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feed */}
      <main className="px-4 py-5 max-w-lg mx-auto">
        {/* Intro */}
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 mb-5">
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            A quiet space to share prayer requests and reflections — anonymously.
            Every post is a real person on a real journey.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🕊️</div>
            <p className="font-serif text-lg mb-1">Be the first to share</p>
            <p className="text-sm text-muted-foreground">
              The community is waiting to pray with you.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-2xl p-4 border border-border"
                >
                  {/* Post type badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      post.type === "prayer"
                        ? "bg-primary/10 text-primary"
                        : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {post.type === "prayer" ? "🙏 Prayer request" : "✨ Reflection"}
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                  </div>

                  {/* Content */}
                  <p className="text-sm leading-relaxed mb-3">{post.content}</p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground italic">{post.anonLabel}</span>
                    <button
                      onClick={() => togglePray(post.id)}
                      disabled={prayingId === post.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        post.hasPrayed
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      {prayingId === post.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Heart className={`w-3 h-3 ${post.hasPrayed ? "fill-white" : ""}`} />
                      }
                      {post.prayerCount > 0 && <span>{post.prayerCount}</span>}
                      {post.hasPrayed ? "Praying" : "Pray"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
