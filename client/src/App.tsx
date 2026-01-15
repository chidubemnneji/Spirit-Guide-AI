import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { BibleProvider } from "@/context/BibleContext";
import { BottomNav } from "@/components/BottomNav";
import Welcome from "@/pages/Welcome";
import Onboarding from "@/pages/Onboarding";
import TransitionPage from "@/pages/TransitionPage";
import Chat from "@/pages/Chat";
import Bible from "@/pages/Bible";
import Community from "@/pages/Community";
import Devotion from "@/pages/Devotion";
import Account from "@/pages/Account";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/transition" component={TransitionPage} />
      <Route path="/chat" component={Chat} />
      <Route path="/bible" component={Bible} />
      <Route path="/community" component={Community} />
      <Route path="/devotion" component={Devotion} />
      <Route path="/account" component={Account} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <>
      <Router />
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <OnboardingProvider>
          <BibleProvider>
            <TooltipProvider>
              <Toaster />
              <AppContent />
            </TooltipProvider>
          </BibleProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
