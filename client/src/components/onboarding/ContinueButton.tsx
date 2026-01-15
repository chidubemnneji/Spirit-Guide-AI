import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
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
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="lg"
      data-testid="button-continue"
      className={cn(
        "w-full py-6 text-base font-semibold transition-all duration-200",
        variant === "complete" && "bg-accent hover:bg-accent/90"
      )}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {children || "Continue"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  );
}
