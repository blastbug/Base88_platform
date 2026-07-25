"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Job, Paginated } from "@/lib/types";
import { Badge, Button, EmptyState, Pagination, SectionCard, Select, Spinner } from "@/components/ui";
import { JOB_STATUS_LABEL, PREFECTURES, displayJobStatus, formatDate, formatYen, luggageLayout, route, shortDate } from "@/lib/format";

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // applied filters
  const [filters, setFilters] = useState({ prefecture: "", dateFrom: "", dateTo: "", status: "recruiting" });
  // draft (form) filters
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.prefecture) params.set("prefecture", filters.prefecture);
    if (filters.dateFrom) params.set("date_from", filters.dateFrom);
    if (filters.dateTo) params.set("date_to", filters.dateTo);
    if (filters.status) params.set("status", filters.status);
    params.set("page", String(page));
    api<Paginated<Job>>(`/jobs?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        setJobs(res.data);
        setLastPage(res.meta?.last_page ?? 1);
        setTotal(res.meta?.total ?? res.data.length);
      })
      .catch(() => { if (active) setError("案件の取得に失敗しました。時間をおいて再度お試しください。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, filters]);

  function search() {
    setFilters(draft);
    setPage(1);
  }
  function reset() {
    const cleared = { prefecture: "", dateFrom: "", dateTo: "", status: "recruiting" };
    setDraft(cleared);
    setFilters(cleared);
    setPage(1);
  }

  return (
    <div className="animate-fade-in space-y-5">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {/* Filter bar */}
      <div className="card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_1fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-500">都道府県</span>
            <Select value={draft.prefecture} onChange={(e) => setDraft({ ...draft, prefecture: e.target.value })}>
              <option value="">すべて</option>
              {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-500">引越予定日</span>
            <div className="flex items-center gap-2">
              <input type="date" className="input-base min-w-0" value={draft.dateFrom} onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })} />
              <span className="text-ink-400">〜</span>
              <input type="date" className="input-base min-w-0" value={draft.dateTo} onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })} />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-500">募集状況</span>
            <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              <option value="">すべて</option>
              <option value="recruiting">{JOB_STATUS_LABEL.recruiting}</option>
              <option value="closed">{JOB_STATUS_LABEL.closed}</option>
            </Select>
          </label>
          <div className="flex gap-2">
            <Button onClick={search}>検索</Button>
            <Button variant="secondary" onClick={reset}>リセット</Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <SectionCard>
        {loading ? (
          <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-7 w-7" /></div>
        ) : jobs.length === 0 ? (
          <EmptyState title="該当する案件がありません" description="検索条件を変更してお試しください。" />
        ) : (
          <div className="overflow-x-auto">
            <table className="dtable">
              <thead>
                <tr>
                  <th>引越予定日</th>
                  <th>出発地 → 到着地</th>
                  <th>荷物量 / 間取り</th>
                  <th>希望金額</th>
                  <th>募集状況</th>
                  <th>締切日</th>
                  <th className="text-right">詳細</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const st = displayJobStatus(job.status, job.application_deadline);
                  return (
                    <tr key={job.id}>
                      <td className="whitespace-nowrap font-medium text-ink-800">{formatDate(job.moving_date)}</td>
                      <td className="font-medium text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</td>
                      <td className="text-ink-600">{luggageLayout(job.layout, job.luggage_volume)}</td>
                      <td className="whitespace-nowrap font-semibold text-ink-800">{formatYen(job.desired_price)}</td>
                      <td><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="whitespace-nowrap text-ink-600">{shortDate(job.application_deadline)}</td>
                      <td className="text-right">
                        <Button size="sm" variant="secondary" onClick={() => router.push(`/jobs/${job.id}`)}>詳細</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {!loading && jobs.length > 0 && (
        <>
          <Pagination page={page} lastPage={lastPage} onPage={setPage} />
          <p className="text-center text-xs text-ink-400">全 {total} 件</p>
        </>
      )}
    </div>
  );
}
