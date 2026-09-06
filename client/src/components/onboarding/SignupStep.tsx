import { useState } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { ContinueButton } from "./ContinueButton";
import { BackButton } from "./BackButton";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { isPasswordStrong } from "@/components/PasswordStrengthIndicator";
import { useToast } from "@/hooks/use-toast";

interface SignupStepProps {
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function SignupStep({ onComplete, onBack, isSubmitting }: SignupStepProps) {
  const { updateOnboarding, data } = useOnboarding();
  const { signup, user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(data.userName || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // Already logged in — just submit onboarding data
  if (user) {
    return (
      <div className="space-y-8 pt-4">
        <div>
          <h1 className="font-serif text-[32px] text-[var(--app-dark)] leading-tight mb-3">
            Almost there, {user.name.split(" ")[0]}
          </h1>
          <p className="text-[16px] text-[var(--app-gray-lt)]">Saving your journey...</p>
        </div>
        <ContinueButton onClick={onComplete} disabled={isSubmitting} loading={isSubmitting}>
          Start my journey
        </ContinueButton>
      </div>
    );
  }

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!isPasswordStrong(password)) errs.password = "Password needs uppercase, number and 8+ characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const canSubmit = name.trim() && email.trim() && isPasswordStrong(password) && !isSigningUp && !isSubmitting;

  const handleComplete = async () => {
    if (!validate()) return;
    setIsSigningUp(true);
    updateOnboarding({ userName: name.trim() });
    const result = await signup(name.trim(), email.trim(), password);
    setIsSigningUp(false);
    if (result.success) {
      onComplete();
    } else {
      toast({ variant: "destructive", title: "Couldn't create your account", description: result.error || "Please try again" });
    }
  };

  const firstName = name.split(" ")[0];

  return (
    <div className="pt-4">
      <BackButton onClick={onBack} />

      <h1 className="font-serif text-[32px] text-[var(--app-dark)] leading-tight mb-2">
        {firstName ? `Almost there, ${firstName}` : "One last thing"}
      </h1>
      <p className="text-[16px] text-[var(--app-gray-lt)] mb-8">Create your account to save your journey.</p>

      {/* Form fields — editorial style */}
      <div className="flex flex-col mb-6">
        <div className="px-0 py-4 border-b border-[var(--app-border)]">
          <label className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase block mb-1">Your name</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="First name" autoFocus data-testid="input-name"
            className="w-full font-serif text-[20px] text-[var(--app-dark)] bg-transparent focus:outline-none placeholder:text-[var(--app-placeholder)]"
          />
          {errors.name && <p className="text-[12px] text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div className="px-0 py-4 border-b border-[var(--app-border)]">
          <label className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase block mb-1">Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" data-testid="input-email"
            className="w-full font-serif text-[20px] text-[var(--app-dark)] bg-transparent focus:outline-none placeholder:text-[var(--app-placeholder)]"
          />
          {errors.email && <p className="text-[12px] text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div className="px-0 py-4 border-b border-[var(--app-border)]">
          <label className="text-[10px] font-semibold tracking-[0.1em] text-[var(--app-gray-lt)] uppercase block mb-1">Password</label>
          <div className="flex items-center">
            <input
              type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="8+ chars, uppercase, number" data-testid="input-password"
              className="flex-1 font-serif text-[20px] text-[var(--app-dark)] bg-transparent focus:outline-none placeholder:text-[var(--app-placeholder)]"
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="text-[var(--app-gray-lt)] ml-2">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Strength indicator */}
          {password && (
            <div className="flex gap-1 mt-2">
              {[/[A-Z]/, /[0-9]/, /.{8,}/].map((re, i) => (
                <div key={i} className="h-0.5 flex-1 transition-colors" style={{ background: re.test(password) ? "var(--app-green)" : "var(--app-border)" }} />
              ))}
            </div>
          )}
          {errors.password && <p className="text-[12px] text-red-600 mt-1">{errors.password}</p>}
        </div>
      </div>

      <p className="text-[11px] text-[var(--app-gray-lt)] text-center mb-6 tracking-wide">
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>

      <ContinueButton onClick={handleComplete} disabled={!canSubmit} loading={isSigningUp || isSubmitting}>
        Start my journey
      </ContinueButton>
    </div>
  );
}
