import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, RotateCcw, MessageCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, Conversation } from "@shared/schema";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
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

  // Initialize conversation on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    createConversation();
  }, [createConversation]);

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
                    id: Date.now() + 1,
                    role: "assistant",
                    content: fullContent,
                    createdAt: new Date().toISOString(),
                  };
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
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-serif font-semibold text-lg">Soulguide</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
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
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-semibold mb-3">
                {isInitializing ? "Starting your conversation..." : getWelcomeMessage()}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {isInitializing ? "Just a moment..." : "This is a safe space to share your thoughts, ask questions, and explore your faith."}
              </p>
            </div>
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

        <div className="border-t border-border bg-background p-4">
          <div className="max-w-3xl mx-auto">
            <Card className="flex items-end gap-2 p-2 bg-card">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your heart..."
                className="min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 text-base"
                rows={1}
                data-testid="input-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming || !conversationId || isInitializing}
                size="icon"
                data-testid="button-send"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </Card>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Your conversations are private and meant to support, not replace, spiritual community.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({
  message,
  isStreaming = false,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
      data-testid={`message-${message.role}-${message.id}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] sm:max-w-md rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border rounded-bl-md"
        )}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current opacity-50 animate-pulse ml-1" />
          )}
        </p>
      </div>
    </div>
  );
}
