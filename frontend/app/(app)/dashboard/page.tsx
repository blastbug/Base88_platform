"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ActivityItem, AnnouncementItem, DashboardData, Job } from "@/lib/types";
import { Spinner } from "@/components/ui";
import { displayJobStatus, formatDate, formatDateTime, jobCode, luggageLayout, route, shortDate } from "@/lib/format";

type Nav = { push: (href: string) => void };

/* ---------- helpers ---------- */
function Ic({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/** マルチパス（lucide 準拠）アイコン用ラッパー */
function Svg({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

/* lucide 準拠アイコン（参考デザインに合わせる） */
const IconFolder = <Svg className="h-6 w-6"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></Svg>;
const IconFile = <Svg className="h-6 w-6"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></Svg>;
const IconUsers = <Svg className="h-6 w-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>;
const IconHandshake = <Svg className="h-6 w-6"><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></Svg>;
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
        <CardHead title="概要" href="/jobs" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard tone="bg-blue-50 text-blue-600" label="募集中の案件" value={data.stats.recruiting} delta={data.deltas.recruiting} icon={IconFolder} />
          <StatCard tone="bg-emerald-50 text-emerald-600" label="自社掲載中の案件" value={data.stats.my_posted} delta={data.deltas.my_posted} icon={IconFile} />
          <StatCard tone="bg-violet-50 text-violet-600" label="自社の応募数" value={data.stats.my_applications} delta={data.deltas.my_applications} icon={IconUsers} />
          <StatCard tone="bg-orange-50 text-orange-600" label="成約済みの案件" value={data.stats.my_contracted} delta={data.deltas.my_contracted} icon={IconHandshake} />
        </div>
      </section>

      {/* main grid: 2/3 + 1/3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 新着案件 */}
          <section className="card overflow-hidden p-5">
            <CardHead title="新着案件" href="/jobs" />
            <div className="mt-4">
              <NewJobsTable jobs={recentJobs} router={router} />
            </div>
          </section>

          {/* 自社掲載中 + 最近の活動 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="card p-5">
              <CardHead title="自社掲載中の案件" href="/my/jobs" />
              <div className="mt-4">
                <MyJobsList jobs={myJobs} router={router} />
              </div>
            </section>
            <section className="card flex flex-col p-5">
              <CardHead title="最近の活動" />
              <div className="mt-2 flex-1">
                <ActivityList items={data.activities} />
              </div>
              <div className="mt-3 border-t border-ink-100 pt-3">
                <Link href="/my/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  すべての活動を表示 <Ic d={CHEVRON} className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* right rail */}
        <div className="space-y-6">
          <section className="card p-5">
            <CardHead title="お知らせ" />
            <div className="mt-2">
              <AnnouncementList items={data.announcements} />
            </div>
          </section>
          <section className="card p-5">
            <CardHead title="クイックアクション" />
            <div className="mt-2">
              <QuickActions />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------- components ---------- */
function CardHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
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
    <div className="flex items-center gap-3.5 rounded-xl border border-ink-200 bg-white p-4">
      <span className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink-500">{label}</div>
        <div className="mt-0.5 flex items-end justify-between gap-2">
          <div className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink-900">
            {value}<span className="ml-0.5 text-sm font-semibold text-ink-400">件</span>
          </div>
          {delta > 0 && (
            <span className="whitespace-nowrap text-xs text-ink-400">前日比 <span className="font-bold text-emerald-600">+{delta}</span></span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ tone, label }: { tone: string; label: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}>{label}</span>;
}

function NewJobsTable({ jobs, router }: { jobs: Job[]; router: Nav }) {
  if (jobs.length === 0) return <div className="rounded-lg border border-ink-200 py-12 text-center text-sm text-ink-500">現在募集中の案件はありません。</div>;
  const th = "border-b border-ink-200 px-4 py-3 text-left text-xs font-semibold text-ink-500";
  return (
    <>
      {/* PC・タブレット: テーブル */}
      <div className="hidden overflow-hidden rounded-lg border border-ink-200 md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ink-50">
                <th className={th}>引越予定日</th>
                <th className={th}>出発地 → 到着地</th>
                <th className={th}>荷物量 / 間取り</th>
                <th className={th}>募集状況</th>
                <th className={th}>締切日</th>
                <th className={`${th} text-right`}>操作</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => {
                const st = displayJobStatus(job.status, job.application_deadline);
                const td = `px-4 py-3.5 align-middle ${i < jobs.length - 1 ? "border-b border-ink-200" : ""}`;
                return (
                  <tr key={job.id} className="bg-white">
                    <td className={`${td} whitespace-nowrap font-medium text-ink-800`}>{dateDow(job.moving_date)}</td>
                    <td className={`${td} font-medium text-ink-800`}>{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</td>
                    <td className={`${td} text-ink-600`}>{luggageLayout(job.layout, job.luggage_volume)}</td>
                    <td className={td}><StatusPill tone={st.tone} label={st.label} /></td>
                    <td className={`${td} whitespace-nowrap text-ink-600`}>{shortDate(job.application_deadline)}</td>
                    <td className={`${td} text-right`}>
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
      </div>

      {/* スマホ: カード（案件一覧と同じく枠なし・端まで） */}
      <ul className="-mx-5 -mb-5 divide-y divide-ink-100 border-t border-ink-100 md:hidden">
        {jobs.map((job) => {
          const st = displayJobStatus(job.status, job.application_deadline);
          return (
            <li key={job.id}>
              <button onClick={() => router.push(`/jobs/${job.id}`)} className="flex w-full items-center gap-2 px-4 py-4 text-left transition-colors hover:bg-ink-50">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="whitespace-nowrap font-mono text-sm font-bold text-brand-600">{jobCode(job.id, job.moving_date)}</span>
                    <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                      <StatusPill tone={st.tone} label={st.label} />
                      <span className="text-xs text-ink-400">締切 {shortDate(job.application_deadline)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-700">
                    <Ic d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" className="h-4 w-4 shrink-0 text-ink-400" />
                    {dateDow(job.moving_date)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-700">
                    <Svg className="h-4 w-4 shrink-0 text-ink-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="3" /></Svg>
                    <span className="min-w-0 truncate">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-ink-600">
                    <span className="flex items-center gap-2">
                      <Svg className="h-4 w-4 shrink-0 text-ink-400"><path d="m7.5 4.3 9 5.2M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></Svg>
                      {luggageLayout(job.layout, job.luggage_volume)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Svg className="h-4 w-4 shrink-0 text-ink-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>
                      {job.applications_count ?? 0}社
                    </span>
                  </div>
                </div>
                <Ic d={CHEVRON} className="h-5 w-5 shrink-0 text-ink-300" />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function MyJobsList({ jobs, router }: { jobs: Job[]; router: Nav }) {
  if (jobs.length === 0) return <div className="py-12 text-center text-sm text-ink-500">掲載中の案件はありません。</div>;
  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const st = displayJobStatus(job.status, job.application_deadline);
        return (
          <div key={job.id} className="rounded-xl border border-ink-200 p-4">
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

const ACT: Record<ActivityItem["type"], { tone: string; icon: ReactNode }> = {
  contract: { tone: "bg-emerald-50 text-emerald-600", icon: <Svg className="h-4 w-4"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /><path d="m9 12 2 2 4-4" /></Svg> },
  application: { tone: "bg-violet-50 text-violet-600", icon: <Svg className="h-4 w-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Svg> },
  posted: { tone: "bg-blue-50 text-blue-600", icon: <Svg className="h-4 w-4"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></Svg> },
};
function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return <div className="px-5 py-10 text-center text-sm text-ink-500">最近の活動はありません。</div>;
  return (
    <ul className="divide-y divide-ink-200">
      {items.map((a, i) => {
        const c = ACT[a.type] ?? ACT.posted;
        return (
          <li key={i} className="flex gap-3 py-3.5">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${c.tone}`}>{c.icon}</span>
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
  if (items.length === 0) return <div className="py-10 text-center text-sm text-ink-500">現在お知らせはありません。</div>;
  return (
    <div className="space-y-2.5">
      {items.map((a) => (
        <div key={a.id} className="flex items-start gap-3 rounded-xl border border-ink-200 p-4 transition-colors hover:border-ink-300">
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
          <Ic d={CHEVRON} className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
        </div>
      ))}
    </div>
  );
}

const QUICK: { href: string; title: string; desc: string; card: string; tone: string; icon: ReactNode }[] = [
  { href: "/jobs/new", title: "案件を投稿する", desc: "新しい案件を掲載します", card: "border-blue-100 bg-blue-50/40 hover:bg-blue-50/70", tone: "bg-blue-100 text-blue-600", icon: <Svg className="h-4 w-4"><path d="M12 5v14M5 12h14" /></Svg> },
  { href: "/jobs", title: "案件を検索する", desc: "募集中の案件を検索します", card: "border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70", tone: "bg-emerald-100 text-emerald-600", icon: <Svg className="h-4 w-4"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg> },
  { href: "/my/applications", title: "応募履歴を見る", desc: "自社の応募状況を確認します", card: "border-violet-100 bg-violet-50/40 hover:bg-violet-50/70", tone: "bg-violet-100 text-violet-600", icon: <Svg className="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg> },
  { href: "/mypage", title: "マイページへ", desc: "会社情報や各種設定を行います", card: "border-orange-100 bg-orange-50/40 hover:bg-orange-50/70", tone: "bg-orange-100 text-orange-600", icon: <Svg className="h-4 w-4"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></Svg> },
];
function QuickActions() {
  return (
    <div className="space-y-2.5">
      {QUICK.map((q) => (
        <Link key={q.href} href={q.href} className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${q.card}`}>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${q.tone}`}>{q.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink-800">{q.title}</div>
            <div className="text-xs text-ink-500">{q.desc}</div>
          </div>
          <Ic d={CHEVRON} className="h-4 w-4 shrink-0 text-ink-400" />
        </Link>
      ))}
    </div>
  );
}
