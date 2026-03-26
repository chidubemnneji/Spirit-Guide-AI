import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

// Routes that are always public — no auth needed
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/onboarding", "/transition", "/meet-prayer-partner", "/bible"];

// Routes that need auth but NOT a completed profile (mid-onboarding)
const AUTH_ONLY_ROUTES = ["/onboarding"];

export function useAuthGuard() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_ROUTES.some(r => location === r || location.startsWith(r + "?"));

    if (isPublic) return;

    // Not logged in at all — send to welcome
    if (!user) {
      setLocation("/");
      return;
    }

    // Logged in but hasn't completed onboarding — send to onboarding
    if (!user.hasCompletedOnboarding && !AUTH_ONLY_ROUTES.includes(location)) {
      setLocation("/onboarding");
      return;
    }
  }, [user, isLoading, location, setLocation]);

  return { user, isLoading, isAuthenticated: !!user };
}
