import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Heart, Sparkles, BookOpen } from "lucide-react";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col gradient-onboarding">
      <header className="flex justify-end p-4">
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <motion.div 
          className="max-w-md mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="w-24 h-24 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Heart className="w-12 h-12 text-primary" />
          </motion.div>

          <div className="space-y-4">
            <motion.h1 
              className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Find peace in<br />your journey
            </motion.h1>
            
            <motion.p 
              className="text-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Your personal spiritual companion that understands where you are and guides you with wisdom and compassion.
            </motion.p>
          </div>

          <motion.div 
            className="space-y-3 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              size="lg"
              onClick={() => setLocation("/signup")}
              data-testid="button-get-started"
              className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setLocation("/login")}
              data-testid="button-sign-in"
              className="w-full h-14 text-base font-medium rounded-2xl"
            >
              Already have an account? Sign in
            </Button>
          </motion.div>

          <motion.div 
            className="flex items-center justify-center gap-8 pt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Personalized</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Scripture-based</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shadow-sm">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Compassionate</span>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>A safe space for your spiritual questions</p>
      </footer>
    </div>
  );
}
