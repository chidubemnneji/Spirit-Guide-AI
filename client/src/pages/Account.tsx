import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/CircularProgress";
import { User, Mail, LogOut, Settings, Flame, MessageCircle, BookOpen, Calendar } from "lucide-react";

interface UserStats {
  conversationCount: number;
  messageCount: number;
  practicesCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

export default function Account() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 7;
  const streakGoal = Math.max(longestStreak, 7);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-[9999] border-b border-border/50 glass">
        <div className="flex items-center gap-3 px-4 h-14">
          <User className="w-5 h-5 text-primary" />
          <span className="font-serif font-semibold tracking-premium" data-testid="text-page-title">Account</span>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-subtle glow-border overflow-hidden" data-testid="card-profile">
            <div className="h-20 gradient-primary opacity-80" />
            <CardContent className="relative -mt-12 pb-6">
              <div className="flex flex-col items-center text-center">
                <motion.div 
                  className="w-20 h-20 rounded-full bg-card border-4 border-background flex items-center justify-center shadow-elevated"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  data-testid="avatar-user"
                >
                  <User className="w-10 h-10 text-primary" />
                </motion.div>
                <h3 className="font-serif font-bold text-xl mt-4 tracking-display" data-testid="text-user-name">
                  {user?.name || "Guest"}
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="tracking-refined" data-testid="text-user-email">{user?.email || "Not logged in"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="glass-subtle glow-border" data-testid="card-streak">
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg font-serif tracking-premium flex items-center gap-2">
                <Flame className="w-5 h-5 text-[hsl(var(--hopeful))]" />
                Your Streak
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-4">
              <CircularProgress
                value={currentStreak}
                maxValue={streakGoal}
                size={140}
                strokeWidth={14}
                label="day streak"
                sublabel={`Goal: ${streakGoal} days`}
                color="hopeful"
              />
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="tracking-refined">Longest: {longestStreak} days</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span className="tracking-refined">Keep going!</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="glass-subtle glow-border" data-testid="card-stats">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif tracking-premium">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <StatItem 
                  icon={MessageCircle}
                  value={stats?.conversationCount ?? 0}
                  label="Chats"
                  color="text-primary"
                />
                <StatItem 
                  icon={BookOpen}
                  value={stats?.practicesCompleted ?? 0}
                  label="Practices"
                  color="text-[hsl(var(--sage))]"
                />
                <StatItem 
                  icon={Calendar}
                  value={stats?.messageCount ?? 0}
                  label="Messages"
                  color="text-[hsl(var(--peaceful))]"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="glass-subtle glow-border" data-testid="card-settings">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-serif tracking-premium">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
                disabled
                data-testid="button-preferences"
              >
                <Settings className="w-5 h-5" />
                <span className="tracking-refined">Preferences</span>
                <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="glass-subtle" data-testid="card-logout">
            <CardContent className="pt-6">
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

function StatItem({ 
  icon: Icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  value: number; 
  label: string; 
  color: string;
}) {
  return (
    <motion.div 
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <div className={`w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-subtle`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <span className="text-2xl font-bold tracking-display">{value}</span>
      <span className="text-xs text-muted-foreground tracking-refined">{label}</span>
    </motion.div>
  );
}
