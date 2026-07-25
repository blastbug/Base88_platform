"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { AuthLayout, AuthLogo } from "@/components/auth/AuthLayout";
import { Button, Input } from "@/components/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
    setEmail(params.get("email") ?? "");
  }, []);

  const invalidLink = !token || !email;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("パスワードが一致しません。");
      return;
    }
    setSubmitting(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: { token, email, password, password_confirmation: confirm },
      });
      setDone(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: Record<string, string[]>; message?: string };
        setError(body.errors?.email?.[0] ?? body.errors?.password?.[0] ?? body.message ?? "再設定に失敗しました。");
      } else {
        setError("再設定に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <AuthLogo />

      {done ? (
        <div className="mt-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="mt-4 text-lg font-bold text-ink-900">パスワードを再設定しました</h1>
          <p className="mt-2 text-sm text-ink-500">ログイン画面に移動します…</p>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">ログイン画面へ</Link>
        </div>
      ) : (
        <>
          <h1 className="mt-8 text-xl font-bold text-ink-900">新しいパスワードの設定</h1>
          <p className="mt-1.5 text-sm text-ink-500">{email ? `${email} のパスワードを再設定します。` : "新しいパスワードを設定してください。"}</p>

          {invalidLink ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              リンクが無効です。お手数ですが、もう一度パスワード再設定をお試しください。
              <div className="mt-2">
                <Link href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">再設定メールを送る</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-700">新しいパスワード</span>
                <div className="relative">
                  <Input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8文字以上" className="!py-3 pr-10" />
                  <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-400 hover:text-ink-600" aria-label="表示切替">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      {show ? <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8M9.9 5.1A9.5 9.5 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.6 3.6M6.1 6.2C3.9 7.6 2.5 9.7 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.9" strokeLinecap="round" strokeLinejoin="round" /> : <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-700">新しいパスワード（確認）</span>
                <Input type={show ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="もう一度入力" className="!py-3" />
              </label>
              <Button type="submit" loading={submitting} className="!py-3.5 w-full text-base">パスワードを再設定</Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-ink-500">
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">ログイン画面に戻る</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
