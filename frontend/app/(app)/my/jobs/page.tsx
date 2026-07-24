"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Job, Paginated } from "@/lib/types";
import { Badge, Button, EmptyState, LinkButton, Pagination, SectionCard, Spinner, Tabs } from "@/components/ui";
import { displayJobStatus, formatDate, formatYen, luggageLayout, route } from "@/lib/format";

const TABS = [
  { key: "recruiting", label: "掲載中" },
  { key: "contracted", label: "成約済み" },
  { key: "completed", label: "完了" },
  { key: "cancelled", label: "キャンセル" },
];

export default function MyJobsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("recruiting");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (status: string, p: number) => {
    setLoading(true);
    try {
      const res = await api<Paginated<Job>>(`/my/jobs?status=${status}&page=${p}`);
      setJobs(res.data);
      setLastPage(res.meta?.last_page ?? 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab, page); }, [load, tab, page]);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div />
        <LinkButton href="/jobs/new">＋ 案件を投稿</LinkButton>
      </div>

      <SectionCard>
        <div className="px-4 pt-2">
          <Tabs tabs={TABS} active={tab} onChange={(k) => { setTab(k); setPage(1); }} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-7 w-7" /></div>
        ) : jobs.length === 0 ? (
          <EmptyState title="該当する案件はありません" description="「案件を投稿」から新しい案件を掲載できます。" action={<LinkButton href="/jobs/new">案件を投稿する</LinkButton>} />
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
                  <th className="text-center">応募数</th>
                  <th className="text-right">操作</th>
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
                      <td className="text-center font-semibold text-ink-800">{job.applications_count ?? 0}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => router.push(`/jobs/${job.id}`)}>詳細</Button>
                          <Button size="sm" onClick={() => router.push(`/my/jobs/${job.id}/applications`)}>応募一覧</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {!loading && jobs.length > 0 && <Pagination page={page} lastPage={lastPage} onPage={setPage} />}
    </div>
  );
}
