import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Conversation } from "@shared/schema";

interface ConversationSidebarProps {
  currentConversationId: number | null;
  onSelect: (conversationId: number) => void;
  onNewChat: () => void;
}

export function ConversationSidebar({
  currentConversationId,
  onSelect,
  onNewChat,
}: ConversationSidebarProps) {
  const [open, setOpen] = useState(false);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    refetchOnWindowFocus: true,
  });

  const handleSelect = (id: number) => {
    onSelect(id);
    setOpen(false);
  };

  const handleNewChat = () => {
    onNewChat();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="rounded-full"
        data-testid="button-conversation-history"
      >
        <Clock className="w-4 h-4" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border z-50 flex flex-col"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <span className="font-serif text-base font-semibold">Conversations</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="rounded-full w-8 h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="px-3 py-3 border-b border-border">
                <Button
                  onClick={handleNewChat}
                  variant="outline"
                  className="w-full rounded-xl gap-2 h-10"
                  data-testid="button-new-conversation"
                >
                  <Plus className="w-4 h-4" />
                  New conversation
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                    <MessageCircle className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <motion.button
                      key={conv.id}
                      onClick={() => handleSelect(conv.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl mx-1 transition-colors hover:bg-muted/60",
                        currentConversationId === conv.id && "bg-primary/8 border border-primary/20"
                      )}
                      whileTap={{ scale: 0.98 }}
                      data-testid={`button-conversation-${conv.id}`}
                    >
                      <p className={cn(
                        "text-sm font-medium truncate",
                        currentConversationId === conv.id ? "text-primary" : "text-foreground"
                      )}>
                        {conv.title || "Conversation"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                      </p>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
