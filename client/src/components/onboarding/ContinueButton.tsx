import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContinueButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "complete";
  children?: React.ReactNode;
}

export function ContinueButton({
  onClick,
  disabled = false,
  loading = false,
  variant = "default",
  children,
}: ContinueButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="pt-4"
    >
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        size="lg"
        data-testid="button-continue"
        className={cn(
          "w-full h-14 text-base font-semibold rounded-2xl transition-all duration-300",
          !disabled && "bg-primary shadow-lg shadow-primary/25",
          disabled && "bg-muted text-muted-foreground"
        )}
      >
        {loading ? (
          <motion.span 
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </motion.span>
        ) : (
          <motion.span 
            className="flex items-center gap-2"
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {variant === "complete" && <Sparkles className="h-5 w-5" />}
            {children || "Continue"}
            {variant !== "complete" && <ArrowRight className="h-5 w-5" />}
          </motion.span>
        )}
      </Button>
    </motion.div>
  );
}
