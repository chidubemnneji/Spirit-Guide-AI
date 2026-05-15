import { Loader2 } from "lucide-react";

interface ContinueButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "complete";
  children?: React.ReactNode;
}

export function ContinueButton({ onClick, disabled = false, loading = false, variant = "default", children }: ContinueButtonProps) {
  return (
    <div className="pt-4">
      <button
        onClick={onClick}
        disabled={disabled || loading}
        data-testid="button-continue"
        className="w-full py-4 font-semibold text-[13px] tracking-[0.2em] uppercase disabled:opacity-40 flex items-center justify-center gap-2"
        style={{ background: "#1b291d", color: "#fff" }}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Processing...</>
        ) : (
          children || "Continue"
        )}
      </button>
    </div>
  );
}
