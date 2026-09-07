import { useLocation, Link } from "wouter";
import { Home, MessageCircle, BookOpen, Flame, User, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useFlags } from "@/hooks/useFlags";
import { useScroll } from "@/context/ScrollContext";
import { useSidebar } from "@/context/SidebarContext";

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
  // hideNav still drives the mobile bottom tab bar's scroll-to-hide behavior
  // (unrelated to this — a small nicety on a small screen where every pixel
  // counts). The desktop rail no longer auto-hides on scroll; it's now a
  // manual collapse the user toggles and which is remembered (SidebarContext).
  const { hideNav } = useScroll();
  const { collapsed, toggleCollapsed } = useSidebar();

  const navItems = flags["community-section"]
    ? [...BASE_NAV, COMMUNITY_NAV, PROFILE_NAV]
    : [...BASE_NAV, PROFILE_NAV];

  return (
    <nav
      className={`
        fixed z-50 bg-[var(--app-white)] border-[var(--app-border)]
        ${hideNav ? "hidden" : "flex"} md:flex
        bottom-0 left-0 right-0 h-[64px] border-t items-center justify-between px-10 pb-2 pt-2
        md:top-0 md:bottom-0 md:right-auto md:h-screen md:border-t-0 md:border-r
        md:flex-col md:justify-start md:items-stretch md:px-0 md:py-8 md:gap-1
        md:transition-[width] md:duration-300 md:ease-out
        ${collapsed ? "md:w-[72px]" : "md:w-[220px]"}
      `}
      aria-label="Primary"
    >
      <div className={`hidden md:flex items-center mb-8 px-6 ${collapsed ? "justify-center px-0" : "justify-between"}`}>
        {!collapsed && <span className="font-serif text-[20px] text-[var(--app-green)]">SoulGuide</span>}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-7 h-7 bg-transparent border-none cursor-pointer text-[var(--app-gray-lt)] hover:text-[var(--app-green)] transition-colors"
        >
          {collapsed ? <ChevronsRight size={16} strokeWidth={1.75} /> : <ChevronsLeft size={16} strokeWidth={1.75} />}
        </button>
      </div>
      {navItems.map((item) => {
        const isActive = location === item.path ||
          (item.path === "/chat" && location === "/transition");
        return (
          <Link key={item.path} href={item.path}>
            <button
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`
                flex flex-col items-center gap-2.5 bg-transparent border-none cursor-pointer
                p-0
                md:flex-row md:gap-4 md:items-center md:w-full md:py-3 md:min-h-[48px]
                md:hover:bg-[var(--app-bg-warm)] transition-colors
                ${collapsed ? "md:justify-center md:px-0" : "md:px-6"}
              `}
              style={isActive ? { background: undefined } : undefined}
            >
              {item.icon(isActive)}
              <span
                className={`text-[10px] md:text-[13px] font-semibold tracking-[0.15em] uppercase ${collapsed ? "md:hidden" : ""}`}
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
