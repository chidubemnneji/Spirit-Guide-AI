import { useState } from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { ContinueButton } from "./ContinueButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { PasswordStrengthIndicator, isPasswordStrong } from "@/components/PasswordStrengthIndicator";
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

  // Already logged in (came via /signup page) — skip form, just submit onboarding
  if (user) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            Almost there, {user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Saving your journey...
          </p>
        </motion.div>
        <ContinueButton
          onClick={onComplete}
          disabled={isSubmitting}
          loading={isSubmitting}
          variant="complete"
        >
          Start my journey
        </ContinueButton>
      </motion.div>
    );
  }

  const [name, setName] = useState(data.userName || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!isPasswordStrong(password)) errs.password = "Password doesn't meet requirements";
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
      toast({
        variant: "destructive",
        title: "Couldn't create your account",
        description: result.error || "Please try again",
      });
    }
  };

  const firstName = name.split(" ")[0];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          {firstName ? `Almost there, ${firstName}` : "One last thing"}
        </h1>
        <p className="text-muted-foreground">
          Create your account to save your journey
        </p>
      </motion.div>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            type="text"
            placeholder="First name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl border-2"
            data-testid="input-name"
            autoFocus
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border-2"
            data-testid="input-email"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-2 pr-11"
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword
                ? <EyeOff className="w-5 h-5" />
                : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {password && <PasswordStrengthIndicator password={password} />}
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>
      </motion.div>

      <p className="text-xs text-muted-foreground text-center">
        By continuing you agree to our Terms of Service and Privacy Policy
      </p>

      <ContinueButton
        onClick={handleComplete}
        disabled={!canSubmit}
        loading={isSigningUp || isSubmitting}
        variant="complete"
      >
        Start my journey
      </ContinueButton>
    </motion.div>
  );
}
