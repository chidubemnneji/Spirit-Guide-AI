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

export function OptionCard({ id, text, icon, selected, disabled = false, onClick, testId, index = 0 }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId || `option-${id}`}
      className="w-full text-left px-5 py-4 bg-[var(--app-white)] border-b border-[var(--app-border-soft)] flex items-center justify-between transition-colors"
      style={{ background: selected ? "var(--app-bg-warm)" : "var(--app-white)", borderLeft: selected ? "3px solid var(--app-green)" : "3px solid transparent" }}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-[var(--app-green)] flex-shrink-0">{icon}</span>}
        <span className="font-serif text-[18px] text-[var(--app-dark)]">{text}</span>
      </div>
      {selected && (
        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center" style={{ background: "var(--cta-bg)" }}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="var(--cta-fg)" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </div>
      )}
    </button>
  );
}
