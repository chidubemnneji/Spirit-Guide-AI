import { useLocation, Link } from "wouter";
import { useFlags } from "@/hooks/useFlags";
import { useScroll } from "@/context/ScrollContext";

const BASE_NAV = [
  {
    path: "/devotion",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" fill={active ? "#1b291d" : "#73726C"} />
      </svg>
    ),
  },
  {
    path: "/chat",
    label: "Guide",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1b291d" : "#73726C"} strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    path: "/bible",
    label: "Word",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1b291d" : "#73726C"} strokeWidth="1.5" strokeLinecap="square">
        <path d="M5 20V5H19V20" />
      </svg>
    ),
  },
];

const COMMUNITY_NAV = {
  path: "/community",
  label: "Pray",
  icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1b291d" : "#73726C"} strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
};

const PROFILE_NAV = {
  path: "/account",
  label: "Profile",
  icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1b291d" : "#73726C"} strokeWidth="1.5" strokeLinecap="square">
      <path d="M4 9H20M4 15H20" />
    </svg>
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
        fixed z-50 bg-white border-[#D8D7D2]
        ${hideNav ? "hidden md:flex" : "flex"}
        bottom-0 left-0 right-0 h-[64px] border-t items-center justify-between px-10 pb-2 pt-2
        md:top-0 md:bottom-0 md:right-auto md:h-screen md:w-[220px] md:border-t-0 md:border-r
        md:flex-col md:justify-start md:items-stretch md:px-0 md:py-8 md:gap-1
      `}
      aria-label="Primary"
    >
      <div className="hidden md:block px-6 mb-8">
        <span className="font-serif text-[20px] text-[#1b291d]">SoulGuide</span>
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
                md:hover:bg-[#f2f1ec] transition-colors
              "
              style={isActive ? { background: undefined } : undefined}
            >
              {item.icon(isActive)}
              <span
                className="text-[10px] md:text-[13px] font-semibold tracking-[0.15em] uppercase"
                style={{ color: isActive ? "#1b291d" : "#73726C" }}
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
