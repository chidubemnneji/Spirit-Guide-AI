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
      transition={{ duration: 0.3, delay: 0.05 * index }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-4 text-left rounded-2xl transition-all duration-200",
        "border-2 focus:outline-none focus:ring-2 focus:ring-primary/30",
        selected
          ? "bg-primary/5 border-primary shadow-sm"
          : "bg-card border-transparent hover:bg-muted/50",
        disabled && !selected && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            selected ? "bg-primary/10" : "bg-muted"
          )}>
            {icon}
          </div>
        )}
        <span className="text-base font-medium leading-relaxed flex-1">{text}</span>
        <div className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
          selected
            ? "bg-primary border-primary"
            : "border-muted-foreground/30"
        )}>
          {selected && <Check className="w-4 h-4 text-primary-foreground" />}
        </div>
      </div>
    </motion.button>
  );
}
