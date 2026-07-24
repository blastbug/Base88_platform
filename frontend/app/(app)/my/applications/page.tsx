"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Application, Paginated } from "@/lib/types";
import { Badge, EmptyState, LinkButton, PageHeader, Spinner } from "@/components/ui";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  formatDate,
  formatDateTime,
  formatYen,
  route,
} from "@/lib/format";

export default function MyApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated<Application>>("/my/applications")
      .then((res) => setApps(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="応募履歴" description="自社が応募した案件の状況を確認できます。成約した案件は詳細から顧客情報を確認できます。" />

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-7 w-7" /></div>
      ) : apps.length === 0 ? (
        <EmptyState title="応募履歴はまだありません" description="案件を探して応募してみましょう。" action={<LinkButton href="/jobs">案件を探す</LinkButton>} />
      ) : (
        <div className="card divide-y divide-ink-100">
          {apps.map((app) => {
            const job = app.job;
            if (!job) return null;
            return (
              <Link key={app.id} href={`/jobs/${job.id}`} className="flex flex-wrap items-center gap-4 p-5 transition-colors hover:bg-ink-50">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={APPLICATION_STATUS_TONE[app.status]}>{APPLICATION_STATUS_LABEL[app.status]}</Badge>
                    <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
                    {app.status === "accepted" && (
                      <span className="text-xs font-semibold text-emerald-600">▶ 顧客情報を確認できます</span>
                    )}
                  </div>
                  <div className="mt-1.5 truncate font-semibold text-ink-900">
                    {route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    引越日 {formatDate(job.moving_date)} ・ 掲載 {job.company?.name ?? "—"} ・ 応募日 {formatDateTime(app.created_at)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-ink-900">{formatYen(job.desired_price)}</div>
                  <div className="text-[11px] text-ink-400">希望金額</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
