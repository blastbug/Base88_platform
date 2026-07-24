"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Logo } from "@/components/brand/Logo";
import { Button, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-800 lg:block">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.15), transparent 45%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo light className="text-2xl" />
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              引越案件を、
              <br />
              会社間でスマートに共有。
            </h2>
            <p className="mt-4 max-w-md text-brand-100">
              対応できない案件を掲載し、他社へ依頼。応募・成約・顧客情報の共有まで、
              安全な会員制プラットフォームで完結します。
            </p>
          </div>
          <div className="flex gap-8 text-sm text-brand-100">
            <div>
              <div className="text-2xl font-bold text-white">安全</div>
              成約後のみ顧客情報を開示
            </div>
            <div>
              <div className="text-2xl font-bold text-white">簡単</div>
              掲載・応募・成約を一気通貫
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 lg:hidden">
            <Logo className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">ログイン</h1>
          <p className="mt-1 text-sm text-ink-500">アカウント情報を入力してください。</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
            <Field label="メールアドレス" required>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.co.jp"
              />
            </Field>
            <Field label="パスワード" required>
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Button type="submit" loading={submitting} className="w-full">
              ログイン
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-400">
            アカウントは管理者（BASE88）が発行します。
            <br />
            ログインできない場合は管理者へお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
