"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-100 px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm lg:grid-cols-2">
        {/* Promo panel */}
        <div className="relative hidden flex-col justify-between bg-brand-700 p-8 text-white lg:flex">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                <path d="M3 13.5 12 4l9 9.5M5.5 11.5V19a1 1 0 0 0 1 1h4v-5h3v5h4a1 1 0 0 0 1-1v-7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-xl font-bold">BASE<span className="text-brand-200">88</span></span>
          </div>

          <div className="py-6">
            <p className="text-sm font-medium text-brand-200">引越会社同士をつなぐ</p>
            <h2 className="mt-1 text-2xl font-bold leading-snug">案件共有プラットフォーム</h2>
          </div>

          {/* Truck / road illustration */}
          <svg viewBox="0 0 400 140" className="w-full" role="img" aria-label="引越トラックのイラスト">
            <rect x="0" y="112" width="400" height="4" rx="2" fill="rgba(255,255,255,0.35)" />
            <g opacity="0.95">
              <rect x="60" y="52" width="150" height="56" rx="6" fill="#fff" />
              <rect x="210" y="70" width="70" height="38" rx="6" fill="#dbeafe" />
              <path d="M210 70h34l24 22v16h-58z" fill="#93c5fd" />
              <rect x="222" y="76" width="20" height="16" rx="2" fill="#1e40af" />
              <circle cx="105" cy="112" r="14" fill="#0f172a" /><circle cx="105" cy="112" r="6" fill="#cbd5e1" />
              <circle cx="245" cy="112" r="14" fill="#0f172a" /><circle cx="245" cy="112" r="6" fill="#cbd5e1" />
              <text x="80" y="88" fill="#2563eb" fontSize="20" fontWeight="700" fontFamily="sans-serif">BASE88</text>
            </g>
            <rect x="150" y="112" width="30" height="4" fill="#fbbf24" opacity="0.8" />
            <rect x="300" y="112" width="30" height="4" fill="#fbbf24" opacity="0.8" />
          </svg>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2"><path d="M3 13.5 12 4l9 9.5M5.5 11.5V19a1 1 0 0 0 1 1h4v-5h3v5h4a1 1 0 0 0 1-1v-7.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="text-lg font-bold text-ink-900">BASE<span className="text-brand-600">88</span></span>
          </div>

          <h1 className="text-xl font-bold text-ink-900">ログイン</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <Field label="メールアドレス">
              <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="メールアドレスを入力" />
            </Field>
            <Field label="パスワード">
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-400 hover:text-ink-600" aria-label="パスワード表示切替">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {show ? (
                      <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8M9.9 5.1A9.5 9.5 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.6 3.6M6.1 6.2C3.9 7.6 2.5 9.7 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.9" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" /></>
                    )}
                  </svg>
                </button>
              </div>
            </Field>

            <div className="text-right">
              <span className="text-sm text-brand-600">パスワードをお忘れの方はこちら</span>
            </div>

            <Button type="submit" loading={submitting} className="w-full">ログイン</Button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-500">
            アカウントをお持ちでない方は<span className="text-brand-600">こちら</span>
          </p>
        </div>
      </div>
      <p className="mt-6 text-xs text-ink-400">© 2026 BASE88 All rights reserved.</p>
    </div>
  );
}
