import { useLocation, Link } from "wouter";
import { Home, MessageCircle, BookOpen, Flame, User } from "lucide-react";
import { useFlags } from "@/hooks/useFlags";
import { useScroll } from "@/context/ScrollContext";

const BASE_NAV = [
  {
    path: "/devotion",
    label: "Home",
    icon: (active: boolean) => (
      <Home size={22} strokeWidth={1.5} stroke={active ? "var(--app-green)" : "var(--app-gray-lt)"} />
    ),
  },
  {
    path: "/chat",
    label: "Guide",
    icon: (active: boolean) => (
      <MessageCircle size={22} strokeWidth={1.5} stroke={active ? "var(--app-green)" : "var(--app-gray-lt)"} />
    ),
  },
  {
    path: "/bible",
    label: "Word",
    icon: (active: boolean) => (
      <BookOpen size={22} strokeWidth={1.5} stroke={active ? "var(--app-green)" : "var(--app-gray-lt)"} />
    ),
  },
];

const COMMUNITY_NAV = {
  path: "/community",
  label: "Pray",
  icon: (active: boolean) => (
    <Flame
      size={22}
      strokeWidth={1.5}
      stroke={active ? "var(--app-green)" : "var(--app-gray-lt)"}
      fill={active ? "var(--app-amber)" : "none"}
    />
  ),
};

const PROFILE_NAV = {
  path: "/account",
  label: "Profile",
  icon: (active: boolean) => (
    <User size={22} strokeWidth={1.5} stroke={active ? "var(--app-green)" : "var(--app-gray-lt)"} />
  ),
};

export function BottomNav() {
  const [location] = useLocation();
  const flags = useFlags();
  const { hideNav } = useScroll();

  const navItems = flags["community-section"]
    ? [...BASE_NAV, COMMUNITY_NAV, PROFILE_NAV]
    : [...BASE_NAV, PROFILE_NAV];

  return (
    <nav
      className={`
        fixed z-50 bg-[var(--app-white)] border-[var(--app-border)]
        ${hideNav ? "hidden" : "flex"} md:flex
        bottom-0 left-0 right-0 h-[64px] border-t items-center justify-between px-10 pb-2 pt-2
        md:top-0 md:bottom-0 md:right-auto md:h-screen md:w-[220px] md:border-t-0 md:border-r
        md:flex-col md:justify-start md:items-stretch md:px-0 md:py-8 md:gap-1
        md:transition-transform md:duration-300 md:ease-out
        ${hideNav ? "md:-translate-x-full" : "md:translate-x-0"}
      `}
      aria-label="Primary"
    >
      <div className="hidden md:block px-6 mb-8">
        <span className="font-serif text-[20px] text-[var(--app-green)]">SoulGuide</span>
      </div>
      {navItems.map((item) => {
        const isActive = location === item.path ||
          (item.path === "/chat" && location === "/transition");
        return (
          <Link key={item.path} href={item.path}>
            <button
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="
                flex flex-col items-center gap-2.5 bg-transparent border-none cursor-pointer
                p-0
                md:flex-row md:gap-4 md:items-center md:w-full md:px-6 md:py-3 md:min-h-[48px]
                md:hover:bg-[var(--app-bg-warm)] transition-colors
              "
              style={isActive ? { background: undefined } : undefined}
            >
              {item.icon(isActive)}
              <span
                className="text-[10px] md:text-[13px] font-semibold tracking-[0.15em] uppercase"
                style={{ color: isActive ? "var(--app-green)" : "var(--app-gray-lt)" }}
              >
                {item.label}
              </span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
