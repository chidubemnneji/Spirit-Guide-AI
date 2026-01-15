import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: PasswordRequirement[];
}

export function getPasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const score = (metCount / requirements.length) * 100;

  let label: string;
  let color: string;

  if (score === 0) {
    label = "";
    color = "bg-muted";
  } else if (score <= 25) {
    label = "Too Weak";
    color = "bg-red-500";
  } else if (score <= 50) {
    label = "Weak";
    color = "bg-orange-500";
  } else if (score <= 75) {
    label = "Fair";
    color = "bg-yellow-500";
  } else {
    label = "Strong";
    color = "bg-green-500";
  }

  return { score, label, color, requirements };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)} data-testid="password-strength-indicator">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <AnimatePresence mode="wait">
            {strength.label && (
              <motion.span
                key={strength.label}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={cn(
                  "text-xs font-medium",
                  strength.score <= 25 && "text-red-500",
                  strength.score > 25 && strength.score <= 50 && "text-orange-500",
                  strength.score > 50 && strength.score <= 75 && "text-yellow-600",
                  strength.score > 75 && "text-green-500"
                )}
                data-testid="text-strength-label"
              >
                {strength.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", strength.color)}
            initial={{ width: 0 }}
            animate={{ width: `${strength.score}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            data-testid="progress-strength-bar"
          />
        </div>
      </div>

      <ul className="space-y-1">
        {strength.requirements.map((req, index) => (
          <motion.li
            key={req.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-2"
            data-testid={`requirement-${index}`}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <X className="w-3.5 h-3.5 text-muted-foreground/50" />
            )}
            <span
              className={cn(
                "text-xs transition-colors",
                req.met
                  ? "text-green-600 dark:text-green-400 line-through"
                  : "text-muted-foreground"
              )}
            >
              {req.label}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function isPasswordStrong(password: string): boolean {
  const strength = getPasswordStrength(password);
  return strength.score === 100;
}
