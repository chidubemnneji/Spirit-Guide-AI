import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST", credentials: "include" });
      if (res.ok) {
        setResent(true);
        toast({ title: "Email sent", description: "Check your inbox." });
      }
    } catch {
      toast({ variant: "destructive", title: "Couldn't resend", description: "Please try again." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        className="max-w-sm w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-9 h-9 text-primary" />
        </div>

        <h1 className="font-serif text-2xl font-bold text-foreground mb-3">
          Check your email
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed mb-2">
          We sent a confirmation link to
        </p>
        <p className="font-medium text-foreground text-sm mb-6">
          {user?.email}
        </p>

        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Click the link in the email to confirm your account and begin your journey.
        </p>

        {/* Resend */}
        {!resent ? (
          <Button
            variant="outline"
            className="w-full rounded-xl mb-3"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Sending...</>
            ) : (
              "Resend email"
            )}
          </Button>
        ) : (
          <p className="text-sm text-primary mb-3">✓ Email resent — check your inbox</p>
        )}

        <button
          onClick={logout}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Use a different account
        </button>
      </motion.div>
    </div>
  );
}
