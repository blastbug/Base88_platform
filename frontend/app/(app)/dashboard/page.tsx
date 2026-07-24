"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DashboardStats, Job } from "@/lib/types";
import { JobCard } from "@/components/JobCard";
import { EmptyState, LinkButton, Spinner, StatCard } from "@/components/ui";

const icons = {
  recruiting: "M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
  posted: "M4 7h16M4 12h16M4 17h10",
  applied: "M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  contracted: "M5 13l4 4L19 7",
};

function Ic({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ stats: DashboardStats; recent_jobs: { data?: Job[] } | Job[] }>("/dashboard")
      .then((res) => {
        setStats(res.stats);
        const rj = res.recent_jobs;
        setRecent(Array.isArray(rj) ? rj : rj.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">
          こんにちは、{user?.company?.name ?? user?.name} 様
        </h1>
        <p className="mt-1 text-sm text-ink-500">本日の案件状況をご確認いただけます。</p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ActionButton href="/jobs/new" label="案件を掲載" primary d="M12 5v14M5 12h14" />
        <ActionButton href="/jobs" label="案件を探す" d="M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
        <ActionButton href="/my/jobs" label="自社案件を見る" d="M4 7h16M4 12h16M4 17h10" />
        <ActionButton href="/my/applications" label="応募を見る" d="M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-16 text-brand-600">
          <Spinner className="h-7 w-7" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="募集中の案件" value={stats?.recruiting ?? 0} icon={<Ic d={icons.recruiting} />} accent="text-emerald-600" />
            <StatCard label="自社の掲載案件" value={stats?.my_posted ?? 0} icon={<Ic d={icons.posted} />} accent="text-brand-600" />
            <StatCard label="自社の応募" value={stats?.my_applications ?? 0} icon={<Ic d={icons.applied} />} accent="text-amber-600" />
            <StatCard label="成約した案件" value={stats?.my_contracted ?? 0} icon={<Ic d={icons.contracted} />} accent="text-teal-600" />
          </div>

          {/* Recent jobs */}
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900">新着案件</h2>
              <Link href="/jobs" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                すべて見る →
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                title="現在募集中の案件はありません"
                description="新しい案件が掲載されるとここに表示されます。"
                action={<LinkButton href="/jobs/new" variant="primary">案件を掲載する</LinkButton>}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {recent.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ActionButton({ href, label, d, primary }: { href: string; label: string; d: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold transition-colors ${
        primary
          ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
          : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50"
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${primary ? "bg-white/20" : "bg-ink-50 text-brand-600"}`}>
        <Ic d={d} />
      </span>
      <span className="leading-tight">{label}</span>
    </Link>
  );
}
