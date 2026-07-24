"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Job, Paginated } from "@/lib/types";
import { Badge, Button, EmptyState, Pagination, SectionCard, Spinner } from "@/components/ui";
import { formatDate, formatYen, luggageLayout, route } from "@/lib/format";

export default function MyContractsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<Paginated<Job>>(`/my/contracts?page=${page}`)
      .then((res) => { if (!active) return; setJobs(res.data); setLastPage(res.meta?.last_page ?? 1); })
      .catch(() => { if (active) setError("成約履歴の取得に失敗しました。時間をおいて再度お試しください。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  return (
    <div className="animate-fade-in space-y-5">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <SectionCard title="成約した案件">
        {loading ? (
          <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-7 w-7" /></div>
        ) : jobs.length === 0 ? (
          <EmptyState title="成約した案件はまだありません" description="応募した案件が成約すると、ここに顧客情報とともに表示されます。" action={<Button variant="secondary" onClick={() => router.push("/jobs")}>案件を探す</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="dtable">
              <thead>
                <tr>
                  <th>引越予定日</th>
                  <th>出発地 → 到着地</th>
                  <th>荷物量 / 間取り</th>
                  <th>希望金額</th>
                  <th>掲載会社</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="whitespace-nowrap font-medium text-ink-800">{formatDate(job.moving_date)}</td>
                    <td className="font-medium text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</td>
                    <td className="text-ink-600">{luggageLayout(job.layout, job.luggage_volume)}</td>
                    <td className="whitespace-nowrap font-semibold text-ink-800">{formatYen(job.desired_price)}</td>
                    <td className="text-ink-600">{job.company?.name ?? "—"}</td>
                    <td className="text-right">
                      <Button size="sm" onClick={() => router.push(`/jobs/${job.id}`)}>顧客情報を確認</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      {!loading && jobs.length > 0 && <Pagination page={page} lastPage={lastPage} onPage={setPage} />}
    </div>
  );
}
