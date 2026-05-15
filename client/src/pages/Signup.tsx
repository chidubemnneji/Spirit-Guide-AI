import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isPasswordStrong } from "@/components/PasswordStrengthIndicator";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { signup } = useAuth();
  const { setPhase, resetOnboarding } = useOnboarding();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (!isPasswordStrong(password)) e.password = "Password needs uppercase, number and 8+ characters";
    if (password !== confirmPassword) e.confirm = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSubmit = name.trim() && email.trim() && isPasswordStrong(password) && password === confirmPassword;

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const result = await signup(name, email, password);
    setIsLoading(false);
    if (result.success) { resetOnboarding(); setPhase(1); setLocation("/onboarding"); }
    else toast({ variant: "destructive", title: "Signup failed", description: result.error || "Please try again" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#EBEAE5" }}>
      <header className="flex bg-white border-b border-[#D8D7D2]">
        <button onClick={() => setLocation("/")} className="py-6 px-6 flex items-center border-r border-[#D8D7D2]" data-testid="button-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 py-6 px-6 flex items-center justify-center">
          <h1 className="font-serif text-[22px] leading-none text-black tracking-wide">Create account</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="section-band"><span>Your Details</span></div>

          {[
            { label: "Your name", value: name, onChange: setName, type: "text", placeholder: "How should we call you?", testId: "input-name", error: errors.name },
            { label: "Email", value: email, onChange: setEmail, type: "email", placeholder: "your@email.com", testId: "input-email", error: errors.email },
          ].map(field => (
            <div key={field.label} className="px-6 py-5 bg-white border-b border-[#f0f0ee]">
              <label className="text-[10px] font-semibold tracking-[0.1em] text-[#73726C] uppercase block mb-1">{field.label}</label>
              <input
                type={field.type} value={field.value} onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder} data-testid={field.testId}
                className="w-full font-serif text-[18px] text-black bg-transparent focus:outline-none"
              />
              {field.error && <p className="text-[12px] text-red-600 mt-1">{field.error}</p>}
            </div>
          ))}

          <div className="px-6 py-5 bg-white border-b border-[#f0f0ee]">
            <label className="text-[10px] font-semibold tracking-[0.1em] text-[#73726C] uppercase block mb-1">Password</label>
            <div className="flex items-center">
              <input
                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="8+ chars, uppercase, number" data-testid="input-password"
                className="flex-1 font-serif text-[18px] text-black bg-transparent focus:outline-none"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} data-testid="button-toggle-password">
                {showPassword ? <EyeOff size={18} className="text-[#73726C]" /> : <Eye size={18} className="text-[#73726C]" />}
              </button>
            </div>
            {/* Strength dots */}
            {password && (
              <div className="flex gap-1 mt-2">
                {[/[A-Z]/, /[0-9]/, /.{8,}/].map((re, i) => (
                  <div key={i} className="h-1 flex-1 transition-colors" style={{ background: re.test(password) ? "#1b291d" : "#D8D7D2" }} />
                ))}
              </div>
            )}
            {errors.password && <p className="text-[12px] text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div className="px-6 py-5 bg-white border-b border-[#f0f0ee]">
            <label className="text-[10px] font-semibold tracking-[0.1em] text-[#73726C] uppercase block mb-1">Confirm password</label>
            <input
              type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password" data-testid="input-confirm-password"
              className="w-full font-serif text-[18px] text-black bg-transparent focus:outline-none"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[12px] text-red-600 mt-1" data-testid="text-password-mismatch">Passwords don't match</p>
            )}
            {confirmPassword && password === confirmPassword && password && (
              <p className="text-[12px] text-[#1b291d] mt-1" data-testid="text-password-match">Passwords match</p>
            )}
          </div>

          <div className="p-6 bg-white border-t border-[#D8D7D2] mt-4 space-y-3">
            <button
              type="submit" disabled={isLoading || !canSubmit} data-testid="button-signup"
              className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "#1b291d", color: "#fff" }}
            >
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : "Create Account"}
            </button>
            <p className="text-[12px] text-[#73726C] text-center">
              Already have an account?{" "}
              <button type="button" className="font-semibold text-[#1b291d]" onClick={() => setLocation("/login")} data-testid="link-login">Sign in</button>
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
