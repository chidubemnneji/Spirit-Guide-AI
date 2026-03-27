import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Sparkles, Flame, BookOpen, Calendar, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Notification } from "@shared/schema";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  welcome:            { icon: Sparkles,  color: "text-primary",       bg: "bg-primary/10" },
  devotional_ready:   { icon: BookOpen,  color: "text-primary",       bg: "bg-primary/10" },
  streak_risk:        { icon: Flame,     color: "text-amber-500",     bg: "bg-amber-500/10" },
  weekly_reflection:  { icon: Calendar,  color: "text-blue-500",      bg: "bg-blue-500/10" },
};

function getMilestoneConfig(type: string) {
  if (type.startsWith("milestone_")) {
    return { icon: Sparkles, color: "text-primary", bg: "bg-primary/10" };
  }
  return TYPE_CONFIG[type] || { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
}

interface NotificationDrawerProps {
  onClose: () => void;
}

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: (id: number) => void }) {
  const config = getMilestoneConfig(notification.type);
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4 rounded-2xl border transition-colors",
        notification.isRead
          ? "border-border/40 bg-transparent"
          : "border-primary/20 bg-primary/3"
      )}
      onClick={() => !notification.isRead && onRead(notification.id)}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", config.bg)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium", !notification.isRead && "text-foreground")}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notification.body}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  );
}

export function NotificationDrawer({ onClose }: NotificationDrawerProps) {
  const { data, isLoading } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ["/api/notifications"],
  });

  const readMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/40 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed top-0 right-0 bottom-0 w-[300px] bg-card border-l border-border z-50 flex flex-col"
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        exit={{ x: 300 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div>
            <span className="font-serif text-base font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => readAllMutation.mutate()}
                className="text-xs text-muted-foreground gap-1 h-8 rounded-xl"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                All read
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nothing yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={id => readMutation.mutate(id)}
              />
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}
