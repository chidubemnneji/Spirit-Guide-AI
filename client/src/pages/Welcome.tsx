import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/OnboardingContext";
import { BookOpen, Sparkles, MessageCircle } from "lucide-react";

const features = [
  { icon: MessageCircle, label: "AI companion", sub: "Listens without judgment" },
  { icon: BookOpen, label: "Scripture", sub: "Matched to your moment" },
  { icon: Sparkles, label: "Personalised", sub: "Grows with you over time" },
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setPhase, resetOnboarding } = useOnboarding();

  const handleBegin = () => {
    resetOnboarding();
    setPhase(1);
    setLocation("/onboarding");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col justify-between px-6 pt-16 pb-10">
        <motion.div
          className="space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            A companion<br />for your faith.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xs">
            Wherever you are on your journey — doubting, searching, or simply tired — you don't have to walk it alone.
          </p>
        </motion.div>

        <motion.div
          className="space-y-3 my-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            size="lg"
            onClick={handleBegin}
            data-testid="button-begin-transformation"
            className="w-full text-base font-semibold rounded-2xl bg-foreground text-background h-14"
          >
            Get started
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => setLocation("/login")}
            className="w-full text-base rounded-2xl h-12 text-muted-foreground"
          >
            I already have an account
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
