interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ size = 36, className = "", showWordmark = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="80" height="80" rx="20" fill="#7C6AC7" />
        <path
          d="M40 18 C40 18 28 30 28 42 C28 49 33.5 55 40 55 C46.5 55 52 49 52 42 C52 30 40 18 40 18Z"
          fill="white"
        />
        <path
          d="M40 38 C40 38 35 44 35 48 C35 51 37.2 53 40 53 C42.8 53 45 51 45 48 C45 44 40 38 40 38Z"
          fill="#7C6AC7"
        />
      </svg>
      {showWordmark && (
        <span className="font-serif text-xl font-bold text-foreground tracking-tight">
          Soul<span className="text-primary">Guide</span>
        </span>
      )}
    </div>
  );
}
