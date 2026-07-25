"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AnnouncementItem } from "@/lib/types";
import { Logo } from "@/components/Logo";

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
  { href: "/dashboard", label: "ダッシュボード", match: (p) => p === "/dashboard", icon: ic("M3 12l9-9 9 9M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9") },
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
  const [bell, setBell] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBell(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    api<{ data: AnnouncementItem[] }>("/announcements").then((r) => setAnnouncements(r.data)).catch(() => {});
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-nav-800 text-ink-300">
      <div className="px-5 py-5">
        <Logo variant="light" />
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
                on ? "bg-brand-600 text-white shadow-sm" : "text-ink-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={on ? "text-white" : "text-ink-400"}>{item.icon}</span>
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

          <div className="flex items-center gap-1.5 sm:gap-3">
          {/* 通知ベル */}
          <div className="relative" ref={bellRef}>
            <button onClick={() => setBell((v) => !v)} className="relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700" aria-label="通知">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {announcements.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">{announcements.length}</span>
              )}
            </button>
            {bell && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
                <div className="border-b border-ink-100 px-4 py-3 text-sm font-bold text-ink-800">お知らせ</div>
                {announcements.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-ink-500">新しいお知らせはありません</div>
                ) : (
                  <ul className="max-h-96 divide-y divide-ink-100 overflow-y-auto">
                    {announcements.map((a) => (
                      <li key={a.id} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink-400">{formatDate(a.published_at)}</span>
                          {a.level === "important" ? (
                            <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-inset ring-rose-200">重要</span>
                          ) : (
                            <span className="inline-flex items-center rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 ring-1 ring-inset ring-brand-200">お知らせ</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-ink-800">{a.title}</div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-ink-500">{a.body}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/dashboard" onClick={() => setBell(false)} className="block border-t border-ink-100 px-4 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-ink-50">すべて見る</Link>
              </div>
            )}
          </div>

          {/* ユーザーメニュー */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-ink-50">
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-sm font-semibold text-ink-800">{user?.company?.name ?? "—"}</span>
                <span className="block text-xs text-ink-500">{user?.name}</span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-ink-100 text-ink-400">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.31 0-8 1.67-8 5v1h16v-1c0-3.33-4.69-5-8-5Z" /></svg>
              </span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg">
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
