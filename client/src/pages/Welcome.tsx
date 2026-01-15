import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "wouter";
import { Sparkles, Heart, MessageCircle } from "lucide-react";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/30">
      <header className="flex justify-end p-4">
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Personalized Spiritual Guidance
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-tight">
              Your Journey to <br />
              <span className="text-primary">Deeper Faith</span> Starts Here
            </h1>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            Meet your spiritual companion — an AI guide that understands where you are and helps you grow in faith, one conversation at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={() => setLocation("/onboarding")}
              data-testid="button-begin-journey"
              className="px-8 py-6 text-base font-semibold"
            >
              Begin Your Journey
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-12 max-w-lg mx-auto">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Personalized</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Conversational</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Compassionate</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>A safe space for your spiritual questions and growth</p>
      </footer>
    </div>
  );
}
