import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, Sun, BookOpen, Clock, ChevronRight, Star, Bookmark, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CircularProgress } from "@/components/CircularProgress";
import { StreakCelebration } from "@/components/devotional/StreakCelebration";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DevotionalGreeting, Devotional } from "@shared/schema";

interface JourneyEntry {
  devotional: Devotional;
  completedAt: Date | string | null;
  rating: number | null;
}

export default function Devotion() {
  const [, setLocation] = useLocation();
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-[9999] border-b border-border/50 glass">
        <div className="flex items-center gap-3 px-4 h-14">
          <Heart className="w-5 h-5 text-primary" />
          <span className="font-serif font-semibold tracking-premium">Daily Devotion</span>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-subtle glow-border overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 gradient-warm opacity-50" />
              <CardContent className="relative pt-6 pb-8">
                {greetingQuery.isLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-40" />
                      <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-20 w-20 rounded-full" />
                  </div>
                ) : greeting ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="font-serif text-2xl font-bold tracking-display" data-testid="text-greeting">
                        {greeting.greeting}
                      </h2>
                      <p className="text-muted-foreground tracking-refined" data-testid="text-greeting-subtext">
                        {greeting.subtext}
                      </p>
                    </div>
                    <CircularProgress
                      value={greeting.currentStreak}
                      maxValue={greeting.streakTarget}
                      size={80}
                      strokeWidth={8}
                      label="day streak"
                      color="primary"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h2 className="font-serif text-2xl font-bold tracking-display">
                      Good Morning
                    </h2>
                    <p className="text-muted-foreground tracking-refined">
                      Let's nurture your spirit today
                    </p>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="glass-subtle glow-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-serif tracking-premium flex items-center gap-2">
                  <Sun className="w-5 h-5 text-[hsl(var(--hopeful))]" />
                  Today's Devotion
                </CardTitle>
                {devotional && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBookmark}
                    className={isBookmarked ? "text-primary" : "text-muted-foreground"}
                    data-testid="button-bookmark"
                  >
                    <Bookmark className={isBookmarked ? "fill-current" : ""} size={20} />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {devotionalQuery.isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : devotionalQuery.isError ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Unable to load today's devotional</p>
                  <Button
                    variant="outline"
                    onClick={() => devotionalQuery.refetch()}
                    data-testid="button-retry"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : devotional ? (
                <>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="font-serif text-lg leading-relaxed italic text-foreground/90" data-testid="text-scripture">
                      "{devotional.scriptureText}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 tracking-refined" data-testid="text-scripture-reference">
                      {devotional.scriptureReference}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-semibold mb-2" data-testid="text-devotional-title">
                      {devotional.title}
                    </h3>
                    {devotional.subtitle && (
                      <p className="text-sm text-muted-foreground mb-3">{devotional.subtitle}</p>
                    )}
                    <p className="text-foreground/90 leading-relaxed">{devotional.openingHook}</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {devotional.reflectionContent.split("\n\n").map((paragraph, i) => (
                      <p key={i} className="text-foreground/90 leading-relaxed tracking-refined">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold tracking-premium text-muted-foreground uppercase">
                      Today's Practice
                    </h4>
                    <p className="text-sm leading-relaxed tracking-refined text-foreground/80">
                      {devotional.todaysPractice}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-accent/10 border border-border/50">
                    <h4 className="text-sm font-semibold tracking-premium text-muted-foreground uppercase mb-2">
                      Closing Prayer
                    </h4>
                    <p className="text-sm leading-relaxed italic text-foreground/80">
                      {devotional.closingPrayer}
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-center gap-1 py-2" data-testid="section-rating">
                    <span className="text-sm text-muted-foreground mr-2">How was this?</span>
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
                          size={18}
                          className={value <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
                        />
                      </Button>
                    ))}
                  </div>

                  <Button 
                    className="w-full gradient-primary shadow-primary"
                    onClick={handleBeginReflection}
                    data-testid="button-start-devotion"
                  >
                    Begin Reflection
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="font-serif text-lg leading-relaxed italic text-foreground/90">
                    "Be still, and know that I am God."
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 tracking-refined">
                    Psalm 46:10
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="glass-subtle glow-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif tracking-premium flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Your Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              {journeyQuery.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : journey.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Your spiritual journey timeline will appear here as you complete devotionals.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-4">
                    {journey.slice(0, 5).map((entry, index) => (
                      <TimelineItem 
                        key={entry.devotional.id} 
                        entry={entry}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {journey.length > 5 && (
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-muted-foreground"
                  data-testid="button-view-all-history"
                >
                  View Full History
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center py-4"
        >
          <p className="text-sm text-muted-foreground tracking-refined">
            Your devotional history helps us personalize your experience.
          </p>
        </motion.div>
      </main>

      <StreakCelebration
        visible={showCelebration}
        milestone={celebrationMilestone}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
}

function TimelineItem({ 
  entry, 
  index 
}: { 
  entry: JourneyEntry;
  index: number;
}) {
  const completedDate = entry.completedAt ? new Date(entry.completedAt) : null;
  const timeLabel = completedDate 
    ? format(completedDate, "MMM d") 
    : "Today";
  
  return (
    <motion.div
      className="relative pl-12"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      data-testid={`timeline-entry-${entry.devotional.id}`}
    >
      <div 
        className={cn(
          "absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center",
          "bg-primary/15 ring-2 ring-primary/20"
        )}
      >
        <BookOpen className="w-5 h-5 text-primary" />
      </div>
      
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tracking-refined">{timeLabel}</span>
          {entry.rating && (
            <div className="flex items-center gap-0.5">
              {[...Array(entry.rating)].map((_, i) => (
                <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          )}
        </div>
        <h4 className="font-semibold text-sm tracking-refined mt-1">{entry.devotional.title}</h4>
        <p className="text-xs text-muted-foreground tracking-refined mt-0.5 flex items-center gap-1">
          <BookOpen size={10} />
          {entry.devotional.scriptureReference}
        </p>
        {entry.devotional.themes && entry.devotional.themes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.devotional.themes.slice(0, 2).map((theme, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                {theme}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
