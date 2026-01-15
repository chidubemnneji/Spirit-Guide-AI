import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OptionCardProps {
  id: string;
  text: string;
  icon?: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  testId?: string;
  index?: number;
}

export function OptionCard({
  id,
  text,
  icon,
  selected,
  disabled = false,
  onClick,
  testId,
  index = 0,
}: OptionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId || `option-${id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 * index }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-5 text-left rounded-xl border transition-all duration-300 relative",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        selected
          ? "border-primary/50 glass shadow-primary glow-border"
          : "glass-subtle glow-border shadow-subtle hover:shadow-elevated",
        disabled && !selected && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <motion.span 
            className="text-3xl flex-shrink-0"
            animate={{ scale: selected ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {icon}
          </motion.span>
        )}
        <span className="text-base font-medium leading-relaxed flex-1 tracking-refined">{text}</span>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: selected ? 1 : 0, 
            opacity: selected ? 1 : 0 
          }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="flex-shrink-0 w-7 h-7 rounded-full gradient-primary shadow-primary flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      </div>
    </motion.button>
  );
}
