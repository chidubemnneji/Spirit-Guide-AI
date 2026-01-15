import { motion } from "framer-motion";
import { Heart, Sun, Moon, Star, BookOpen, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/CircularProgress";
import { cn } from "@/lib/utils";

const timelineItems = [
  {
    id: 1,
    time: "Today",
    title: "Morning Reflection",
    description: "Start your day with gratitude",
    icon: Sun,
    color: "text-[hsl(var(--hopeful))]",
    bgColor: "bg-[hsl(var(--hopeful)/0.15)]",
    completed: false,
  },
  {
    id: 2,
    time: "Yesterday",
    title: "Evening Prayer",
    description: "Found peace in Psalm 23",
    icon: Moon,
    color: "text-[hsl(var(--peaceful))]",
    bgColor: "bg-[hsl(var(--peaceful)/0.15)]",
    completed: true,
  },
  {
    id: 3,
    time: "2 days ago",
    title: "Scripture Study",
    description: "Explored the Beatitudes",
    icon: BookOpen,
    color: "text-primary",
    bgColor: "bg-primary/15",
    completed: true,
  },
  {
    id: 4,
    time: "3 days ago",
    title: "Quiet Moment",
    description: "5 minutes of silence",
    icon: Star,
    color: "text-[hsl(var(--sage))]",
    bgColor: "bg-[hsl(var(--sage)/0.15)]",
    completed: true,
  },
];

export default function Devotion() {
  const weeklyGoal = 7;
  const weeklyProgress = 4;

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
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="font-serif text-2xl font-bold tracking-display">
                      Good Morning
                    </h2>
                    <p className="text-muted-foreground tracking-refined">
                      Let's nurture your spirit today
                    </p>
                  </div>
                  <CircularProgress
                    value={weeklyProgress}
                    maxValue={weeklyGoal}
                    size={80}
                    strokeWidth={8}
                    label="this week"
                    color="primary"
                  />
                </div>
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
              <CardTitle className="text-lg font-serif tracking-premium flex items-center gap-2">
                <Sun className="w-5 h-5 text-[hsl(var(--hopeful))]" />
                Today's Devotion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="font-serif text-lg leading-relaxed italic text-foreground/90">
                  "Be still, and know that I am God."
                </p>
                <p className="text-sm text-muted-foreground mt-2 tracking-refined">
                  Psalm 46:10
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold tracking-premium text-muted-foreground uppercase">
                  Today's Practice
                </h4>
                <p className="text-sm leading-relaxed tracking-refined text-foreground/80">
                  Take 5 minutes today to sit in stillness. Notice your breath, release your worries to God, and simply be present in His peace.
                </p>
              </div>

              <Button 
                className="w-full gradient-primary shadow-primary"
                data-testid="button-start-devotion"
              >
                Begin Reflection
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
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
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                
                <div className="space-y-4">
                  {timelineItems.map((item, index) => (
                    <TimelineItem 
                      key={item.id} 
                      item={item} 
                      index={index}
                    />
                  ))}
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-muted-foreground"
                data-testid="button-view-all-history"
              >
                View Full History
              </Button>
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
    </div>
  );
}

function TimelineItem({ 
  item, 
  index 
}: { 
  item: typeof timelineItems[0]; 
  index: number;
}) {
  const Icon = item.icon;
  
  return (
    <motion.div
      className="relative pl-12"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
    >
      <div 
        className={cn(
          "absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center",
          item.bgColor,
          item.completed && "ring-2 ring-primary/20"
        )}
      >
        <Icon className={cn("w-5 h-5", item.color)} />
      </div>
      
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tracking-refined">{item.time}</span>
          {item.completed && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Completed
            </span>
          )}
        </div>
        <h4 className="font-semibold text-sm tracking-refined mt-1">{item.title}</h4>
        <p className="text-xs text-muted-foreground tracking-refined mt-0.5">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}
