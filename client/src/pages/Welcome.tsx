import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Cross, Sparkles, BookOpen } from "lucide-react";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Cross className="w-8 h-8 text-foreground" />
        </motion.div>
      </header>

      <main className="flex-1 flex flex-col px-6 pt-8">
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            Your Faith,<br />Always Visible
          </h1>
          
          <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
            Join millions finding clarity and purpose through personalized Biblical wisdom.
          </p>
        </motion.div>

        <motion.div 
          className="flex items-center gap-6 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center border border-border/50">
              <Sparkles className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Personalized</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center border border-border/50">
              <BookOpen className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Scripture</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center border border-border/50">
              <Cross className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Faith</span>
          </div>
        </motion.div>
      </main>

      <footer className="p-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            onClick={() => setLocation("/signup")}
            data-testid="button-begin-transformation"
            className="w-full text-base font-semibold rounded-full bg-foreground text-background"
          >
            Begin Your Transformation
          </Button>
        </motion.div>
      </footer>
    </div>
  );
}
