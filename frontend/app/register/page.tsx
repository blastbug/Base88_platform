"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout, AuthLogo } from "@/components/auth/AuthLayout";
import { Button, Field, Input } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

const EMPTY = {
  company_name: "",
  phone: "",
  address: "",
  corporate_number: "",
  invoice_number: "",
  representative_name: "",
  email: "",
  password: "",
  password_confirmation: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/register", { method: "POST", body: form });
      setDone(true);
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { errors?: Record<string, string[]>; message?: string }) : null;
      const first = body?.errors ? Object.values(body.errors)[0]?.[0] : null;
      setError(first ?? body?.message ?? "申請に失敗しました。入力内容をご確認ください。");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="mb-6"><AuthLogo /></div>
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <h1 className="text-xl font-bold text-ink-900">登録申請を受け付けました</h1>
          <p className="mt-2 text-sm text-ink-500">
            BASE88による承認をもって、ご利用を開始いただけます。承認完了後、ご登録のメールアドレスにご連絡します。
          </p>
          <Link href="/login" className="btn btn-primary mt-6 w-full">ログイン画面へ</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-6"><AuthLogo /></div>
      <h1 className="text-xl font-bold text-ink-900">加盟会社 登録申請</h1>
      <p className="mt-1 text-sm text-ink-500">お申し込み後、BASE88の承認をもってご利用開始いただけます。</p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="text-xs font-bold text-ink-400">会社情報</div>
        <Field label="会社名" required><Input value={form.company_name} onChange={set("company_name")} required placeholder="株式会社◯◯引越サービス" /></Field>
        <Field label="電話番号" required><Input value={form.phone} onChange={set("phone")} required placeholder="03-1234-5678" /></Field>
        <Field label="住所"><Input value={form.address} onChange={set("address")} placeholder="東京都◯◯区…" /></Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="法人番号"><Input value={form.corporate_number} onChange={set("corporate_number")} /></Field>
          <Field label="インボイス番号"><Input value={form.invoice_number} onChange={set("invoice_number")} /></Field>
        </div>

        <div className="border-t border-ink-100 pt-4 text-xs font-bold text-ink-400">担当者情報（会社管理者）</div>
        <Field label="担当者名" required><Input value={form.representative_name} onChange={set("representative_name")} required placeholder="山田 太郎" /></Field>
        <Field label="メールアドレス" required><Input type="email" value={form.email} onChange={set("email")} required placeholder="you@company.co.jp" /></Field>
        <Field label="パスワード" required hint="8文字以上"><Input type="password" value={form.password} onChange={set("password")} required /></Field>
        <Field label="パスワード（確認）" required><Input type="password" value={form.password_confirmation} onChange={set("password_confirmation")} required /></Field>

        <Button type="submit" loading={busy} className="w-full">登録を申請する</Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-500">
        すでにアカウントをお持ちの方は <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">ログイン</Link>
      </p>
    </AuthLayout>
  );
}
