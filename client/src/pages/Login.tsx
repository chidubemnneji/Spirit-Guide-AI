import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      setLocation(data?.user?.hasCompletedOnboarding ? "/devotion" : "/onboarding");
    } else {
      toast({ variant: "destructive", title: "Login failed", description: result.error || "Invalid email or password" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--app-bg)" }}>
      {/* Header */}
      <header className="flex bg-[var(--app-white)] border-b border-[var(--app-border)]">
        <button onClick={() => setLocation("/")} className="py-6 px-6 flex items-center border-r border-[var(--app-border)]" data-testid="button-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 py-6 px-6 flex items-center justify-center">
          <h1 className="font-serif text-[22px] leading-none text-[var(--app-dark)] tracking-wide">Welcome back</h1>
        </div>
        <div className="py-6 px-6 flex items-center border-l border-[var(--app-border)]">
          <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[var(--app-gray-lt)]">Vol. 01 — Auth</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Section */}
          <div className="section-band"><span>Identification</span></div>

          <div className="px-6 py-5 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
            <label className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase block mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" data-testid="input-email"
              className="w-full font-serif text-[18px] text-[var(--app-dark)] bg-transparent focus:outline-none"
            />
            {errors.email && <p className="text-[12px] text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div className="px-6 py-5 bg-[var(--app-white)] border-b border-[var(--app-border-soft)]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase">Password</label>
              <button type="button" onClick={() => toast({ title: "Password reset", description: "Password reset is coming soon. For now, contact support to reset your password." })} className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[var(--app-green)]" data-testid="link-forgot-password">
                Forgot?
              </button>
            </div>
            <div className="flex items-center">
              <input
                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" data-testid="input-password"
                className="flex-1 font-serif text-[18px] text-[var(--app-dark)] bg-transparent focus:outline-none"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} data-testid="button-toggle-password">
                {showPassword ? <EyeOff size={18} className="text-[var(--app-gray-lt)]" /> : <Eye size={18} className="text-[var(--app-gray-lt)]" />}
              </button>
            </div>
            {errors.password && <p className="text-[12px] text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div className="p-6 bg-[var(--app-white)] border-t border-[var(--app-border)] mt-4 space-y-3">
            <button
              type="submit" disabled={isLoading} data-testid="button-login"
              className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "var(--cta-bg)", color: "var(--cta-fg)" }}
            >
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : "Sign in"}
            </button>
            <p className="text-[12px] text-[var(--app-gray-lt)] text-center">
              No account?{" "}
              <button type="button" className="font-semibold text-[var(--app-green)]" onClick={() => setLocation("/signup")} data-testid="link-signup">
                Create one
              </button>
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
