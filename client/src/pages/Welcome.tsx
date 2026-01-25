import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Cross } from "lucide-react";

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
