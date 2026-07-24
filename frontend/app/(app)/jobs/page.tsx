"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Job, Paginated } from "@/lib/types";
import { JobCard } from "@/components/JobCard";
import { Button, EmptyState, Field, PageHeader, Select, Spinner } from "@/components/ui";
import { JOB_STATUS_LABEL, PREFECTURES } from "@/lib/format";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [prefecture, setPrefecture] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("recruiting");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (date) params.set("date", date);
    if (status) params.set("status", status);
    try {
      const res = await api<Paginated<Job>>(`/jobs?${params.toString()}`);
      setJobs(res.data);
      setTotal(res.meta?.total ?? res.data.length);
    } finally {
      setLoading(false);
    }
  }, [prefecture, date, status]);

  useEffect(() => {
    load();
  }, [load]);

  function reset() {
    setPrefecture("");
    setDate("");
    setStatus("recruiting");
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="案件を探す" description="条件を指定して、対応可能な引越案件を検索できます。" />

      {/* Search filters */}
      <div className="card mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="出発地（都道府県）">
            <Select value={prefecture} onChange={(e) => setPrefecture(e.target.value)}>
              <option value="">すべて</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="引越日">
            <input type="date" className="input-base" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="募集状況">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="recruiting">{JOB_STATUS_LABEL.recruiting}</option>
              <option value="">すべて</option>
              <option value="contracted">{JOB_STATUS_LABEL.contracted}</option>
              <option value="completed">{JOB_STATUS_LABEL.completed}</option>
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={reset} className="flex-1">
              条件をクリア
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm text-ink-500">
        {loading ? "検索中…" : `${total} 件の案件`}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600">
          <Spinner className="h-7 w-7" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState title="該当する案件がありません" description="検索条件を変更してお試しください。" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
