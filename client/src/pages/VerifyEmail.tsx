import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Mail, RefreshCw } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--app-bg)" }}>
      <motion.div
        className="max-w-sm w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Icon */}
        <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6" style={{ background: "var(--app-bg-warm)" }}>
          <Mail className="w-9 h-9" style={{ color: "var(--app-green)" }} />
        </div>

        <h1 className="font-serif text-[26px] text-[var(--app-dark)] mb-3">
          Check your email
        </h1>

        <p className="text-[14px] leading-relaxed mb-2" style={{ color: "var(--app-gray-lt)" }}>
          We sent a confirmation link to
        </p>
        <p className="font-semibold text-[14px] text-[var(--app-dark)] mb-6">
          {user?.email}
        </p>

        <p className="text-[14px] leading-relaxed mb-8" style={{ color: "var(--app-gray-lt)" }}>
          Click the link in the email to confirm your account and begin your journey.
        </p>

        {/* Resend */}
        {!resent ? (
          <button
            className="w-full py-4 mb-3 font-semibold text-[13px] tracking-[0.2em] uppercase disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
            style={{ border: "1px solid var(--app-green)", color: "var(--app-green)" }}
            onClick={handleResend}
            disabled={resending}
            data-testid="button-resend-verification"
          >
            {resending ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />Sending...</>
            ) : (
              "Resend email"
            )}
          </button>
        ) : (
          <p className="text-[13px] mb-3" style={{ color: "var(--app-green)" }}>✓ Email resent — check your inbox</p>
        )}

        <button
          onClick={logout}
          className="text-[13px] transition-colors"
          style={{ color: "var(--app-gray-lt)" }}
          data-testid="button-use-different-account"
        >
          Use a different account
        </button>
      </motion.div>
    </div>
  );
}
