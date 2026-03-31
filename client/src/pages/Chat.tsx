import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2, Sparkles, RotateCcw, MessageCircle, AlertTriangle, Cross, HelpCircle, Sunrise, Lightbulb, ArrowRight, CloudRain, Minus, Sun, Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScroll } from "@/context/ScrollContext";
import RecommendationCards from "@/components/RecommendationCards";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { MoodCheckIn, type Mood } from "@/components/MoodCheckIn";
import { Logo } from "@/components/Logo";
import type { Message, Conversation, RecommendationCard } from "@shared/schema";

// Bible verse pattern: Book Chapter:Verse or Book Chapter:Verse-Verse
// Matches: "John 3:16", "1 Corinthians 13:4", "Song of Solomon 2:1", "Psalm 23:1-6"
const BIBLE_VERSE_PATTERN = /\b((?:1|2|3|I|II|III)?\s*[A-Za-z]+(?:\s+(?:of\s+)?[A-Za-z]+)*)\s+(\d+):(\d+)(?:-(\d+))?\b/g;

// Map of common book name variations to standardized names
const BOOK_NAME_MAP: Record<string, string> = {
  "gen": "Genesis", "genesis": "Genesis",
  "exo": "Exodus", "exodus": "Exodus",
  "lev": "Leviticus", "leviticus": "Leviticus",
  "num": "Numbers", "numbers": "Numbers",
  "deu": "Deuteronomy", "deut": "Deuteronomy", "deuteronomy": "Deuteronomy",
  "jos": "Joshua", "josh": "Joshua", "joshua": "Joshua",
  "jdg": "Judges", "judg": "Judges", "judges": "Judges",
  "rut": "Ruth", "ruth": "Ruth",
  "1sa": "1 Samuel", "1sam": "1 Samuel", "1 samuel": "1 Samuel", "1 sam": "1 Samuel",
  "2sa": "2 Samuel", "2sam": "2 Samuel", "2 samuel": "2 Samuel", "2 sam": "2 Samuel",
  "1ki": "1 Kings", "1 kings": "1 Kings", "1 kgs": "1 Kings",
  "2ki": "2 Kings", "2 kings": "2 Kings", "2 kgs": "2 Kings",
  "1ch": "1 Chronicles", "1 chronicles": "1 Chronicles", "1 chr": "1 Chronicles",
  "2ch": "2 Chronicles", "2 chronicles": "2 Chronicles", "2 chr": "2 Chronicles",
  "ezr": "Ezra", "ezra": "Ezra",
  "neh": "Nehemiah", "nehemiah": "Nehemiah",
  "est": "Esther", "esther": "Esther",
  "job": "Job",
  "psa": "Psalms", "psalm": "Psalms", "psalms": "Psalms", "ps": "Psalms",
  "pro": "Proverbs", "prov": "Proverbs", "proverbs": "Proverbs",
  "ecc": "Ecclesiastes", "eccl": "Ecclesiastes", "ecclesiastes": "Ecclesiastes",
  "sol": "Song of Solomon", "song": "Song of Solomon", "song of solomon": "Song of Solomon", "songs": "Song of Solomon",
  "isa": "Isaiah", "isaiah": "Isaiah",
  "jer": "Jeremiah", "jeremiah": "Jeremiah",
  "lam": "Lamentations", "lamentations": "Lamentations",
  "eze": "Ezekiel", "ezek": "Ezekiel", "ezekiel": "Ezekiel",
  "dan": "Daniel", "daniel": "Daniel",
  "hos": "Hosea", "hosea": "Hosea",
  "joe": "Joel", "joel": "Joel",
  "amo": "Amos", "amos": "Amos",
  "oba": "Obadiah", "obadiah": "Obadiah",
  "jon": "Jonah", "jonah": "Jonah",
  "mic": "Micah", "micah": "Micah",
  "nah": "Nahum", "nahum": "Nahum",
  "hab": "Habakkuk", "habakkuk": "Habakkuk",
  "zep": "Zephaniah", "zephaniah": "Zephaniah",
  "hag": "Haggai", "haggai": "Haggai",
  "zec": "Zechariah", "zechariah": "Zechariah",
  "mal": "Malachi", "malachi": "Malachi",
  "mat": "Matthew", "matt": "Matthew", "matthew": "Matthew",
  "mar": "Mark", "mark": "Mark",
  "luk": "Luke", "luke": "Luke",
  "joh": "John", "john": "John",
  "act": "Acts", "acts": "Acts",
  "rom": "Romans", "romans": "Romans",
  "1co": "1 Corinthians", "1 corinthians": "1 Corinthians", "1 cor": "1 Corinthians",
  "2co": "2 Corinthians", "2 corinthians": "2 Corinthians", "2 cor": "2 Corinthians",
  "gal": "Galatians", "galatians": "Galatians",
  "eph": "Ephesians", "ephesians": "Ephesians",
  "phi": "Philippians", "phil": "Philippians", "philippians": "Philippians",
  "col": "Colossians", "colossians": "Colossians",
  "1th": "1 Thessalonians", "1 thessalonians": "1 Thessalonians", "1 thess": "1 Thessalonians",
  "2th": "2 Thessalonians", "2 thessalonians": "2 Thessalonians", "2 thess": "2 Thessalonians",
  "1ti": "1 Timothy", "1 timothy": "1 Timothy", "1 tim": "1 Timothy",
  "2ti": "2 Timothy", "2 timothy": "2 Timothy", "2 tim": "2 Timothy",
  "tit": "Titus", "titus": "Titus",
  "phm": "Philemon", "philemon": "Philemon",
  "heb": "Hebrews", "hebrews": "Hebrews",
  "jam": "James", "james": "James",
  "1pe": "1 Peter", "1 peter": "1 Peter", "1 pet": "1 Peter",
  "2pe": "2 Peter", "2 peter": "2 Peter", "2 pet": "2 Peter",
  "1jo": "1 John", "1 john": "1 John",
  "2jo": "2 John", "2 john": "2 John",
  "3jo": "3 John", "3 john": "3 John",
  "jud": "Jude", "jude": "Jude",
  "rev": "Revelation", "revelation": "Revelation",
};

function normalizeBookName(rawBook: string): string {
  const normalized = rawBook.toLowerCase().trim();
  return BOOK_NAME_MAP[normalized] || rawBook.trim();
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  hasRecommendations?: boolean;
  recommendationCards?: RecommendationCard[];
}

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
  const [showDisclaimer, setShowDisclaimer] = useState(
    () => !localStorage.getItem("soulguide_disclaimer_seen")
  );
  const pendingMoodRef = useRef<Mood | null>(null);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initRef = useRef(false);
  const reflectProcessedRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { setHideNav, hideNav } = useScroll();

  // No intro gate needed - MeetPrayerPartner is shown post-onboarding via transition flow

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Hide bottom nav when input is focused or has content
  // Also scroll to bottom so last message stays visible above keyboard
  useEffect(() => {
    setHideNav(isInputFocused || input.length > 0);
    if (isInputFocused) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300); // delay matches keyboard animation
    }
  }, [isInputFocused, input, setHideNav]);

  // Reset hideNav when leaving the chat page
  useEffect(() => {
    return () => {
      setHideNav(false);
    };
  }, [setHideNav]);

  const { data: persona, isLoading: personaLoading } = useQuery<{ primaryPersona?: string }>({
    queryKey: ["/api/persona"],
  });

  const loadExistingConversation = useCallback(async (convId: number) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setConversationId(convId);
        setMessages(data.messages || []);
        localStorage.setItem("soulguide_conversation_id", String(convId));
        return true;
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
    return false;
  }, []);

  const createConversation = useCallback(async (isColdStart = false) => {
    setIsInitializing(true);
    setInitError(null);
    
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setConversationId(data.id);
        setMessages([]);
        localStorage.setItem("soulguide_conversation_id", String(data.id));

        // Fire cold-start opening message for brand new users
        if (isColdStart) {
          try {
            const csRes = await fetch("/api/chat/cold-start", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId: data.id }),
              credentials: "include",
            });
            if (csRes.ok) {
              const csData = await csRes.json();
              if (csData.message) {
                setMessages([csData.message]);
              }
            }
          } catch (csError) {
            console.error("Cold start error (non-blocking):", csError);
          }
        }
      } else {
        setInitError("Could not start a conversation. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setInitError("Connection issue. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Initialize conversation on mount - load existing or create new
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const initChat = async () => {
      setIsInitializing(true);
      
      // Try to load existing conversation from localStorage
      const savedConvId = localStorage.getItem("soulguide_conversation_id");
      if (savedConvId) {
        const loaded = await loadExistingConversation(parseInt(savedConvId));
        if (loaded) {
          setIsInitializing(false);
          return;
        }
      }

      // Check if user has any conversations at all (first time user)
      let isFirstEver = false;
      try {
        const convRes = await fetch("/api/conversations", { credentials: "include" });
        if (convRes.ok) {
          const convData = await convRes.json();
          isFirstEver = Array.isArray(convData) && convData.length === 0;
        }
      } catch {
        // can't determine — treat as returning user
      }
      
      // Create conversation, trigger cold start for brand new users
      await createConversation(isFirstEver);
    };
    
    initChat();
  }, [createConversation, loadExistingConversation]);

  // Function to send a message programmatically (for reflection from Bible page)
  const sendMessageDirect = useCallback(async (messageContent: string, convId: number) => {
    if (!messageContent.trim() || isStreaming) return;
    
    setSendError(null);

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: messageContent.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
                if (data.done) {
                  const assistantMessage: ChatMessage = {
                    id: data.messageId || Date.now() + 1,
                    role: "assistant",
                    content: fullContent,
                    createdAt: new Date().toISOString(),
                    hasRecommendations: data.hasRecommendations,
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  setStreamingContent("");
                }
              } catch (e) {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Send message error:", error);
      setSendError("Could not send message. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  // Handle reflection from Bible page via URL parameters
  useEffect(() => {
    if (reflectProcessedRef.current || isInitializing || !conversationId) return;
    
    const params = new URLSearchParams(searchString);
    const verse = params.get("verse");
    const text = params.get("text");
    
    if (verse && text) {
      reflectProcessedRef.current = true;
      navigate("/chat", { replace: true });
      const reflectionMessage = `I want to reflect on ${verse}: "${text}"`;
      sendMessageDirect(reflectionMessage, conversationId);
    }
  }, [searchString, isInitializing, conversationId, navigate, sendMessageDirect]);

  // Handle chat mode from Devotion page — load persistent channel conversation
  const [chatModeProcessed, setChatModeProcessed] = useState(false);
  useEffect(() => {
    if (chatModeProcessed || isInitializing) return;

    const params = new URLSearchParams(searchString);
    const mode = params.get("mode");

    if (mode !== "checkin" && mode !== "devotional") return;
    setChatModeProcessed(true);
    navigate("/chat", { replace: true });

    const loadChannel = async () => {
      setIsInitializing(true);
      try {
        // Fetch or create the persistent channel conversation
        const res = await fetch(`/api/conversations/channel/${mode}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const { conversation, isNew } = await res.json();

        setConversationId(conversation.id);
        localStorage.setItem("soulguide_conversation_id", String(conversation.id));

        // Load existing messages
        const msgRes = await fetch(`/api/conversations/${conversation.id}/messages`, {
          credentials: "include",
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          const existing = msgData.messages || [];
          setMessages(existing);

          // Only fire AI opener if this is a fresh session today
          // (no messages today yet, or brand new conversation)
          const today = new Date().toISOString().split("T")[0];
          const hasMessageToday = existing.some((m: ChatMessage) =>
            m.createdAt && m.createdAt.startsWith(today)
          );

          if (!hasMessageToday) {
            // Get today's devotional for context
            let devotionalContext = "";
            try {
              const devRes = await fetch("/api/devotional/today", { credentials: "include" });
              if (devRes.ok) {
                const devData = await devRes.json();
                if (devData.data?.scriptureReference) {
                  devotionalContext = `Today's verse: ${devData.data.scriptureReference} — "${devData.data.scriptureText}"`;
                }
              }
            } catch {}

            const openerMode = mode === "devotional" ? "devotional" : "checkin";
            const openerRes = await fetch(
              `/api/chat/personalized-opening?mode=${openerMode}&context=${encodeURIComponent(devotionalContext)}`,
              { credentials: "include" }
            );
            if (openerRes.ok) {
              const openerData = await openerRes.json();
              if (openerData.message) {
                // Save opener as assistant message
                const saveRes = await fetch(
                  `/api/conversations/${conversation.id}/system-message`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ content: openerData.message }),
                  }
                );
                if (saveRes.ok) {
                  const refreshRes = await fetch(
                    `/api/conversations/${conversation.id}/messages`,
                    { credentials: "include" }
                  );
                  if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    setMessages(refreshData.messages || []);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Channel load error:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    loadChannel();
  }, [searchString, isInitializing, chatModeProcessed, navigate]);

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || isStreaming) return;
    
    // Show mood check-in before first user message if not yet set
    if (messages.filter(m => m.role === "user").length === 0 && !pendingMood && !showMoodCheckIn) {
      setShowMoodCheckIn(true);
      return;
    }

    setSendError(null);
    setShowMoodCheckIn(false);

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = input.trim();
    const moodToSend = pendingMoodRef.current;
    setInput("");
    setPendingMood(null);
    pendingMoodRef.current = null;
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent, mood: moodToSend }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
                if (data.done) {
                  const assistantMessage: ChatMessage = {
                    id: data.messageId || Date.now() + 1,
                    role: "assistant",
                    content: fullContent,
                    createdAt: new Date().toISOString(),
                    hasRecommendations: data.hasRecommendations,
                  };
                  
                  // If there are recommendations, fetch them
                  if (data.hasRecommendations && data.messageId) {
                    try {
                      const cardsResponse = await fetch(`/api/messages/${data.messageId}/recommendations`, {
                        credentials: "include",
                      });
                      if (cardsResponse.ok) {
                        const cardsData = await cardsResponse.json();
                        assistantMessage.recommendationCards = cardsData.cards;
                      }
                    } catch (cardError) {
                      console.error("Error fetching recommendation cards:", cardError);
                    }
                  }
                  
                  setMessages((prev) => {
                    const updated = [...prev, assistantMessage];
                    const userCount = updated.filter(m => m.role === "user").length;
                    if (userCount === 4 && conversationId) {
                      fetch(`/api/conversations/${conversationId}/title`, { method: "POST", credentials: "include" })
                        .then(r => r.json()).then(d => { if (d.title && !d.skipped) queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }); }).catch(() => {});
                    }
                    return updated;
                  });
                  setStreamingContent("");
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSendError("Couldn't send your message. Please try again.");
      // Add error message to display
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "I'm sorry, I had trouble processing that. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    initRef.current = false;
    setConversationId(null);
    setMessages([]);
    localStorage.removeItem("soulguide_conversation_id");
    createConversation(false);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setSendError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;

    return new Promise<Blob>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        recorder.stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  };

  const handleMicClick = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob && audioBlob.size > 0) {
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64 = (reader.result as string).split(",")[1];
              const response = await fetch("/api/voice/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audio: base64, format: "webm" }),
              });
              if (response.ok) {
                const { transcript } = await response.json();
                if (transcript) {
                  setInput((prev) => (prev ? prev + " " + transcript : transcript));
                }
              } else {
                console.error("Transcription failed:", response.status);
              }
            } catch (fetchError) {
              console.error("Transcription fetch error:", fetchError);
            } finally {
              setIsTranscribing(false);
            }
          };
          reader.onerror = () => {
            console.error("FileReader error");
            setIsTranscribing(false);
          };
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error("Transcription error:", error);
          setIsTranscribing(false);
        }
      }
    } else {
      await startRecording();
    }
  };

  const playMessageAudio = async (messageId: number, text: string) => {
    // Stop any currently playing audio first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingMessageId === messageId) {
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(messageId);
    try {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "nova" }),
      });
      if (response.ok) {
        const { audio } = await response.json();
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audio), (c) => c.charCodeAt(0))],
          { type: "audio/mp3" }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);
        audioRef.current = audioElement;
        audioElement.onended = () => {
          setPlayingMessageId(null);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
        await audioElement.play();
      } else {
        setPlayingMessageId(null);
      }
    } catch (error) {
      console.error("Playback error:", error);
      setPlayingMessageId(null);
    }
  };

  const getWelcomeMessage = () => {
    if (persona?.primaryPersona) {
      const personaMessages: Record<string, string> = {
        seeker_in_void: "I'm here to walk with you through the silence. What's on your heart today?",
        doubter_in_crisis: "Questions are welcome here. Your doubts show you're thinking deeply. What's on your mind?",
        isolated_wanderer: "You're not alone anymore. Let's explore this journey together. How are you feeling?",
        guilt_ridden_striver: "You are loved exactly as you are, right now. What would you like to talk about?",
        overwhelmed_survivor: "I know life is a lot right now. Even 30 seconds counts. What's weighing on you?",
        hungry_beginner: "Welcome! There's no such thing as a silly question here. What are you curious about?",
        momentum_breaker: "Every return is a victory. You're here now, and that's what matters. What brings you back?",
        comparison_captive: "Your journey is uniquely yours. Let's focus on where you are. How can I help?",
      };
      return personaMessages[persona.primaryPersona] || "Welcome! How can I support you on your spiritual journey today?";
    }
    return "Welcome! How can I support you on your spiritual journey today?";
  };

  if (personaLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Preparing your companion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-dvh bg-background flex flex-col ${hideNav ? "" : "pb-16"}`}>
      <header className="sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ConversationSidebar
              currentConversationId={conversationId}
              onSelect={async (id) => {
                const loaded = await loadExistingConversation(id);
                if (loaded) {
                  setPendingMood(null);
                  setShowMoodCheckIn(false);
                }
              }}
              onNewChat={handleNewChat}
            />
            <Logo size={30} showWordmark />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="rounded-full"
              data-testid="button-new-chat"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col w-full">
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {initError ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="font-serif text-2xl font-semibold mb-3">
                Connection Issue
              </h2>
              <p className="text-muted-foreground max-w-md mb-4">
                {initError}
              </p>
              <Button onClick={handleNewChat} data-testid="button-retry">
                Try Again
              </Button>
            </div>
          ) : messages.length === 0 && !streamingContent ? (
            <EmptyChatState 
              isInitializing={isInitializing}
              welcomeMessage={getWelcomeMessage()}
              onStarterPress={(text) => {
                setInput(text);
                textareaRef.current?.focus();
              }}
            />
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onPlayAudio={playMessageAudio}
                  isPlaying={playingMessageId === message.id}
                />
              ))}
              {streamingContent && (
                <MessageBubble
                  message={{
                    id: -1,
                    role: "assistant",
                    content: streamingContent,
                    createdAt: new Date().toISOString(),
                  }}
                  isStreaming
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border/50 glass p-3 pb-safe flex-shrink-0">
          <div className="w-full">
            <MoodCheckIn
              visible={showMoodCheckIn}
              onSelect={(mood) => {
                setPendingMood(mood);
                pendingMoodRef.current = mood;
                setShowMoodCheckIn(false);
                setTimeout(() => sendMessage(), 50);
              }}
              onSkip={() => {
                setPendingMood(null);
                pendingMoodRef.current = null;
                setShowMoodCheckIn(false);
                setTimeout(() => sendMessage(), 50);
              }}
            />
            <Card className="flex items-end gap-2 p-2 glass-subtle glow-border shadow-subtle">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  setIsInputFocused(false);
                  if (!input.trim()) setHideNav(false);
                }}
                placeholder="Share what's on your heart..."
                className="min-h-[44px] max-h-[160px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm tracking-refined"
                rows={1}
                data-testid="input-message"
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleMicClick}
                  disabled={isStreaming || isTranscribing || !conversationId || isInitializing}
                  size="icon"
                  variant={isRecording ? "destructive" : "ghost"}
                  data-testid="button-mic"
                >
                  {isTranscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming || !conversationId || isInitializing}
                  size="icon"
                  className="gradient-primary shadow-primary"
                  data-testid="button-send"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            </Card>
            {showDisclaimer && false && (
              <p
                className="text-xs text-muted-foreground text-center mt-2 tracking-refined cursor-pointer"
                onClick={() => {
                  localStorage.setItem("soulguide_disclaimer_seen", "1");
                  setShowDisclaimer(false);
                }}
              >
                Your conversations are private and meant to support, not replace, spiritual community.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function parseContentWithVerseLinks(
  content: string,
  navigate: (path: string) => void,
  isUser: boolean
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Reset the regex
  const pattern = new RegExp(BIBLE_VERSE_PATTERN.source, 'g');
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    const fullMatch = match[0];
    const rawBook = match[1];
    const chapter = match[2];
    const verseStart = match[3];
    const verseEnd = match[4];
    
    const book = normalizeBookName(rawBook);
    const verseDisplay = verseEnd ? `${verseStart}-${verseEnd}` : verseStart;
    const verseParam = verseEnd ? `${verseStart}-${verseEnd}` : verseStart;
    
    // Create clickable link
    parts.push(
      <button
        key={`${match.index}-${fullMatch}`}
        onClick={() => navigate(`/bible?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verseParam}`)}
        className={cn(
          "underline underline-offset-2 font-medium hover:opacity-80 transition-opacity",
          isUser ? "text-primary-foreground" : "text-primary"
        )}
        data-testid={`link-verse-${book}-${chapter}-${verseStart}`}
      >
        {fullMatch}
      </button>
    );
    
    lastIndex = match.index + fullMatch.length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [content];
}

const quickResponseChips = [
  { text: "Struggling", icon: CloudRain },
  { text: "Just okay", icon: Minus },
  { text: "Pretty good", icon: Sun },
];

const conversationStarters = [
  { icon: Cross, text: "I'm feeling distant from God", color: "text-rose-500 dark:text-rose-400" },
  { icon: HelpCircle, text: "I have questions about prayer", color: "text-blue-500 dark:text-blue-400" },
  { icon: Sunrise, text: "I'm struggling with doubt", color: "text-amber-500 dark:text-amber-400" },
  { icon: Lightbulb, text: "I want to deepen my faith", color: "text-emerald-500 dark:text-emerald-400" },
];

function EmptyChatState({ 
  isInitializing, 
  welcomeMessage,
  onStarterPress 
}: { 
  isInitializing: boolean; 
  welcomeMessage: string;
  onStarterPress: (text: string) => void;
}) {
  return (
    <motion.div 
      className="h-full flex flex-col items-center justify-center text-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <Cross className="w-10 h-10 text-primary" />
      </motion.div>
      
      <motion.h2 
        className="font-serif text-2xl sm:text-3xl font-bold mb-3 text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {isInitializing ? "Starting your conversation..." : "How are you feeling?"}
      </motion.h2>
      
      <motion.p 
        className="text-muted-foreground max-w-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {isInitializing ? "Just a moment..." : welcomeMessage}
      </motion.p>

      {!isInitializing && (
        <motion.div 
          className="mt-8 w-full max-w-sm space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {quickResponseChips.map((chip, index) => (
              <motion.button
                key={chip.text}
                onClick={() => onStarterPress(`I'm feeling ${chip.text.toLowerCase()}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border transition-all hover-elevate"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.08 }}
                whileTap={{ scale: 0.95 }}
                data-testid={`button-chip-${chip.text.toLowerCase().replace(' ', '-')}`}
              >
                <chip.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{chip.text}</span>
              </motion.button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
              Or share what's on your mind
            </p>
            {conversationStarters.map((starter, index) => (
              <motion.button
                key={starter.text}
                onClick={() => onStarterPress(starter.text)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 transition-all text-left group hover-elevate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.08 }}
                whileTap={{ scale: 0.98 }}
                data-testid={`button-starter-${index}`}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <starter.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {starter.text}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function MessageBubble({
  message,
  isStreaming = false,
  onPlayAudio,
  isPlaying = false,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  onPlayAudio?: (messageId: number, text: string) => void;
  isPlaying?: boolean;
}) {
  const [, navigate] = useLocation();
  const isUser = message.role === "user";

  return (
    <motion.div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid={`message-${message.role}-${message.id}`}
    >
      {isUser ? (
        <div className="max-w-[85%]">
          <div className="rounded-2xl rounded-br-md px-4 py-3 bg-primary text-primary-foreground">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {parseContentWithVerseLinks(message.content, navigate, isUser)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 max-w-[90%]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Cross className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Soul Care</span>
          </div>
          <div className="pl-9">
            <div className="bg-card rounded-2xl rounded-tl-md px-4 py-3 border border-border/50">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {parseContentWithVerseLinks(message.content, navigate, isUser)}
                {isStreaming && (
                  <span className="inline-flex items-center gap-1 ml-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </p>
              {!isStreaming && onPlayAudio && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPlayAudio(message.id, message.content)}
                  className="mt-2"
                  data-testid={`button-play-message-${message.id}`}
                >
                  <Volume2 className={cn("w-3.5 h-3.5 mr-1.5", isPlaying && "animate-pulse")} />
                  <span className="text-xs">{isPlaying ? "Playing..." : "Listen"}</span>
                </Button>
              )}
            </div>
            {message.recommendationCards && message.recommendationCards.length > 0 && (
              <RecommendationCards cards={message.recommendationCards} />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
