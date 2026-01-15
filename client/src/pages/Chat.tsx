import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, RotateCcw, MessageCircle, AlertTriangle, Heart, HelpCircle, Sunrise, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import RecommendationCards from "@/components/RecommendationCards";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const { data: persona, isLoading: personaLoading } = useQuery<{ primaryPersona?: string }>({
    queryKey: ["/api/persona"],
  });

  const loadExistingConversation = useCallback(async (convId: number) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`);
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

  const createConversation = useCallback(async () => {
    setIsInitializing(true);
    setInitError(null);
    
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      if (response.ok) {
        const data = await response.json();
        setConversationId(data.id);
        setMessages([]);
        localStorage.setItem("soulguide_conversation_id", String(data.id));
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
      
      // No existing conversation, create new one
      await createConversation();
    };
    
    initChat();
  }, [createConversation, loadExistingConversation]);

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || isStreaming) return;
    
    setSendError(null);

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
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
                      const cardsResponse = await fetch(`/api/messages/${data.messageId}/recommendations`);
                      if (cardsResponse.ok) {
                        const cardsData = await cardsResponse.json();
                        assistantMessage.recommendationCards = cardsData.cards;
                      }
                    } catch (cardError) {
                      console.error("Error fetching recommendation cards:", cardError);
                    }
                  }
                  
                  setMessages((prev) => [...prev, assistantMessage]);
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
    createConversation();
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/50 glass">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-gentle" />
              <div className="relative w-9 h-9 rounded-full bg-white dark:bg-card shadow-subtle flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
            </div>
            <span className="font-serif font-bold text-lg tracking-premium">Soulguide</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="hover:shadow-subtle transition-all"
              data-testid="button-new-chat"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-4 py-6">
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
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
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

        <div className="border-t border-border/50 glass p-4">
          <div className="max-w-3xl mx-auto">
            <Card className="flex items-end gap-2 p-2 glass-subtle glow-border shadow-subtle">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your heart..."
                className="min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base tracking-refined"
                rows={1}
                data-testid="input-message"
              />
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
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            </Card>
            <p className="text-xs text-muted-foreground text-center mt-2 tracking-refined">
              Your conversations are private and meant to support, not replace, spiritual community.
            </p>
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

const conversationStarters = [
  { icon: Heart, text: "I'm feeling distant from God", color: "text-rose-500 dark:text-rose-400" },
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
        className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-primary"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <MessageCircle className="w-10 h-10 text-primary" />
      </motion.div>
      
      <motion.h2 
        className="font-serif text-2xl sm:text-3xl font-bold tracking-display mb-3 text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {isInitializing ? "Starting your conversation..." : welcomeMessage}
      </motion.h2>
      
      <motion.p 
        className="text-muted-foreground max-w-md tracking-refined"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {isInitializing ? "Just a moment..." : "This is a safe space to share your thoughts, ask questions, and explore your faith."}
      </motion.p>

      {!isInitializing && (
        <motion.div 
          className="mt-8 w-full max-w-sm space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-premium mb-3">
            Not sure where to start?
          </p>
          {conversationStarters.map((starter, index) => (
            <motion.button
              key={starter.text}
              onClick={() => onStarterPress(starter.text)}
              className="w-full flex items-center gap-3 p-4 rounded-xl glass-subtle glow-border shadow-subtle hover:shadow-elevated transition-all text-left group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid={`button-starter-${index}`}
            >
              <starter.icon className={cn("w-5 h-5", starter.color)} />
              <span className="flex-1 text-sm font-medium tracking-refined text-foreground">
                {starter.text}
              </span>
              <span className="text-muted-foreground group-hover:text-primary transition-colors">
                <Send className="w-4 h-4" />
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function MessageBubble({
  message,
  isStreaming = false,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const [, navigate] = useLocation();
  const isUser = message.role === "user";

  return (
    <motion.div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid={`message-${message.role}-${message.id}`}
    >
      {!isUser && (
        <div className="relative flex-shrink-0 mt-1">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-gentle" />
          <div className="relative w-9 h-9 rounded-full bg-white dark:bg-card shadow-subtle flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        </div>
      )}
      <div className="flex flex-col max-w-[80%] sm:max-w-md">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 tracking-refined",
            isUser
              ? "gradient-primary text-white shadow-primary rounded-br-md"
              : "glass-subtle glow-border shadow-subtle rounded-bl-md"
          )}
        >
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {parseContentWithVerseLinks(message.content, navigate, isUser)}
            {isStreaming && (
              <span className="inline-flex items-center gap-1 ml-2">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            )}
          </p>
        </div>
        
        {!isUser && message.recommendationCards && message.recommendationCards.length > 0 && (
          <RecommendationCards cards={message.recommendationCards} />
        )}
      </div>
    </motion.div>
  );
}
