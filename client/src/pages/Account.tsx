import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, LogOut, Settings } from "lucide-react";

export default function Account() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-[9999] border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 h-14">
          <User className="w-5 h-5 text-primary" />
          <span className="font-serif font-semibold" data-testid="text-page-title">Account</span>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Profile Card */}
        <Card data-testid="card-profile">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center" data-testid="avatar-user">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg" data-testid="text-user-name">
                  {user?.name || "Guest"}
                </h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Mail className="w-4 h-4" />
                  <span data-testid="text-user-email">{user?.email || "Not logged in"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card data-testid="card-settings">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              disabled
              data-testid="button-preferences"
            >
              <Settings className="w-5 h-5" />
              <span>Preferences</span>
              <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card data-testid="card-logout">
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
      </main>
    </div>
  );
}
