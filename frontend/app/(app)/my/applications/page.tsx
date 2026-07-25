"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Application, Paginated } from "@/lib/types";
import { Badge, Button, EmptyState, SectionCard, Spinner, Tabs } from "@/components/ui";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE, formatDate, formatDateTime, route } from "@/lib/format";

const TABS = [
  { key: "applied", label: "応募中" },
  { key: "accepted", label: "成約済み" },
  { key: "rejected", label: "不成立" },
];

export default function MyApplicationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState("applied");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<Paginated<Application>>("/my/applications")
      .then((res) => { if (active) setApps(res.data); })
      .catch(() => { if (active) setError("応募履歴の取得に失敗しました。時間をおいて再度お試しください。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => apps.filter((a) => a.status === tab), [apps, tab]);
  const counts = useMemo(() => ({
    applied: apps.filter((a) => a.status === "applied").length,
    accepted: apps.filter((a) => a.status === "accepted").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  }), [apps]);

  return (
    <div className="animate-fade-in space-y-5">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <SectionCard>
        <div className="px-4 pt-2">
          <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.key as keyof typeof counts] }))} active={tab} onChange={setTab} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-7 w-7" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="該当する応募はありません" description="「案件一覧」から気になる案件に応募できます。" action={<Button variant="secondary" onClick={() => router.push("/jobs")}>案件を探す</Button>} />
        ) : (
          <>
            {/* PC・タブレット: テーブル */}
            <div className="hidden overflow-x-auto md:block">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>出発地 → 到着地</th>
                    <th>応募日時</th>
                    <th>ステータス</th>
                    <th>結果</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => {
                    const job = app.job;
                    if (!job) return null;
                    return (
                      <tr key={app.id}>
                        <td className="font-medium text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</td>
                        <td className="whitespace-nowrap text-ink-600">{formatDateTime(app.created_at)}</td>
                        <td><Badge tone={APPLICATION_STATUS_TONE[app.status]}>{APPLICATION_STATUS_LABEL[app.status]}</Badge></td>
                        <td className="whitespace-nowrap text-ink-600">
                          {app.status === "accepted" ? `成約（${formatDate(job.moving_date)}）` : app.status === "rejected" ? "他社に成約" : "選定待ち"}
                        </td>
                        <td className="text-right">
                          <Button size="sm" variant="secondary" onClick={() => router.push(`/jobs/${job.id}`)}>詳細</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* スマホ: カード */}
            <ul className="divide-y divide-ink-100 md:hidden">
              {filtered.map((app) => {
                const job = app.job;
                if (!job) return null;
                return (
                  <li key={app.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={APPLICATION_STATUS_TONE[app.status]}>{APPLICATION_STATUS_LABEL[app.status]}</Badge>
                      <span className="text-xs text-ink-400">{formatDateTime(app.created_at)}</span>
                    </div>
                    <div className="mt-2 font-semibold text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-sm text-ink-500">
                        {app.status === "accepted" ? `成約（${formatDate(job.moving_date)}）` : app.status === "rejected" ? "他社に成約" : "選定待ち"}
                      </span>
                      <Button size="sm" variant="secondary" className="shrink-0" onClick={() => router.push(`/jobs/${job.id}`)}>詳細</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </SectionCard>
    </div>
  );
}
