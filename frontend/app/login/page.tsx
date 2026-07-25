"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button, Input } from "@/components/ui";

function Logo() {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center">
        <svg viewBox="0 0 40 40" className="h-10 w-10">
          <path d="M20 2.5 34.5 11 v18 L20 37.5 5.5 29 V11 Z" fill="#2563eb" />
          <path d="M13.5 21.5 20 15 l6.5 6.5 M15.5 20v6.5a.6.6 0 0 0 .6.6h2.4v-3.4h2.9v3.4h2.5a.6.6 0 0 0 .6-.6V20"
            fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-[28px] font-bold tracking-tight text-ink-900">BASE88</span>
    </span>
  );
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: Record<string, string[]>; message?: string };
        setError(body.errors?.email?.[0] ?? body.message ?? "ログインに失敗しました。");
      } else {
        setError("ログインに失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background photo — shown at full vividness (no wash) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.jpg')", backgroundColor: "#cdd9e6" }}
      />

      {/* Bottom-left tagline */}
      <div
        className="pointer-events-none absolute bottom-16 left-8 z-10 max-w-lg sm:bottom-24 sm:left-16"
        style={{ textShadow: "0 2px 10px rgba(15,23,42,0.45)" }}
      >
        <h2 className="text-[28px] font-bold leading-snug text-white sm:text-4xl">
          つなぐのは、信頼とビジネス
        </h2>
        <p className="mt-3 text-sm font-medium text-white/90 sm:text-base">
          引越し業界の新しい協力のカタチを、BASE88から。
        </p>
      </div>

      {/* Login card */}
      <div className="relative z-20 flex min-h-screen items-center justify-center px-4 py-10 lg:justify-end lg:pr-[7vw]">
        <div className="w-full max-w-[520px] rounded-2xl bg-white p-10 shadow-2xl sm:p-12">
          {/* Logo + subtitle */}
          <div className="flex flex-col items-center text-center">
            <Logo />
            <p className="mt-4 text-[15px] text-ink-500">引越し案件共有プラットフォーム</p>
          </div>

          <h1 className="mt-10 text-2xl font-bold text-ink-900">ログイン</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">メールアドレス</span>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレスを入力"
                className="!py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">パスワード</span>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="!py-3 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-400 hover:text-ink-600"
                  aria-label="パスワード表示切替"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {show ? (
                      <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8M9.9 5.1A9.5 9.5 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.6 3.6M6.1 6.2C3.9 7.6 2.5 9.7 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.9" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" /></>
                    )}
                  </svg>
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                ログインしたままにする
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                パスワードをお忘れですか？
              </Link>
            </div>

            <Button type="submit" loading={submitting} className="!py-3.5 w-full text-base">ログイン</Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            アカウントをお持ちでない方は <span className="cursor-pointer font-medium text-brand-600 hover:text-brand-700">こちら</span>
          </p>
        </div>
      </div>
    </div>
  );
}
