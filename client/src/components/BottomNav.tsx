import { useLocation, Link } from "wouter";
import { Users, Heart, MessageCircle, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/community", icon: Users, label: "Community" },
  { path: "/devotion", icon: Heart, label: "Devotion" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/bible", icon: BookOpen, label: "Bible" },
  { path: "/account", icon: User, label: "Account" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path === "/chat" && location === "/transition");
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
