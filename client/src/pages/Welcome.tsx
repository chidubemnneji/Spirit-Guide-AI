import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/OnboardingContext";
import { BookOpen, Sparkles, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

const features = [
  { icon: MessageCircle, label: "AI companion", sub: "Listens without judgment" },
  { icon: BookOpen, label: "Scripture", sub: "Matched to your moment" },
  { icon: Sparkles, label: "Personalised", sub: "Grows with you over time" },
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { setPhase, resetOnboarding } = useOnboarding();

  const handleBegin = () => {
    resetOnboarding();
    setPhase(1);
    setLocation("/onboarding");
  };

  const handleGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col px-6 pt-16 pb-10 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Logo size={44} showWordmark />
        </motion.div>

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
            Wherever you are on your journey, doubting, searching, or simply tired, you don't have to walk it alone.
          </p>
        </motion.div>

        <motion.div
          className="space-y-3 mt-6"
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
          className="space-y-3 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {/* Google Sign In */}
          <Button
            size="lg"
            variant="outline"
            onClick={handleGoogle}
            className="w-full text-base rounded-2xl h-14 border-border flex items-center gap-3 font-medium"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            size="lg"
            onClick={handleBegin}
            data-testid="button-begin-transformation"
            className="w-full text-base font-semibold rounded-2xl bg-foreground text-background h-14"
          >
            Get started with email
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
