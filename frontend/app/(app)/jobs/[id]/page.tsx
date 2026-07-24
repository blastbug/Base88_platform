"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Application, Job } from "@/lib/types";
import { Badge, Button, EmptyState, Spinner, Textarea } from "@/components/ui";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  deadlineLabel,
  formatDate,
  formatDateTime,
  formatYen,
  route,
} from "@/lib/format";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ data: Job }>(`/jobs/${id}`);
      setJob(res.data);
      if (res.data.is_owner) {
        const apps = await api<{ data: Application[] }>(`/jobs/${id}/applications`);
        setApplications(apps.data);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("created=1")) {
      setBanner("案件を掲載しました。他社からの応募をお待ちください。");
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (notFound || !job) {
    return <EmptyState title="案件が見つかりません" description="削除された、またはアクセス権のない案件です。" action={<Button variant="secondary" onClick={() => router.push("/jobs")}>案件一覧へ</Button>} />;
  }

  const dl = deadlineLabel(job.application_deadline);

  return (
    <div className="animate-fade-in">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        戻る
      </button>

      {banner && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {banner}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
              {job.is_owner && <Badge tone="bg-ink-100 text-ink-600 ring-ink-500/20">自社の案件</Badge>}
              {job.status === "recruiting" && (
                <span className={`ml-auto text-sm font-semibold ${dl.urgent ? "text-rose-600" : "text-ink-500"}`}>締切まで {dl.text}</span>
              )}
            </div>
            <h1 className="mt-3 text-xl font-bold text-ink-900 sm:text-2xl">
              {route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}
            </h1>
            <div className="mt-1 text-sm text-ink-500">掲載会社：{job.company?.name ?? "—"}</div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Detail label="引越日" value={formatDate(job.moving_date)} />
              <Detail label="時間帯" value={job.time_slot ?? "指定なし"} />
              <Detail label="希望金額" value={formatYen(job.desired_price)} strong />
              <Detail label="建物種別" value={job.building_type} />
              <Detail label="間取り" value={job.layout ?? "—"} />
              <Detail label="階数" value={job.floors ?? "—"} />
              <Detail label="エレベーター" value={job.has_elevator === null ? "不明" : job.has_elevator ? "あり" : "なし"} />
              <Detail label="荷物量" value={job.luggage_volume} />
              <Detail label="トラックサイズ" value={job.truck_size ?? "—"} />
              <Detail label="必要人数" value={job.worker_count ? `${job.worker_count}名` : "—"} />
              <Detail label="応募締切" value={formatDateTime(job.application_deadline)} />
            </dl>

            {job.note && (
              <div className="mt-6 rounded-lg bg-ink-50 p-4">
                <div className="text-xs font-semibold text-ink-500">備考・注意事項</div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{job.note}</p>
              </div>
            )}
          </div>

          {/* Customer info — only present when API authorizes it */}
          {job.customer && (
            <div className="card border-brand-200 bg-brand-50/40 p-6">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17a4 4 0 0 1 8 0" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <h2 className="text-base font-bold text-ink-900">顧客情報</h2>
                <Badge tone="bg-brand-100 text-brand-700 ring-brand-600/20">成約者のみ閲覧可</Badge>
              </div>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Detail label="顧客氏名" value={job.customer.name} strong />
                <Detail label="電話番号" value={job.customer.phone} strong />
                <div className="sm:col-span-2"><Detail label="詳細住所" value={job.customer.address} /></div>
                {job.customer.contact_note && <div className="sm:col-span-2"><Detail label="連絡事項" value={job.customer.contact_note} /></div>}
              </dl>
            </div>
          )}

          {/* Owner: applications */}
          {job.is_owner && (
            <OwnerApplications job={job} applications={applications} onChanged={load} setError={setActionError} />
          )}
        </div>

        {/* Sidebar action */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            {actionError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div>
            )}
            {job.is_owner ? (
              <OwnerActions job={job} onChanged={load} setError={setActionError} />
            ) : (
              <ApplyPanel job={job} onApplied={load} setError={setActionError} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className={`mt-0.5 break-words ${strong ? "text-base font-bold text-ink-900" : "text-sm font-medium text-ink-700"}`}>{value}</dd>
    </div>
  );
}

/* ---------- Apply (receiving side) ---------- */
function ApplyPanel({ job, onApplied, setError }: { job: Job; onApplied: () => void; setError: (s: string | null) => void }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (job.status !== "recruiting") {
    return (
      <div className="card p-6 text-center">
        <div className="text-sm font-semibold text-ink-700">この案件は募集を終了しています</div>
        <p className="mt-1 text-xs text-ink-500">現在、新規の応募はできません。</p>
      </div>
    );
  }

  if (job.has_applied) {
    return (
      <div className="card border-emerald-200 bg-emerald-50/50 p-6 text-center">
        <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div className="mt-2 text-sm font-semibold text-emerald-800">応募済みです</div>
        <p className="mt-1 text-xs text-ink-500">掲載会社の選定をお待ちください。</p>
      </div>
    );
  }

  async function apply() {
    setSubmitting(true);
    setError(null);
    try {
      await api(`/jobs/${job.id}/apply`, { method: "POST", body: { message } });
      onApplied();
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { errors?: Record<string, string[]>; message?: string }).errors?.job?.[0] ?? (err.body as { message?: string }).message) : null;
      setError(msg ?? "応募に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-ink-900">この案件に応募する</h2>
      <p className="mt-1 text-xs text-ink-500">掲載会社にメッセージを添えて応募できます。</p>
      <div className="mt-4">
        <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="対応可能な日程や実績など（任意）" />
      </div>
      <Button onClick={apply} loading={submitting} className="mt-4 w-full">
        応募する
      </Button>
    </div>
  );
}

/* ---------- Owner actions ---------- */
function OwnerActions({ job, onChanged, setError }: { job: Job; onChanged: () => void; setError: (s: string | null) => void }) {
  const [busy, setBusy] = useState(false);

  async function act(path: string, confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/jobs/${job.id}/${path}`, { method: "POST" });
      onChanged();
    } catch (err) {
      const msg = err instanceof ApiError ? (err.body as { errors?: Record<string, string[]> }).errors?.status?.[0] : null;
      setError(msg ?? "処理に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-ink-900">案件の管理</h2>
      <p className="mt-1 text-xs text-ink-500">
        {job.status === "recruiting" && "応募一覧から依頼先を決定できます。"}
        {job.status === "contracted" && "成約済みです。作業完了後に完了登録できます。"}
        {job.status === "completed" && "この案件は完了しています。"}
        {job.status === "cancelled" && "この案件はキャンセルされています。"}
      </p>
      <div className="mt-4 space-y-2">
        {job.status === "contracted" && (
          <Button variant="primary" loading={busy} onClick={() => act("complete", "この案件を完了にしますか？")} className="w-full">完了登録する</Button>
        )}
        {(job.status === "recruiting" || job.status === "contracted") && (
          <Button variant="danger" loading={busy} onClick={() => act("cancel", "この案件をキャンセルしますか？")} className="w-full">キャンセルする</Button>
        )}
      </div>
    </div>
  );
}

function OwnerApplications({ job, applications, onChanged, setError }: { job: Job; applications: Application[]; onChanged: () => void; setError: (s: string | null) => void }) {
  const [busyId, setBusyId] = useState<number | null>(null);

  async function decide(applicationId: number, companyName?: string) {
    if (!confirm(`${companyName ?? "この会社"} を依頼先として決定しますか？\n決定後は他社への依頼・変更ができません。`)) return;
    setBusyId(applicationId);
    setError(null);
    try {
      await api(`/jobs/${job.id}/decide`, { method: "POST", body: { application_id: applicationId } });
      onChanged();
    } catch {
      setError("成約処理に失敗しました。");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink-900">応募会社</h2>
        <span className="text-sm text-ink-500">{applications.length} 件</span>
      </div>

      {applications.length === 0 ? (
        <p className="mt-4 rounded-lg bg-ink-50 px-4 py-8 text-center text-sm text-ink-500">まだ応募はありません。</p>
      ) : (
        <ul className="mt-4 divide-y divide-ink-100">
          {applications.map((app) => (
            <li key={app.id} className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-900">{app.company?.name}</span>
                  <Badge tone={APPLICATION_STATUS_TONE[app.status]}>{APPLICATION_STATUS_LABEL[app.status]}</Badge>
                </div>
                {app.company?.phone && <div className="text-xs text-ink-500">TEL: {app.company.phone}</div>}
                {app.message && <p className="mt-1 text-sm text-ink-600">{app.message}</p>}
                <div className="mt-1 text-[11px] text-ink-400">{formatDateTime(app.created_at)}</div>
              </div>
              {job.status === "recruiting" && (
                <Button loading={busyId === app.id} onClick={() => decide(app.id, app.company?.name)}>
                  依頼先に決定
                </Button>
              )}
              {app.status === "accepted" && (
                <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">成約</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
