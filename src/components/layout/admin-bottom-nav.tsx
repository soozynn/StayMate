"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const navItems: NavItem[] = [
  {
    href: "/admin/reservations",
    label: "예약 목록",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V7l3-4h12l3 4v12a2 2 0 0 1-2 2z" />
        <path d="M3 7h18" />
        <path d="M9 11h6M9 15h6" />
      </svg>
    ),
  },
  {
    href: "/admin/blocked-dates",
    label: "날짜 차단",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
        <line x1="9" x2="15" y1="15" y2="9" />
      </svg>
    ),
  },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
      className="z-50 border-t border-slate-200 bg-white"
    >
      <div className="mx-auto flex max-w-[480px]">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                isActive ? "text-slate-900" : "text-slate-400",
              ].join(" ")}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
