import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Heart, Sun, BookOpen, ChevronRight, Star, Bookmark, RefreshCw, Compass, PenLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StreakCelebration } from "@/components/devotional/StreakCelebration";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DevotionalGreeting, Devotional } from "@shared/schema";

interface JourneyEntry {
  devotional: Devotional;
  completedAt: Date | string | null;
  rating: number | null;
}

function getGreetingByTime(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

function CalendarStrip() {
  const today = new Date();
  const days = [];
  
  for (let i = -2; i <= 2; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      day: format(date, "EEE"),
      date: date.getDate(),
      isToday: i === 0,
    });
  }
  
  return (
    <div className="flex items-center justify-between gap-2">
      {days.map((d, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={cn(
            "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors",
            d.isToday ? "bg-foreground text-background" : "text-muted-foreground"
          )}
        >
          <span className="text-xs font-medium">{d.day}</span>
          <span className={cn("text-lg font-bold", d.isToday && "text-background")}>{d.date}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default function Devotion() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [rating, setRating] = useState(0);
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

  const bookmarkMutation = useMutation({
    mutationFn: async (devotionalId: number) => {
      const res = await apiRequest("POST", `/api/devotional/${devotionalId}/bookmark`);
      return res.json();
    },
    onSuccess: (data: any) => {
      setIsBookmarked(data?.data?.isBookmarked || false);
    },
  });

  const rateMutation = useMutation({
    mutationFn: async ({ devotionalId, rating }: { devotionalId: number; rating: number }) => {
      const res = await apiRequest("POST", `/api/devotional/${devotionalId}/rate`, { rating });
      return res.json();
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

  const handleBookmark = () => {
    if (devotionalQuery.data?.data?.id) {
      bookmarkMutation.mutate(devotionalQuery.data.data.id);
    }
  };

  const handleRate = (value: number) => {
    setRating(value);
    if (devotionalQuery.data?.data?.id) {
      rateMutation.mutate({
        devotionalId: devotionalQuery.data.data.id,
        rating: value,
      });
    }
  };

  const handleBeginReflection = () => {
    handleComplete();
    setLocation("/chat");
  };

  const greeting = greetingQuery.data?.data;
  const devotional = devotionalQuery.data?.data;
  const journey = journeyQuery.data?.data || [];
  const userName = user?.name?.split(" ")[0] || "Friend";

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="px-5 py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="font-serif text-2xl font-bold" data-testid="text-greeting">
              Hi, {userName}
            </h1>
            <p className="text-muted-foreground" data-testid="text-greeting-subtext">
              How are you feeling today?
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <CalendarStrip />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm overflow-hidden gradient-amber-soft" data-testid="card-daily-affirmation">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold">Daily Affirmations</h3>
                  {devotionalQuery.isLoading ? (
                    <Skeleton className="h-4 w-48" />
                  ) : (
                    <p className="text-sm text-foreground/80">
                      {devotional?.openingHook || "Begin with mindful morning reflections."}
                    </p>
                  )}
                  {greeting && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {greeting.currentStreak} day streak
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-background/50 flex items-center justify-center">
                  <Sun className="w-7 h-7 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {devotional && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-0 shadow-sm" data-testid="card-devotional">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{format(new Date(), "MMMM d, yyyy")}</p>
                    <h3 className="font-serif text-lg font-bold" data-testid="text-devotional-title">
                      {devotional.title}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBookmark}
                    className={isBookmarked ? "text-primary" : "text-muted-foreground"}
                    data-testid="button-bookmark"
                  >
                    <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="font-serif text-base leading-relaxed italic" data-testid="text-scripture">
                    "{devotional.scriptureText}"
                  </p>
                  <p className="text-sm text-muted-foreground mt-2" data-testid="text-scripture-reference">
                    {devotional.scriptureReference}
                  </p>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed">
                  {devotional.reflectionContent.split("\n\n")[0]}
                </p>

                <Button 
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
                  onClick={handleBeginReflection}
                  data-testid="button-start-devotion"
                >
                  Begin Reflection
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="flex items-center justify-center gap-1 pt-2" data-testid="section-rating">
                  <span className="text-xs text-muted-foreground mr-2">How was this?</span>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRate(value)}
                      className="h-8 w-8"
                      data-testid={`button-rate-${value}`}
                    >
                      <Star
                        size={16}
                        className={value <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50"}
                      />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Quick Journal</h2>
            <Button variant="ghost" className="text-sm text-primary p-0 h-auto hover:bg-transparent">
              See all
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-sm hover-elevate cursor-pointer" data-testid="card-quick-journal-reflect">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <PenLine className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <h4 className="font-medium text-sm">Pause & reflect</h4>
                <p className="text-xs text-muted-foreground mt-1">What are you grateful for?</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full">Today</span>
                  <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">Personal</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover-elevate cursor-pointer" data-testid="card-quick-journal-intentions">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Compass className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <h4 className="font-medium text-sm">Set Intentions</h4>
                <p className="text-xs text-muted-foreground mt-1">How do you want to feel?</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full">Today</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {journey.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Recent Entries</h2>
              <Button 
                variant="ghost" 
                className="text-sm text-primary p-0 h-auto hover:bg-transparent"
                onClick={() => setLocation("/bible")}
              >
                View all
              </Button>
            </div>
            <Card className="border-0 shadow-sm" data-testid="card-recent-entries">
              <CardContent className="pt-4 pb-4 space-y-3">
                {journey.slice(0, 3).map((entry) => (
                  <div 
                    key={entry.devotional.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`entry-${entry.devotional.id}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{entry.devotional.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {entry.completedAt ? format(new Date(entry.completedAt), "MMM d, h:mm a") : "Today"}
                      </p>
                    </div>
                    {entry.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{entry.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
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
