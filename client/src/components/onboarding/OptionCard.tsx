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
}

export function OptionCard({
  id,
  text,
  icon,
  selected,
  disabled = false,
  onClick,
  testId,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId || `option-${id}`}
      className={cn(
        "w-full p-5 text-left rounded-xl border-2 transition-all duration-200 relative",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover-elevate",
        disabled && !selected && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <span className="text-3xl flex-shrink-0">{icon}</span>
        )}
        <span className="text-base font-medium leading-relaxed flex-1">{text}</span>
        {selected && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}
