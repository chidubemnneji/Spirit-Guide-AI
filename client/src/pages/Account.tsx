import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, LogOut, Settings, Bell, Shield, HelpCircle, ChevronRight, Flame } from "lucide-react";

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
  const userName = user?.name || "Guest";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const settingsItems = [
    { icon: Bell, label: "Daily Reminder", value: "8:25 AM", disabled: true },
    { icon: Shield, label: "Privacy Policy", disabled: false },
    { icon: HelpCircle, label: "Help & Support", disabled: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border">
        <div className="flex items-center justify-between px-5 h-14">
          <span className="font-serif text-lg font-semibold" data-testid="text-page-title">Profile</span>
          <Settings className="w-5 h-5 text-muted-foreground" />
        </div>
      </header>

      <main className="px-5 py-6 max-w-lg mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-0 shadow-sm" data-testid="card-profile">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16" data-testid="avatar-user">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-semibold text-lg" data-testid="text-user-name">
                    {userName}
                  </h2>
                  <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                    {user?.email || "guest@soulguide.app"}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1 px-4 py-2 bg-primary/5 rounded-xl">
                  <Flame className="w-5 h-5 text-primary" />
                  <span className="text-lg font-bold text-primary">{currentStreak}</span>
                  <span className="text-[10px] text-muted-foreground">day streak</span>
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
          <Card className="border-0 shadow-sm" data-testid="card-settings">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {settingsItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  disabled={item.disabled}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  data-testid={`button-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.value ? (
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Button
            variant="ghost"
            className="w-full h-14 gap-2 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
