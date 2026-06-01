import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { queryClient } from "@/lib/queryClient";
import { Loader2, AlertTriangle, Mic, MicOff, Volume2, RotateCcw, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useScroll } from "@/context/ScrollContext";
import RecommendationCards from "@/components/RecommendationCards";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { MoodCheckIn, type Mood } from "@/components/MoodCheckIn";
import type { Message, RecommendationCard } from "@shared/schema";

// ── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  hasRecommendations?: boolean;
  recommendationCards?: RecommendationCard[];
}

// ── Bible verse parsing ─────────────────────────────────────────────────────
const BIBLE_VERSE_PATTERN = /\b((?:1|2|3|I|II|III)?\s*[A-Za-z]+(?:\s+(?:of\s+)?[A-Za-z]+)*)\s+(\d+):(\d+)(?:-(\d+))?\b/g;

const BOOK_NAME_MAP: Record<string, string> = {
  "gen": "Genesis", "genesis": "Genesis", "exo": "Exodus", "exodus": "Exodus",
  "psa": "Psalms", "psalm": "Psalms", "psalms": "Psalms", "ps": "Psalms",
  "pro": "Proverbs", "prov": "Proverbs", "proverbs": "Proverbs",
  "mat": "Matthew", "matt": "Matthew", "matthew": "Matthew",
  "mar": "Mark", "mark": "Mark", "luk": "Luke", "luke": "Luke",
  "joh": "John", "john": "John", "act": "Acts", "acts": "Acts",
  "rom": "Romans", "romans": "Romans",
  "isa": "Isaiah", "isaiah": "Isaiah", "jer": "Jeremiah", "jeremiah": "Jeremiah",
  "rev": "Revelation", "revelation": "Revelation",
};

function normalizeBookName(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return BOOK_NAME_MAP[key] || raw.trim();
}

function parseContentWithVerseLinks(content: string, navigate: (path: string) => void, isUser: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(BIBLE_VERSE_PATTERN.source, "g");
  let match;
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
    const book = normalizeBookName(match[1]);
    const chapter = match[2];
    const verseStart = match[3];
    const verseEnd = match[4];
    const verseParam = verseEnd ? `${verseStart}-${verseEnd}` : verseStart;
    parts.push(
      <button key={`${match.index}-${match[0]}`}
        onClick={() => navigate(`/bible?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verseParam}&t=${Date.now()}`)}
        className="underline underline-offset-2 font-medium"
        style={{ color: isUser ? "rgba(255,255,255,0.9)" : "#1b291d" }}
        data-testid={`link-verse-${book}-${chapter}-${verseStart}`}
      >{match[0]}</button>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  return parts.length > 0 ? parts : [content];
}

// ── Starter prompts ─────────────────────────────────────────────────────────
const STARTERS = [
  "I'm feeling distant from God",
  "I have questions about prayer",
  "I'm struggling with doubt",
  "I want to deepen my faith",
];

// ── Message bubble ──────────────────────────────────────────────────────────
function MessageBubble({ message, isStreaming = false, onPlayAudio, isPlaying = false }:
  { message: ChatMessage; isStreaming?: boolean; onPlayAudio?: (id: number, text: string) => void; isPlaying?: boolean }) {
  const [, navigate] = useLocation();
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.role}-${message.id}`}>
      {isUser ? (
        <div className="max-w-[78%] px-5 py-3.5 font-serif text-[17px] leading-relaxed rounded-2xl rounded-br-sm"
          style={{ background: "#1b291d", color: "#fff" }}>
          {parseContentWithVerseLinks(message.content, navigate, true)}
        </div>
      ) : (
        <div className="max-w-[82%]">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#73726C] mb-2">Soul Care</p>
          <div className="px-6 py-5 bg-white border border-[#E8E0D8] rounded-2xl rounded-tl-sm font-serif text-[18px] leading-[1.7] text-[#111]">
            {parseContentWithVerseLinks(message.content, navigate, false)}
            {isStreaming && (
              <span className="inline-flex items-center gap-1 ml-2">
                <span className="w-1.5 h-1.5 bg-[#1b291d] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-[#1b291d] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-[#1b291d] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            )}
          </div>
          {!isStreaming && onPlayAudio && (
            <button onClick={() => onPlayAudio(message.id, message.content)}
              className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold tracking-wider uppercase text-[#73726C]"
              data-testid={`button-play-message-${message.id}`}>
              <Volume2 size={12} className={isPlaying ? "animate-pulse" : ""} />
              {isPlaying ? "Playing..." : "Listen"}
            </button>
          )}
          {message.recommendationCards && message.recommendationCards.length > 0 && (
            <RecommendationCards cards={message.recommendationCards} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Chat component ─────────────────────────────────────────────────────
export default function Chat() {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [pendingMood, setPendingMood] = useState<Mood | null>(null);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [chatModeProcessed, setChatModeProcessed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initRef = useRef(false);
  const reflectProcessedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingMoodRef = useRef<Mood | null>(null);

  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { setHideNav, hideNav } = useScroll();

  const { data: persona, isLoading: personaLoading } = useQuery<{ primaryPersona?: string }>({ queryKey: ["/api/persona"] });
  const { data: conversations = [] } = useQuery<Array<{ id: number; title: string | null; updatedAt: string | Date | null }>>({ queryKey: ["/api/conversations"] });

  useEffect(() => { return () => { if (mediaRecorderRef.current?.state === "recording") { mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop()); } if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }; }, []);

  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, streamingContent, scrollToBottom]);
  useEffect(() => { setHideNav(isInputFocused || input.length > 0); if (isInputFocused) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 300); }, [isInputFocused, input, setHideNav]);
  useEffect(() => { return () => { setHideNav(false); }; }, [setHideNav]);

  const loadExistingConversation = useCallback(async (convId: number) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, { credentials: "include" });
      if (res.ok) { const data = await res.json(); setConversationId(convId); setMessages(data.messages || []); localStorage.setItem("soulguide_conversation_id", String(convId)); return true; }
    } catch {}
    return false;
  }, []);

  const createConversation = useCallback(async (isColdStart = false) => {
    setIsInitializing(true); setInitError(null);
    try {
      const res = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "New Conversation" }), credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConversationId(data.id); setMessages([]); localStorage.setItem("soulguide_conversation_id", String(data.id));
        if (isColdStart) {
          try {
            const csRes = await fetch("/api/chat/cold-start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: data.id }), credentials: "include" });
            if (csRes.ok) { const csData = await csRes.json(); if (csData.message) setMessages([csData.message]); }
          } catch {}
        }
      } else { setInitError("Could not start a conversation. Please try again."); }
    } catch { setInitError("Connection issue. Please try again."); }
    finally { setIsInitializing(false); }
  }, []);

  useEffect(() => {
    if (initRef.current) return; initRef.current = true;
    const init = async () => {
      setIsInitializing(true);
      const savedId = localStorage.getItem("soulguide_conversation_id");
      if (savedId) { const loaded = await loadExistingConversation(parseInt(savedId)); if (loaded) { setIsInitializing(false); return; } }
      let isFirst = false;
      try { const r = await fetch("/api/conversations", { credentials: "include" }); if (r.ok) { const d = await r.json(); isFirst = Array.isArray(d) && d.length === 0; } } catch {}
      await createConversation(isFirst);
    };
    init();
  }, [createConversation, loadExistingConversation]);

  const sendMessageDirect = useCallback(async (content: string, convId: number) => {
    if (!content.trim() || isStreaming) return;
    setSendError(null);
    setMessages(prev => [...prev, { id: Date.now(), role: "user", content: content.trim(), createdAt: new Date().toISOString() }]);
    setIsStreaming(true); setStreamingContent("");
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }), credentials: "include" });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader(); const decoder = new TextDecoder(); let full = "";
      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const d = JSON.parse(line.slice(6));
              if (d.content) { full += d.content; setStreamingContent(full); }
              if (d.done) { setMessages(prev => [...prev, { id: d.messageId || Date.now() + 1, role: "assistant", content: full, createdAt: new Date().toISOString(), hasRecommendations: d.hasRecommendations }]); setStreamingContent(""); }
            } catch {}
          }
        }
      }
    } catch { setSendError("Could not send message."); }
    finally { setIsStreaming(false); }
  }, [isStreaming]);

  useEffect(() => {
    if (reflectProcessedRef.current || isInitializing || !conversationId) return;
    const params = new URLSearchParams(searchString); const verse = params.get("verse"); const text = params.get("text");
    if (verse && text) { reflectProcessedRef.current = true; navigate("/chat", { replace: true }); sendMessageDirect(`I want to reflect on ${verse}: "${text}"`, conversationId); }
  }, [searchString, isInitializing, conversationId, navigate, sendMessageDirect]);

  useEffect(() => {
    if (chatModeProcessed || isInitializing) return;
    const params = new URLSearchParams(searchString); const mode = params.get("mode");
    if (mode !== "checkin" && mode !== "devotional") return;
    setChatModeProcessed(true); navigate("/chat", { replace: true });
    const loadChannel = async () => {
      setIsInitializing(true);
      try {
        const res = await fetch(`/api/conversations/channel/${mode}`, { credentials: "include" });
        if (!res.ok) return;
        const { conversation } = await res.json();
        setConversationId(conversation.id); localStorage.setItem("soulguide_conversation_id", String(conversation.id));
        const msgRes = await fetch(`/api/conversations/${conversation.id}/messages`, { credentials: "include" });
        if (msgRes.ok) {
          const msgData = await msgRes.json(); const existing = msgData.messages || [];
          setMessages(existing);
          const today = new Date().toISOString().split("T")[0];
          const hasToday = existing.some((m: ChatMessage) => m.createdAt?.startsWith(today));
          if (!hasToday) {
            let ctx = "";
            try { const d = await fetch("/api/devotional/today", { credentials: "include" }); if (d.ok) { const dd = await d.json(); if (dd.data?.scriptureReference) ctx = `Today's verse: ${dd.data.scriptureReference} — "${dd.data.scriptureText}"`; } } catch {}
            const opRes = await fetch(`/api/chat/personalized-opening?mode=${mode === "devotional" ? "devotional" : "checkin"}&context=${encodeURIComponent(ctx)}`, { credentials: "include" });
            if (opRes.ok) {
              const opData = await opRes.json();
              if (opData.message) {
                const saveRes = await fetch(`/api/conversations/${conversation.id}/system-message`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ content: opData.message }) });
                if (saveRes.ok) { const rr = await fetch(`/api/conversations/${conversation.id}/messages`, { credentials: "include" }); if (rr.ok) { const rd = await rr.json(); setMessages(rd.messages || []); } }
              }
            }
          }
        }
      } catch {} finally { setIsInitializing(false); }
    };
    loadChannel();
  }, [searchString, isInitializing, chatModeProcessed, navigate]);

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || isStreaming) return;
    if (messages.filter(m => m.role === "user").length === 0 && !pendingMood && !showMoodCheckIn) { setShowMoodCheckIn(true); return; }
    setSendError(null); setShowMoodCheckIn(false);
    const content = input.trim(); const mood = pendingMoodRef.current;
    setMessages(prev => [...prev, { id: Date.now(), role: "user", content, createdAt: new Date().toISOString() }]);
    setInput(""); setPendingMood(null); pendingMoodRef.current = null;
    setIsStreaming(true); setStreamingContent("");
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, mood }), credentials: "include" });
      if (!res.ok) throw new Error();
      const reader = res.body?.getReader(); const decoder = new TextDecoder(); let full = "";
      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const d = JSON.parse(line.slice(6));
              if (d.content) { full += d.content; setStreamingContent(full); }
              if (d.done) { const msg: ChatMessage = { id: d.messageId || Date.now() + 1, role: "assistant", content: full, createdAt: new Date().toISOString(), hasRecommendations: d.hasRecommendations }; if (d.hasRecommendations && d.messageId) { try { const cr = await fetch(`/api/messages/${d.messageId}/recommendations`, { credentials: "include" }); if (cr.ok) { const cd = await cr.json(); msg.recommendationCards = cd.cards; } } catch {} } setMessages(prev => { const updated = [...prev, msg]; const uc = updated.filter(m => m.role === "user").length; if (uc >= 1 && conversationId) fetch(`/api/conversations/${conversationId}/title`, { method: "POST", credentials: "include" }).then(r => r.json()).then(d => { if (d.title && !d.skipped) queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); }).catch(() => {}); return updated; }); setStreamingContent(""); }
            } catch {}
          }
        }
      }
    } catch { setSendError("Couldn't send your message. Please try again."); setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: "I'm sorry, I had trouble with that. Please try again.", createdAt: new Date().toISOString() }]); }
    finally { setIsStreaming(false); setStreamingContent(""); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const handleNewChat = () => { initRef.current = false; setConversationId(null); setMessages([]); localStorage.removeItem("soulguide_conversation_id"); createConversation(false); };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder; audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(100); setIsRecording(true);
    } catch { setSendError("Could not access microphone."); }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
    return new Promise<Blob>(resolve => {
      const rec = mediaRecorderRef.current!;
      rec.onstop = () => { const blob = new Blob(audioChunksRef.current, { type: "audio/webm" }); rec.stream.getTracks().forEach(t => t.stop()); setIsRecording(false); resolve(blob); };
      rec.stop();
    });
  };

  const handleMicClick = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob && blob.size > 0) {
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64 = (reader.result as string).split(",")[1];
              const res = await fetch("/api/voice/transcribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio: base64, format: blob.type.includes("mp4") ? "mp4" : "webm" }) });
              if (res.ok) { const { transcript } = await res.json(); if (transcript) setInput(prev => prev ? prev + " " + transcript : transcript); }
            } catch {} finally { setIsTranscribing(false); }
          };
          reader.onerror = () => setIsTranscribing(false);
          reader.readAsDataURL(blob);
        } catch { setIsTranscribing(false); }
      }
    } else { await startRecording(); }
  };

  const playMessageAudio = async (messageId: number, text: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingMessageId === messageId) { setPlayingMessageId(null); return; }
    setPlayingMessageId(messageId);
    try {
      const res = await fetch("/api/voice/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voice: "nova" }) });
      if (res.ok) {
        const { audio } = await res.json();
        const blob = new Blob([Uint8Array.from(atob(audio), c => c.charCodeAt(0))], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        const el = new Audio(url); audioRef.current = el;
        el.onended = () => { setPlayingMessageId(null); URL.revokeObjectURL(url); audioRef.current = null; };
        await el.play();
      } else { setPlayingMessageId(null); }
    } catch { setPlayingMessageId(null); }
  };

  const getWelcomeMessage = () => {
    const msgs: Record<string, string> = {
      seeker_in_void: "I'm here to walk with you through the silence. What's on your heart today?",
      doubter_in_crisis: "Questions are welcome here. Your doubts show you're thinking deeply. What's on your mind?",
      isolated_wanderer: "You're not alone anymore. Let's explore this journey together. How are you feeling?",
      guilt_ridden_striver: "You are loved exactly as you are, right now. What would you like to talk about?",
      overwhelmed_survivor: "I know life is a lot right now. Even 30 seconds counts. What's weighing on you?",
      hungry_beginner: "Welcome! There's no such thing as a silly question here. What are you curious about?",
    };
    return persona?.primaryPersona ? (msgs[persona.primaryPersona] || "Welcome! How can I support you today?") : "Welcome! How can I support you today?";
  };

  if (personaLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#EBEAE5" }}>
      <Loader2 className="w-6 h-6 animate-spin text-[#1b291d]" />
    </div>
  );

  return (
    <div className={`h-dvh flex ${hideNav ? "" : "pb-[64px] md:pb-0"}`} style={{ background: "#EBEAE5" }}>
      {/* Desktop: persistent conversation history rail */}
      <aside className="hidden md:flex flex-col w-[300px] flex-shrink-0 border-r border-black">
        <div className="px-6 h-[89px] flex items-center border-b-2 border-black">
          <h1 className="font-serif text-[26px] italic leading-none text-black">SoulGuide</h1>
        </div>
        <div className="px-4 py-4 border-b border-[#D8D7D2]">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-[#1b291d] text-white text-[11px] font-semibold tracking-[0.18em] uppercase rounded-full py-3"
            data-testid="button-new-chat-desktop"
          >
            <Plus size={14} /> New Conversation
          </button>
        </div>
        <div className="px-6 py-3 border-b border-[#D8D7D2]">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#73726C]">Conversations</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-6 py-6 text-[13px] text-[#73726C] italic">No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={async () => { const loaded = await loadExistingConversation(conv.id); if (loaded) { setPendingMood(null); setShowMoodCheckIn(false); } }}
                className={`w-full text-left px-6 py-4 border-b border-[#E6E5E0] transition-colors hover:bg-white/50 ${conversationId === conv.id ? "bg-white" : ""}`}
                data-testid={`button-conversation-${conv.id}`}
              >
                <p className={`font-serif text-[16px] leading-snug truncate ${conversationId === conv.id ? "text-[#1b291d]" : "text-black"}`}>
                  {conv.title || "New Conversation"}
                </p>
                {conv.updatedAt && (
                  <p className="text-[11px] text-[#73726C] mt-1">{formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}</p>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Header — mobile (original) */}
      <header className="md:hidden bg-white border-b border-[#D8D7D2] flex items-center">
        <div className="py-5 px-4 flex items-center border-r border-[#D8D7D2]">
          <ConversationSidebar
            currentConversationId={conversationId}
            onSelect={async (id) => { const loaded = await loadExistingConversation(id); if (loaded) { setPendingMood(null); setShowMoodCheckIn(false); } }}
            onNewChat={handleNewChat}
          />
        </div>
        <div className="flex-1 py-5 px-6 flex items-center">
          <h1 className="font-serif text-[22px] leading-none text-black tracking-wide">Soul Care</h1>
        </div>
        <button onClick={handleNewChat} className="border-l border-[#D8D7D2] py-5 px-6 text-[#73726C]" data-testid="button-new-chat">
          <RotateCcw size={18} />
        </button>
      </header>

      {/* Header — desktop (slim, within main column) */}
      <header className="hidden md:flex items-center h-[89px] border-b-2 border-black px-8 flex-shrink-0">
        <span className="font-serif text-[20px] italic text-[#73726C]">Soul Care — a space to think and pray</span>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col">
        {initError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
            <h2 className="font-serif text-[24px] text-black mb-3">Connection Issue</h2>
            <p className="text-[15px] text-[#73726C] mb-6">{initError}</p>
            <button onClick={handleNewChat} className="px-8 py-3 font-semibold text-[13px] tracking-[0.2em] uppercase" style={{ background: "#1b291d", color: "#fff" }} data-testid="button-retry">Try Again</button>
          </div>
        ) : messages.length === 0 && !streamingContent ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            {isInitializing ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#1b291d]" />
            ) : (
              <>
                <p className="font-serif text-[32px] text-black mb-3 leading-tight">How are you feeling?</p>
                <p className="text-[16px] text-[#73726C] mb-10 leading-relaxed max-w-xs">{getWelcomeMessage()}</p>
                <div className="w-full max-w-sm space-y-2">
                  {STARTERS.map((s, i) => (
                    <button key={i} onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                      className="w-full text-left px-5 py-4 bg-white border border-[#D8D7D2] rounded-2xl flex items-center justify-between"
                      data-testid={`button-starter-${i}`}>
                      <span className="font-serif text-[17px] text-black">{s}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D8D7D2" strokeWidth="1.5" strokeLinecap="square"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto w-full mt-auto">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onPlayAudio={playMessageAudio} isPlaying={playingMessageId === msg.id} />
            ))}
            {streamingContent && <MessageBubble message={{ id: -1, role: "assistant", content: streamingContent, createdAt: new Date().toISOString() }} isStreaming />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input area */}
      <div className="border-t border-[#D8D7D2] flex-shrink-0" style={{ background: "#EBEAE5" }}>
        <MoodCheckIn
          visible={showMoodCheckIn}
          onSelect={mood => { setPendingMood(mood); pendingMoodRef.current = mood; setShowMoodCheckIn(false); setTimeout(() => sendMessage(), 50); }}
          onSkip={() => { setPendingMood(null); pendingMoodRef.current = null; setShowMoodCheckIn(false); setTimeout(() => sendMessage(), 50); }}
        />
        <div className="flex items-end gap-2 px-4 py-4 max-w-2xl mx-auto w-full">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => { setIsInputFocused(false); if (!input.trim()) setHideNav(false); }}
            placeholder="Share what's on your heart..."
            rows={1}
            className="flex-1 resize-none bg-white border border-[#D8D7D2] focus:border-[#1b291d] outline-none px-5 py-3 font-serif text-[16px] md:text-[17px] text-black max-h-[140px] transition-colors rounded-full"
            style={{ minHeight: "48px" }}
            data-testid="input-message"
          />
          <button onClick={handleMicClick} disabled={isStreaming || isTranscribing || !conversationId || isInitializing}
            className="w-11 h-11 flex items-center justify-center border border-[#D8D7D2] bg-white rounded-full disabled:opacity-40 transition-colors flex-shrink-0"
            style={{ background: isRecording ? "#b7453b" : "#fff", color: isRecording ? "#fff" : "#73726C" }}
            data-testid="button-mic">
            {isTranscribing ? <Loader2 size={16} className="animate-spin" /> : isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button onClick={sendMessage} disabled={!input.trim() || isStreaming || !conversationId || isInitializing}
            className="w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-40 flex-shrink-0 font-semibold text-[18px]"
            style={{ background: "#1b291d", color: "#fff" }}
            data-testid="button-send">
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : "↑"}
          </button>
        </div>
        {sendError && <p className="text-[12px] text-red-600 px-4 pb-2 text-center">{sendError}</p>}
        <p className="text-[10px] text-[#73726C] text-center pb-3 tracking-wide">Your conversations are private and meant to support, not replace, spiritual community.</p>
      </div>
      </div>
    </div>
  );
}
