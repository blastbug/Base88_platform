import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

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
    <div className="flex justify-center">
      <Logo variant="dark" size="lg" tagline />
    </div>
  );
}
