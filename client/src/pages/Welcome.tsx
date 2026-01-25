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

      </main>

      <motion.div 
        className="flex items-center justify-center gap-8 px-6 pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center border border-border/50">
            <Sparkles className="w-7 h-7 text-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">Personalized</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center border border-border/50">
            <BookOpen className="w-7 h-7 text-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">Scripture</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center border border-border/50">
            <Cross className="w-7 h-7 text-foreground" />
          </div>
          <span className="text-sm text-muted-foreground">Faith</span>
        </div>
      </motion.div>

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
