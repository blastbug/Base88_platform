"use client";

import Link from "next/link";
import type { Job } from "@/lib/types";
import { Badge } from "@/components/ui";
import {
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  deadlineLabel,
  formatDate,
  formatYen,
  route,
} from "@/lib/format";

export function JobCard({ job }: { job: Job }) {
  const dl = deadlineLabel(job.application_deadline);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="card group block p-5 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
            {job.is_owner && (
              <Badge tone="bg-ink-100 text-ink-600 ring-ink-500/20">自社</Badge>
            )}
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-ink-900 group-hover:text-brand-700">
            {route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-ink-900">{formatYen(job.desired_price)}</div>
          <div className="text-[11px] text-ink-400">希望金額</div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Meta label="引越日" value={formatDate(job.moving_date)} />
        <Meta label="建物" value={job.building_type} />
        <Meta label="荷物量" value={job.luggage_volume} />
        <Meta label="トラック" value={job.truck_size ?? "—"} />
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-xs">
        <span className="text-ink-500">
          {job.company?.name ?? "—"}
          {typeof job.applications_count === "number" && (
            <span className="ml-2 text-ink-400">応募 {job.applications_count}件</span>
          )}
        </span>
        {job.status === "recruiting" && (
          <span className={`font-semibold ${dl.urgent ? "text-rose-600" : "text-ink-500"}`}>
            {dl.text}
          </span>
        )}
      </div>
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-ink-400">{label}</dt>
      <dd className="truncate font-medium text-ink-700">{value}</dd>
    </div>
  );
}
