import { useLocation, Link } from "wouter";
import { Home, Cross, BookOpen, User, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useScroll } from "@/context/ScrollContext";
import { useFlags } from "@/hooks/useFlags";

const BASE_NAV = [
  { path: "/devotion", icon: Home, label: "Home" },
  { path: "/chat", icon: Cross, label: "Chat" },
  { path: "/bible", icon: BookOpen, label: "Word" },
];

const COMMUNITY_NAV = { path: "/community", icon: Users, label: "Community" };
const PROFILE_NAV = { path: "/account", icon: User, label: "Profile" };

export function BottomNav() {
  const [location] = useLocation();
  const { hideNav } = useScroll();
  const flags = useFlags();

  // Rebuilds every 30s when useFlags polls — community tab appears/disappears
  // without a page refresh when user toggles beta access in Profile
  const navItems = flags["community-section"]
    ? [...BASE_NAV, COMMUNITY_NAV, PROFILE_NAV]
    : [...BASE_NAV, PROFILE_NAV];

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
          <div className="flex items-center justify-around gap-2 h-16 max-w-lg mx-auto px-4 pb-2 pt-1">
            <AnimatePresence mode="popLayout">
              {navItems.map((item) => {
                const isActive =
                  location === item.path ||
                  (item.path === "/chat" && location === "/transition");
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={item.path}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      <motion.div
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-2xl transition-all min-w-[64px] hover-elevate",
                          isActive && "bg-primary/10"
                        )}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span
                          className={cn(
                            "text-[11px] font-medium transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
