"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  match: (path: string) => boolean;
}

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NAV: NavItem[] = [
  { href: "/dashboard", label: "ホーム", match: (p) => p === "/dashboard", icon: icon("M3 12l9-9 9 9M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9") },
  { href: "/jobs", label: "案件を探す", match: (p) => p === "/jobs" || p.startsWith("/jobs/") && p !== "/jobs/new", icon: icon("M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z") },
  { href: "/jobs/new", label: "案件を掲載", match: (p) => p === "/jobs/new", icon: icon("M12 5v14M5 12h14") },
  { href: "/my/jobs", label: "自社の案件", match: (p) => p.startsWith("/my/jobs"), icon: icon("M4 7h16M4 12h16M4 17h10") },
  { href: "/my/applications", label: "応募履歴", match: (p) => p.startsWith("/my/applications"), icon: icon("M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z") },
  { href: "/mypage", label: "マイページ", match: (p) => p.startsWith("/mypage"), icon: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6") },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            }`}
          >
            <span className={active ? "text-brand-600" : "text-ink-400"}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-ink-200 bg-white px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo className="text-xl" />
        </div>
        <div className="mt-8 flex-1">{nav}</div>
        <UserCard name={user?.name} company={user?.company?.name} onLogout={handleLogout} />
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
        <Logo className="text-lg" />
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-ink-600 hover:bg-ink-100"
          aria-label="メニュー"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={mobileOpen ? "M6 6l12 12M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-b border-ink-200 bg-white px-4 py-4 lg:hidden">
          {nav}
          <div className="mt-4">
            <UserCard name={user?.name} company={user?.company?.name} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Main */}
      <main className="min-w-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

function UserCard({ name, company, onLogout }: { name?: string; company?: string; onLogout: () => void }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {name?.charAt(0) ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink-800">{name ?? "—"}</div>
          <div className="truncate text-xs text-ink-500">{company ?? "—"}</div>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-ink-500 hover:bg-white hover:text-ink-800"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ログアウト
      </button>
    </div>
  );
}
