import { useLocation, Link } from "wouter";
import { Home, Cross, BookOpen, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useScroll } from "@/context/ScrollContext";

const navItems = [
  { path: "/devotion", icon: Home, label: "Home" },
  { path: "/chat", icon: Cross, label: "Soul Care" },
  { path: "/bible", icon: BookOpen, label: "Word" },
  { path: "/account", icon: User, label: "Profile" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { hideNav } = useScroll();

  return (
    <AnimatePresence>
      {!hideNav && (
        <motion.nav 
          className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
        >
          <div className="flex items-center justify-around gap-2 h-20 max-w-lg mx-auto px-4 pb-4 pt-2">
            {navItems.map((item) => {
              const isActive = location === item.path || 
                (item.path === "/chat" && location === "/transition") ||
                (item.path === "/devotion" && location === "/community");
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <motion.div
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all min-w-[72px] hover-elevate",
                      isActive && "bg-primary/10"
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon 
                      className={cn(
                        "w-6 h-6 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span 
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
