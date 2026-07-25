"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuthLayout, AuthLogo } from "@/components/auth/AuthLayout";
import { Button, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setSent(true);
    } catch {
      setError("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <AuthLogo />

      {sent ? (
        <div className="mt-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3.5 7l8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="mt-4 text-lg font-bold text-ink-900">メールを送信しました</h1>
          <p className="mt-2 text-sm text-ink-500">
            ご登録がある場合、パスワード再設定用のリンクをお送りしました。メールをご確認ください。
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
            ログイン画面に戻る
          </Link>
        </div>
      ) : (
        <>
          <h1 className="mt-8 text-xl font-bold text-ink-900">パスワード再設定</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            ご登録のメールアドレスを入力してください。再設定用のリンクをお送りします。
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink-700">メールアドレス</span>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="メールアドレスを入力" className="!py-3" />
            </label>
            <Button type="submit" loading={submitting} className="!py-3.5 w-full text-base">再設定メールを送信</Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">ログイン画面に戻る</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
