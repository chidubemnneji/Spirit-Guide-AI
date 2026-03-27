import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Sun, BookOpen, ChevronRight, Check, Flame, MessageCircle, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakCelebration } from "@/components/devotional/StreakCelebration";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
import { buildBibleLink } from "@/lib/bibleUtils";
import type { DevotionalGreeting, Devotional } from "@shared/schema";

interface JourneyEntry {
  devotional: Devotional;
  completedAt: Date | string | null;
  rating: number | null;
}

interface JourneyTask {
  id: string;
  title: string;
  subtitle: string;
  icon: "sun" | "book" | "message" | "pen";
  duration: string;
  isCompleted: boolean;
  progress?: number;
  action: () => void;
}

const STRUGGLE_DISPLAY: Record<string, string> = {
  distant_from_god: "Feeling distant from God",
  wrestling_doubts: "Wrestling with doubts",
  feel_alone: "Feeling alone in faith",
  guilt_shame: "Carrying guilt or shame",
  life_overwhelming: "Life feeling overwhelming",
  new_to_faith: "New to faith",
};
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

function WeekCalendar({ completedDays, joinedAt }: { completedDays: string[]; joinedAt?: string | null }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const joinDate = joinedAt ? new Date(joinedAt) : null;
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const dayKey = format(date, "yyyy-MM-dd");
    const isComplete = completedDays.includes(dayKey);
    const isTodayDate = isToday(date);
    const isBeforeJoin = joinDate ? date < new Date(format(joinDate, "yyyy-MM-dd")) : false;

    days.push({
      dayLetter: format(date, "EEEEE"),
      date: date.getDate(),
      isTodayDate,
      isComplete,
      isBeforeJoin,
    });
  }

  return (
    <div className="flex items-center justify-between gap-1 px-2">
      {days.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className={cn(
            "text-xs font-medium",
            d.isBeforeJoin ? "text-muted-foreground/30" : "text-muted-foreground"
          )}>
            {d.dayLetter}
          </span>
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
              d.isBeforeJoin && "opacity-25",
              !d.isBeforeJoin && d.isTodayDate && !d.isComplete && "bg-primary text-primary-foreground",
              !d.isBeforeJoin && d.isComplete && "bg-primary/20 text-primary",
              !d.isBeforeJoin && !d.isTodayDate && !d.isComplete && "text-muted-foreground"
            )}
          >
            {d.isComplete && !d.isBeforeJoin ? (
              <Check className="w-4 h-4" />
            ) : (
              d.date
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StreakBadge({ streak, className }: { streak: number; className?: string }) {
  if (streak === 0) return null;
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20",
        className
      )}
    >
      <Flame className="w-4 h-4 text-primary" />
      <span className="text-sm font-semibold text-primary">{streak} day streak</span>
    </motion.div>
  );
}

function JourneyTaskCard({ task, index }: { task: JourneyTask; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card
        className={cn(
          "border-0 shadow-sm overflow-hidden transition-all",
          task.isCompleted && "opacity-60"
        )}
        data-testid={`card-journey-task-${task.id}`}
      >
        <CardContent className="p-0">
          <button
            onClick={() => !task.isCompleted && task.action()}
            disabled={task.isCompleted}
            className="w-full p-4 flex items-center gap-4 text-left disabled:cursor-default"
            data-testid={`button-start-task-${task.id}`}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0",
              task.isCompleted ? "bg-primary border-primary" : "border-muted-foreground/30"
            )}>
              {task.isCompleted
                ? <Check className="w-4 h-4 text-primary-foreground" />
                : <span className="text-[10px] font-semibold text-muted-foreground">{task.duration.replace(" MIN","m")}</span>
              }
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-base",
                task.isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{task.subtitle}</p>
            </div>

            {!task.isCompleted && (
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Devotion() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(() => {
    // Restore today's local completions from localStorage
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(`soulguide_tasks_${today}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const startedRef = useRef(false);

  const greetingQuery = useQuery<{ success: boolean; data: DevotionalGreeting }>({
    queryKey: ["/api/devotional/greeting"],
  });

  const devotionalQuery = useQuery<{ success: boolean; data: Devotional; completedTaskIds: string[] }>({
    queryKey: ["/api/devotional/today"],
  });

  const journeyQuery = useQuery<{ success: boolean; data: JourneyEntry[] }>({
    queryKey: ["/api/devotional/journey"],
  });

  const startMutation = useMutation({
    mutationFn: async (devotionalId: number) => {
      await apiRequest("POST", `/api/devotional/${devotionalId}/start`);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ devotionalId, timeSpentSeconds }: { devotionalId: number; timeSpentSeconds: number }) => {
      const res = await apiRequest("POST", `/api/devotional/${devotionalId}/complete`, { timeSpentSeconds });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/devotional/greeting"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devotional/journey"] });
      
      if (data?.data?.newMilestones && data.data.newMilestones.length > 0) {
        setCelebrationMilestone(data.data.newMilestones[0]);
        setShowCelebration(true);
      }
    },
  });

  useEffect(() => {
    if (devotionalQuery.data?.data?.id && !startedRef.current) {
      startedRef.current = true;
      startMutation.mutate(devotionalQuery.data.data.id);
    }
    // Merge server-tracked completions (devotional-prayer) into state
    if (devotionalQuery.data?.completedTaskIds?.length) {
      setCompletedTaskIds(prev => {
        const next = new Set(prev);
        devotionalQuery.data.completedTaskIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [devotionalQuery.data?.data?.id, devotionalQuery.data?.completedTaskIds]);

  const handleComplete = () => {
    if (devotionalQuery.data?.data?.id) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      completeMutation.mutate({
        devotionalId: devotionalQuery.data.data.id,
        timeSpentSeconds: timeSpent,
      });
    }
  };

  const handleTaskComplete = (taskId: string) => {
    setCompletedTaskIds(prev => {
      const next = new Set(prev).add(taskId);
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(`soulguide_tasks_${today}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const greeting = greetingQuery.data?.data;
  const devotional = devotionalQuery.data?.data;
  const userName = user?.name?.split(" ")[0] || "Friend";
  const currentStreak = greeting?.currentStreak || 0;
  const joinedAt = greeting?.joinedAt as string | null ?? null;

  const { data: personaData } = useQuery<{ primaryStruggle?: string }>({
    queryKey: ["/api/persona"],
    enabled: !!user,
  });
  const struggle = personaData?.primaryStruggle
    ? STRUGGLE_DISPLAY[personaData.primaryStruggle] || personaData.primaryStruggle.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : null;

  // Build verse of the day link for Bible navigation using shared utility
  const getVerseOfDayLink = () => {
    if (!devotional?.scriptureReference) return "/bible";
    return buildBibleLink(devotional.scriptureReference);
  };

  const journeyTasks: JourneyTask[] = [
    {
      id: "soul-checkin",
      title: "Soul Check-In",
      subtitle: "A personalized reflection based on your journey",
      icon: "sun",
      duration: "2 MIN",
      isCompleted: completedTaskIds.has("soul-checkin"),
      action: () => {
        handleTaskComplete("soul-checkin");
        setLocation("/chat?mode=checkin");
      },
    },
    {
      id: "gods-message",
      title: "God's Message",
      subtitle: devotional?.scriptureReference || "Today's verse for you",
      icon: "book",
      duration: "1 MIN",
      isCompleted: completedTaskIds.has("gods-message"),
      action: () => {
        handleTaskComplete("gods-message");
        setLocation(getVerseOfDayLink());
      },
    },
    {
      id: "devotional-prayer",
      title: "Daily Devotional & Prayer",
      subtitle: devotional?.title || "Reflection and connection with God",
      icon: "message",
      duration: "5 MIN",
      isCompleted: completedTaskIds.has("devotional-prayer"),
      action: () => {
        handleTaskComplete("devotional-prayer");
        handleComplete();
        setLocation("/devotional");
      },
    },
  ];

  const progressPercent = Math.round((completedTaskIds.size / journeyTasks.length) * 100);

  const completedDays = journeyQuery.data?.data
    ?.filter(e => e.completedAt)
    .map(e => format(new Date(e.completedAt as string), "yyyy-MM-dd")) || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="px-5 py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <Avatar 
              className="w-10 h-10 cursor-pointer" 
              onClick={() => setLocation("/account")}
              data-testid="button-profile-avatar"
            >
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {userName[0]}
              </AvatarFallback>
            </Avatar>
            
            <StreakBadge streak={currentStreak} />

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifications(true)}
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {(notifData?.unreadCount ?? 0) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </div>

          <div className="mt-4">
            <h1 className="font-serif text-3xl font-bold" data-testid="text-greeting">
              Today's Journey
            </h1>
            {struggle && (
              <p className="text-muted-foreground mt-1 capitalize" data-testid="text-greeting-subtext">
                {struggle}
              </p>
            )}
          </div>
          
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <Card className="border-0 shadow-sm" data-testid="card-week-calendar">
            <CardContent className="py-4">
              <WeekCalendar completedDays={completedDays} joinedAt={joinedAt} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">PROGRESS TODAY</span>
          <span className="text-xs font-medium text-muted-foreground">{progressPercent}%</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="w-full h-1.5 bg-muted rounded-full overflow-hidden"
        >
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
        </motion.div>

        <div className="space-y-3">
          {devotionalQuery.isLoading ? (
            <>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </>
          ) : (
            journeyTasks.map((task, index) => (
              <JourneyTaskCard key={task.id} task={task} index={index} />
            ))
          )}
        </div>

        {devotional && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden" data-testid="card-verse-of-day">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Verse of the Day</span>
                </div>
                
                <div className="space-y-3">
                  <p className="font-serif text-lg leading-relaxed italic" data-testid="text-scripture">
                    "{devotional.scriptureText}"
                  </p>
                  <p className="text-sm text-muted-foreground font-medium" data-testid="text-scripture-reference">
                    {devotional.scriptureReference}
                  </p>
                </div>

                <Button 
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => setLocation(getVerseOfDayLink())}
                  data-testid="button-read-in-context"
                >
                  Read in Context
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      <StreakCelebration
        visible={showCelebration}
        milestone={celebrationMilestone}
        onClose={() => setShowCelebration(false)}
      />

      <AnimatePresence>
        {showNotifications && (
          <NotificationDrawer onClose={() => setShowNotifications(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
