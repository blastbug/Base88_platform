"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { DashboardStats, Job } from "@/lib/types";
import { Badge, SectionCard, Spinner, StatCard } from "@/components/ui";
import { displayJobStatus, formatDate, luggageLayout, route, shortDate } from "@/lib/format";

function Ic({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
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

  if (loading) {
    return <div className="flex justify-center py-24 text-brand-600"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="募集中の案件" value={stats?.recruiting ?? 0} unit="件" tone="bg-brand-50 text-brand-600" icon={<Ic d="M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />} />
        <StatCard label="自社掲載中の案件" value={stats?.my_posted ?? 0} unit="件" tone="bg-emerald-50 text-emerald-600" icon={<Ic d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-4-4H9zM13 3v4h4M9 13h6M9 17h4" />} />
        <StatCard label="自社の応募中" value={stats?.my_applications ?? 0} unit="件" tone="bg-sky-50 text-sky-600" icon={<Ic d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />} />
        <StatCard label="成約済" value={stats?.my_contracted ?? 0} unit="件" tone="bg-amber-50 text-amber-600" icon={<Ic d="M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />} />
      </div>

      {/* Recent jobs */}
      <SectionCard
        title="新着案件"
        action={<Link href="/jobs" className="text-sm font-semibold text-brand-600 hover:text-brand-700">すべて見る</Link>}
      >
        <div className="overflow-x-auto">
          <table className="dtable">
            <thead>
              <tr>
                <th>引越予定日</th>
                <th>出発地 → 到着地</th>
                <th>荷物量 / 間取り</th>
                <th>募集状況</th>
                <th>締切日</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((job) => {
                const st = displayJobStatus(job.status, job.application_deadline);
                return (
                  <tr key={job.id} className="cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                    <td className="whitespace-nowrap font-medium text-ink-800">{formatDate(job.moving_date)}</td>
                    <td className="font-medium text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</td>
                    <td className="text-ink-600">{luggageLayout(job.layout, job.luggage_volume)}</td>
                    <td><Badge tone={st.tone}>{st.label}</Badge></td>
                    <td className="whitespace-nowrap text-ink-600">{shortDate(job.application_deadline)}</td>
                  </tr>
                );
              })}
              {recent.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-ink-500">現在募集中の案件はありません。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
