import type { ReactNode } from "react";

/** ログイン系画面（再設定等）の共通レイアウト：背景写真＋中央カード */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.jpg')", backgroundColor: "#cdd9e6" }}
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl sm:p-10">{children}</div>
      </div>
    </div>
  );
}

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="inline-flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center">
          <svg viewBox="0 0 40 40" className="h-9 w-9">
            <path d="M20 2.5 34.5 11 v18 L20 37.5 5.5 29 V11 Z" fill="#2563eb" />
            <path d="M13.5 21.5 20 15 l6.5 6.5 M15.5 20v6.5a.6.6 0 0 0 .6.6h2.4v-3.4h2.9v3.4h2.5a.6.6 0 0 0 .6-.6V20"
              fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-2xl font-bold tracking-tight text-ink-900">BASE88</span>
      </span>
    </div>
  );
}
