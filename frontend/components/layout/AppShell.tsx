"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  match: (p: string) => boolean;
}

const ic = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NAV: NavItem[] = [
  { href: "/dashboard", label: "ホーム", match: (p) => p === "/dashboard", icon: ic("M3 12l9-9 9 9M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9") },
  { href: "/jobs", label: "案件一覧", match: (p) => p === "/jobs" || (p.startsWith("/jobs/") && p !== "/jobs/new"), icon: ic("M4 6h16M4 12h16M4 18h16") },
  { href: "/jobs/new", label: "案件を投稿", match: (p) => p === "/jobs/new", icon: ic("M12 5v14M5 12h14") },
  { href: "/my/jobs", label: "自社案件一覧", match: (p) => p.startsWith("/my/jobs"), icon: ic("M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3M9 3v4h6V3M9 12h6M9 16h4") },
  { href: "/my/applications", label: "応募管理", match: (p) => p.startsWith("/my/applications"), icon: ic("M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z") },
  { href: "/my/contracts", label: "成約管理", match: (p) => p.startsWith("/my/contracts"), icon: ic("M9 12l2 2 4-4M7.5 4.2a2 2 0 0 1 1.8-1.1h5.4a2 2 0 0 1 1.8 1.1M4 7h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z") },
  { href: "/mypage", label: "マイページ", match: (p) => p.startsWith("/mypage"), icon: ic("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6") },
];

function titleFor(path: string): string {
  if (path.startsWith("/my/jobs/") && path.includes("/applications")) return "応募者一覧";
  if (path === "/dashboard") return "ダッシュボード";
  if (path === "/jobs") return "案件一覧";
  if (path === "/jobs/new") return "案件を投稿";
  if (path.startsWith("/jobs/")) return "案件詳細";
  if (path.startsWith("/my/jobs")) return "自社案件一覧";
  if (path.startsWith("/my/applications")) return "応募管理";
  if (path.startsWith("/my/contracts")) return "成約管理";
  if (path.startsWith("/mypage")) return "マイページ";
  return "BASE88";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-nav-800 text-ink-300">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
            <path d="M3 13.5 12 4l9 9.5M5.5 11.5V19a1 1 0 0 0 1 1h4v-5h3v5h4a1 1 0 0 0 1-1v-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-lg font-bold tracking-tight text-white">
          BASE<span className="text-brand-400">88</span>
        </span>
      </div>
      <nav className="mt-2 flex-1 space-y-0.5 px-3">
        {NAV.map((item) => {
          const on = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawer(false)}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                on ? "bg-nav-700 text-white" : "text-ink-300 hover:bg-nav-700/50 hover:text-white"
              }`}
            >
              {on && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-brand-500" />}
              <span className={on ? "text-brand-400" : "text-ink-400"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-[11px] text-ink-500">© 2026 BASE88</div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-60">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawer(true)} className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100 lg:hidden" aria-label="メニュー">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
            </button>
            <h1 className="text-lg font-bold text-ink-900">{titleFor(pathname)}</h1>
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ink-50">
              <span className="hidden text-right sm:block">
                <span className="block text-xs text-ink-500">{user?.company?.name ?? "—"}</span>
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {user?.name?.charAt(0) ?? "?"}
              </span>
              <span className="hidden text-sm font-medium text-ink-700 sm:block">{user?.name}</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg">
                <div className="border-b border-ink-100 px-4 py-3">
                  <div className="text-sm font-semibold text-ink-800">{user?.name}</div>
                  <div className="truncate text-xs text-ink-500">{user?.email}</div>
                </div>
                <Link href="/mypage" onClick={() => setMenu(false)} className="block px-4 py-2.5 text-sm text-ink-600 hover:bg-ink-50">マイページ</Link>
                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1">
          {/* コンテンツ領域は表示領域の全幅を使う（左右の余白は px のみ）。ヘッダー下の高さも満たす。 */}
          <div className="flex min-h-[calc(100dvh-4.5rem)] w-full flex-col px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
