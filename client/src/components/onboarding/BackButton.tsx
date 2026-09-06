import { ArrowLeft } from "lucide-react";

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} data-testid="button-back"
      className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-[var(--app-gray-lt)] mb-4">
      <ArrowLeft size={14} /> Back
    </button>
  );
}
