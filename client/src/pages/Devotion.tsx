import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Heart, Sun, BookOpen, ChevronRight, ChevronDown, Check, Bookmark, Flame, Book, MessageCircle, PenLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakCelebration } from "@/components/devotional/StreakCelebration";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isToday, isSameDay } from "date-fns";
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
  action: () => void;
}

function getGreetingByTime(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

function WeekCalendar({ completedDays }: { completedDays: string[] }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const dayKey = format(date, "yyyy-MM-dd");
    const isComplete = completedDays.includes(dayKey);
    const isTodayDate = isToday(date);
    
    days.push({
      dayLetter: format(date, "EEEEE"),
      date: date.getDate(),
      isTodayDate,
      isComplete,
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
          <span className="text-xs text-muted-foreground font-medium">{d.dayLetter}</span>
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
              d.isTodayDate && !d.isComplete && "bg-primary text-primary-foreground",
              d.isComplete && "bg-primary/20 text-primary",
              !d.isTodayDate && !d.isComplete && "text-muted-foreground"
            )}
          >
            {d.isComplete ? (
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const IconComponent = {
    sun: Sun,
    book: Book,
    message: MessageCircle,
    pen: PenLine,
  }[task.icon];
  
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
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 flex items-center gap-4 text-left"
            data-testid={`button-toggle-task-${task.id}`}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              task.isCompleted ? "bg-primary/10" : "bg-primary/10"
            )}>
              {task.isCompleted ? (
                <Check className="w-6 h-6 text-primary" />
              ) : (
                <IconComponent className="w-6 h-6 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-base",
                task.isCompleted && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{task.subtitle}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{task.duration}</span>
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )} />
            </div>
          </button>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t pt-4">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        task.action();
                      }}
                      className="w-full rounded-xl"
                      disabled={task.isCompleted}
                      data-testid={`button-start-task-${task.id}`}
                    >
                      {task.isCompleted ? "Completed" : "Begin"}
                      {!task.isCompleted && <ChevronRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

  const greetingQuery = useQuery<{ success: boolean; data: DevotionalGreeting }>({
    queryKey: ["/api/devotional/greeting"],
  });

  const devotionalQuery = useQuery<{ success: boolean; data: Devotional }>({
    queryKey: ["/api/devotional/today"],
  });

  const journeyQuery = useQuery<{ success: boolean; data: JourneyEntry[] }>({
    queryKey: ["/api/devotional/journey"],
  });

  const startMutation = useMutation({
    mutationFn: async (devotionalId: number) => {
      const res = await apiRequest("POST", `/api/devotional/${devotionalId}/start`);
      return res.json();
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
    if (devotionalQuery.data?.data?.id) {
      startMutation.mutate(devotionalQuery.data.data.id);
    }
  }, [devotionalQuery.data?.data?.id]);

  const handleComplete = () => {
    if (devotionalQuery.data?.data?.id) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      completeMutation.mutate({
        devotionalId: devotionalQuery.data.data.id,
        timeSpentSeconds: timeSpent,
      });
    }
  };

  const greeting = greetingQuery.data?.data;
  const devotional = devotionalQuery.data?.data;
  const userName = user?.name?.split(" ")[0] || "Friend";
  const currentStreak = greeting?.currentStreak || 0;

  const journeyTasks: JourneyTask[] = [
    {
      id: "devotional",
      title: "Daily Devotional",
      subtitle: devotional?.title || "Today's spiritual reading",
      icon: "sun",
      duration: "5 min",
      isCompleted: false,
      action: () => {
        handleComplete();
        setLocation("/chat");
      },
    },
    {
      id: "bible",
      title: "Scripture Reading",
      subtitle: devotional?.scriptureReference || "Explore God's Word",
      icon: "book",
      duration: "10 min",
      isCompleted: false,
      action: () => setLocation("/bible"),
    },
    {
      id: "reflect",
      title: "Reflect & Journal",
      subtitle: "Share what's on your heart",
      icon: "message",
      duration: "5 min",
      isCompleted: false,
      action: () => setLocation("/chat"),
    },
  ];

  const completedDays = journeyQuery.data?.data
    ?.filter(e => e.completedAt)
    .map(e => format(new Date(e.completedAt as string), "yyyy-MM-dd")) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="px-5 py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold" data-testid="text-greeting">
                {getGreetingByTime()}, {userName}
              </h1>
              <p className="text-muted-foreground mt-1" data-testid="text-greeting-subtext">
                {format(new Date(), "EEEE, MMMM d")}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-muted"
              data-testid="button-profile"
              onClick={() => setLocation("/account")}
            >
              <span className="text-sm font-semibold">{userName[0]}</span>
            </Button>
          </div>
          
          <StreakBadge streak={currentStreak} className="mt-3" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <Card className="border-0 shadow-sm" data-testid="card-week-calendar">
            <CardContent className="py-4">
              <WeekCalendar completedDays={completedDays} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-1"
        >
          <h2 className="font-serif text-xl font-semibold">Today's Journey</h2>
          <p className="text-sm text-muted-foreground">Your spiritual practices for today</p>
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
                  onClick={() => setLocation("/bible")}
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
    </div>
  );
}
