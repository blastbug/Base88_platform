"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ActivityItem, AnnouncementItem, DashboardData, Job } from "@/lib/types";
import { Spinner } from "@/components/ui";
import { displayJobStatus, formatDate, formatDateTime, luggageLayout, route, shortDate } from "@/lib/format";

type Nav = { push: (href: string) => void };

/* ---------- helpers ---------- */
function Ic({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const CHEVRON = "m9 18 6-6-6-6";
function dateDow(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${dow})`;
}
function toArr(x: { data: Job[] } | Job[] | undefined): Job[] {
  return Array.isArray(x) ? x : x?.data ?? [];
}

/* ---------- page ---------- */
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<DashboardData>("/dashboard").then(setData).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="flex justify-center py-24 text-brand-600"><Spinner className="h-8 w-8" /></div>;
  }

  const recentJobs = toArr(data.recent_jobs);
  const myJobs = toArr(data.my_jobs);

  return (
    <div className="animate-fade-in space-y-6">
      {/* 概要 */}
      <section className="card p-5">
        <SectionHead title="概要" href="/jobs" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard tone="bg-brand-50 text-brand-600" label="募集中の案件" value={data.stats.recruiting} delta={data.deltas.recruiting}
            icon={<Ic d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />} />
          <StatCard tone="bg-emerald-50 text-emerald-600" label="自社掲載中の案件" value={data.stats.my_posted} delta={data.deltas.my_posted}
            icon={<Ic d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4" />} />
          <StatCard tone="bg-sky-50 text-sky-600" label="自社の応募中" value={data.stats.my_applications} delta={data.deltas.my_applications}
            icon={<Ic d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />} />
          <StatCard tone="bg-amber-50 text-amber-600" label="成約済" value={data.stats.my_contracted} delta={data.deltas.my_contracted}
            icon={<Ic d="M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />} />
        </div>
      </section>

      {/* main grid: 2/3 + 1/3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 新着案件 */}
          <section className="card">
            <SectionHead title="新着案件" href="/jobs" padded />
            <NewJobsTable jobs={recentJobs} router={router} />
          </section>

          {/* 自社掲載中 + 最近の活動 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="card">
              <SectionHead title="自社掲載中の案件" href="/my/jobs" padded />
              <MyJobsList jobs={myJobs} router={router} />
            </section>
            <section className="card flex flex-col">
              <div className="border-b border-ink-100 px-5 py-4"><h2 className="text-base font-bold text-ink-900">最近の活動</h2></div>
              <ActivityList items={data.activities} />
              <div className="mt-auto border-t border-ink-100 px-5 py-3">
                <Link href="/my/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  すべての活動を表示 <Ic d={CHEVRON} className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* right rail */}
        <div className="space-y-6">
          <section className="card">
            <div className="border-b border-ink-100 px-5 py-4"><h2 className="text-base font-bold text-ink-900">お知らせ</h2></div>
            <AnnouncementList items={data.announcements} />
          </section>
          <section className="card">
            <div className="border-b border-ink-100 px-5 py-4"><h2 className="text-base font-bold text-ink-900">クイックアクション</h2></div>
            <QuickActions />
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------- components ---------- */
function SectionHead({ title, href, padded }: { title: string; href?: string; padded?: boolean }) {
  return (
    <div className={padded ? "flex items-center justify-between border-b border-ink-100 px-5 py-4" : "flex items-center justify-between"}>
      <h2 className="text-base font-bold text-ink-900">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
          すべて見る <Ic d={CHEVRON} className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function StatCard({ tone, icon, label, value, delta }: { tone: string; icon: ReactNode; label: string; value: number; delta: number }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
        <span className="text-sm font-medium text-ink-500">{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="text-3xl font-bold tracking-tight text-ink-900">
          {value}<span className="ml-1 text-base font-semibold text-ink-400">件</span>
        </div>
        {delta > 0 && (
          <span className="whitespace-nowrap text-xs text-ink-400">前日比 <span className="font-bold text-emerald-600">+{delta}</span></span>
        )}
      </div>
    </div>
  );
}

function StatusPill({ tone, label }: { tone: string; label: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}>{label}</span>;
}

function NewJobsTable({ jobs, router }: { jobs: Job[]; router: Nav }) {
  if (jobs.length === 0) return <div className="px-5 py-12 text-center text-sm text-ink-500">現在募集中の案件はありません。</div>;
  return (
    <div className="overflow-x-auto">
      <table className="dtable">
        <thead>
          <tr>
            <th>引越予定日</th>
            <th>出発地 → 到着地</th>
            <th>荷物量 / 間取り</th>
            <th>募集状況</th>
            <th>締切日</th>
            <th className="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const st = displayJobStatus(job.status, job.application_deadline);
            return (
              <tr key={job.id}>
                <td className="whitespace-nowrap font-medium text-ink-800">{dateDow(job.moving_date)}</td>
                <td className="font-medium text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</td>
                <td className="text-ink-600">{luggageLayout(job.layout, job.luggage_volume)}</td>
                <td><StatusPill tone={st.tone} label={st.label} /></td>
                <td className="whitespace-nowrap text-ink-600">{shortDate(job.application_deadline)}</td>
                <td className="text-right">
                  <button onClick={() => router.push(`/jobs/${job.id}`)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-50">
                    詳細を見る
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MyJobsList({ jobs, router }: { jobs: Job[]; router: Nav }) {
  if (jobs.length === 0) return <div className="px-5 py-12 text-center text-sm text-ink-500">掲載中の案件はありません。</div>;
  return (
    <div className="divide-y divide-ink-100">
      {jobs.map((job) => {
        const st = displayJobStatus(job.status, job.application_deadline);
        return (
          <div key={job.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusPill tone={st.tone} label={st.label} />
                  <span className="truncate font-semibold text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1"><Ic d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" className="h-3.5 w-3.5 text-ink-400" />{dateDow(job.moving_date)}</span>
                  <span className="inline-flex items-center gap-1"><Ic d="m7.5 4.3 9 5.2M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" className="h-3.5 w-3.5 text-ink-400" />{luggageLayout(job.layout, job.luggage_volume)}</span>
                </div>
              </div>
              <button onClick={() => router.push(`/jobs/${job.id}`)} className="shrink-0 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-50">詳細</button>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-ink-500">
              <span>応募数 <span className="font-semibold text-ink-700">{job.applications_count ?? 0}社</span></span>
              <span>締切日 {shortDate(job.application_deadline)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ACT: Record<ActivityItem["type"], { tone: string; d: string }> = {
  contract: { tone: "bg-emerald-50 text-emerald-600", d: "M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" },
  application: { tone: "bg-brand-50 text-brand-600", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" },
  posted: { tone: "bg-sky-50 text-sky-600", d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5" },
};
function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <div className="px-5 py-10 text-center text-sm text-ink-500">最近の活動はありません。</div>;
  return (
    <ul className="divide-y divide-ink-100">
      {items.map((a, i) => {
        const c = ACT[a.type] ?? ACT.posted;
        return (
          <li key={i} className="flex gap-3 px-5 py-3.5">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${c.tone}`}><Ic d={c.d} className="h-4 w-4" /></span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink-800">{a.text}</div>
              <div className="truncate text-xs text-ink-500">{a.route}</div>
              <div className="mt-0.5 text-xs text-ink-400">{formatDateTime(a.at)}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AnnouncementList({ items }: { items: AnnouncementItem[] }) {
  if (items.length === 0) return <div className="px-5 py-10 text-center text-sm text-ink-500">現在お知らせはありません。</div>;
  return (
    <ul className="divide-y divide-ink-100">
      {items.map((a) => (
        <li key={a.id} className="flex items-start gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-400">{formatDate(a.published_at)}</span>
              {a.level === "important" ? (
                <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-inset ring-rose-200">重要</span>
              ) : (
                <span className="inline-flex items-center rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 ring-1 ring-inset ring-brand-200">お知らせ</span>
              )}
            </div>
            <div className="mt-1 text-sm font-semibold text-ink-800">{a.title}</div>
            <div className="mt-0.5 line-clamp-1 text-xs text-ink-500">{a.body}</div>
          </div>
          <Ic d={CHEVRON} className="mt-1 h-4 w-4 shrink-0 text-ink-300" />
        </li>
      ))}
    </ul>
  );
}

const QUICK = [
  { href: "/jobs/new", title: "案件を投稿する", desc: "新しい案件を掲載します", tone: "bg-brand-50 text-brand-600", d: "M12 5v14M5 12h14" },
  { href: "/jobs", title: "案件を検索する", desc: "募集中の案件を検索します", tone: "bg-emerald-50 text-emerald-600", d: "m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" },
  { href: "/my/applications", title: "応募履歴を見る", desc: "自社の応募状況を確認します", tone: "bg-sky-50 text-sky-600", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" },
  { href: "/mypage", title: "マイページへ", desc: "会社情報や各種設定を行います", tone: "bg-amber-50 text-amber-600", d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5" },
];
function QuickActions() {
  return (
    <div className="divide-y divide-ink-100">
      {QUICK.map((q) => (
        <Link key={q.href} href={q.href} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink-50">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${q.tone}`}><Ic d={q.d} className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink-800">{q.title}</div>
            <div className="text-xs text-ink-500">{q.desc}</div>
          </div>
          <Ic d={CHEVRON} className="h-4 w-4 shrink-0 text-ink-300" />
        </Link>
      ))}
    </div>
  );
}
