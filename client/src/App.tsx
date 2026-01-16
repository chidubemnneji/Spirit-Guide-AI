import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { BibleProvider } from "@/context/BibleContext";
import { AuthProvider } from "@/context/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import Welcome from "@/pages/Welcome";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import TransitionPage from "@/pages/TransitionPage";
import Chat from "@/pages/Chat";
import Bible from "@/pages/Bible";
import Search from "@/pages/Search";
import Devotion from "@/pages/Devotion";
import Account from "@/pages/Account";
import NotFound from "@/pages/not-found";

const ONBOARDING_ROUTES = ["/", "/signup", "/login", "/onboarding", "/transition"];

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/transition" component={TransitionPage} />
      <Route path="/chat" component={Chat} />
      <Route path="/bible" component={Bible} />
      <Route path="/search" component={Search} />
      <Route path="/devotion" component={Devotion} />
      <Route path="/account" component={Account} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const showBottomNav = !ONBOARDING_ROUTES.includes(location);
  
  return (
    <>
      <Router />
      {showBottomNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <BibleProvider>
              <TooltipProvider>
                <Toaster />
                <AppContent />
              </TooltipProvider>
            </BibleProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
