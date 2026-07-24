"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Badge, PageHeader } from "@/components/ui";

const ROLE_LABEL: Record<string, string> = {
  platform_admin: "BASE88管理者",
  company_admin: "会社管理者",
  staff: "一般担当者",
};

export default function MyPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader title="マイページ" description="アカウント・会社情報を確認できます。" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-ink-900">アカウント情報</h2>
          <dl className="mt-4 space-y-4">
            <Row label="担当者名" value={user.name} />
            <Row label="メールアドレス" value={user.email} />
            <Row label="権限" value={<Badge tone="bg-brand-50 text-brand-700 ring-brand-600/20">{ROLE_LABEL[user.role] ?? user.role}</Badge>} />
          </dl>
        </div>

        {/* Company */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-ink-900">会社情報</h2>
          {user.company ? (
            <dl className="mt-4 space-y-4">
              <Row label="会社名" value={user.company.name} />
              <Row
                label="利用状況"
                value={
                  user.company.status === "approved" ? (
                    <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">利用中</Badge>
                  ) : (
                    <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/20">承認待ち</Badge>
                  )
                }
              />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-ink-500">BASE88管理者アカウントのため、会社に紐づいていません。</p>
          )}
        </div>

        {/* Quick links */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-ink-900">履歴</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <QuickLink href="/my/jobs" label="掲載履歴" desc="自社が掲載した案件" />
            <QuickLink href="/my/applications" label="応募履歴" desc="自社が応募した案件" />
            <QuickLink href="/my/applications" label="成約履歴" desc="成約した案件・顧客情報" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-sm font-medium text-ink-800">{value}</dd>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="rounded-xl border border-ink-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50">
      <div className="font-semibold text-ink-900">{label}</div>
      <div className="mt-0.5 text-xs text-ink-500">{desc}</div>
    </Link>
  );
}
