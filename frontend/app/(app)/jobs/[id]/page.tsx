"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Job } from "@/lib/types";
import { Badge, Button, EmptyState, Spinner, Textarea } from "@/components/ui";
import { displayJobStatus, formatDate, formatDateTime, formatYen, luggageLayout, route } from "@/lib/format";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<{ data: Job }>(`/jobs/${id}`);
      setJob(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("created=1")) {
      setBanner("案件を掲載しました。他社からの応募をお待ちください。");
    }
  }, []);

  if (loading) return <div className="flex justify-center py-24 text-brand-600"><Spinner className="h-8 w-8" /></div>;
  if (notFound || !job) return <div className="card"><EmptyState title="案件が見つかりません" description="削除された、またはアクセス権のない案件です。" action={<Button variant="secondary" onClick={() => router.push("/jobs")}>案件一覧へ</Button>} /></div>;

  const st = displayJobStatus(job.status, job.application_deadline);
  const canApply = !job.is_owner && job.status === "recruiting" && !job.has_applied;

  return (
    <div className="animate-fade-in">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        一覧に戻る
      </button>

      {banner && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {banner}
        </div>
      )}
      {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="card p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-ink-900">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</h2>
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
          </div>
          <div className="text-sm text-ink-500">締切日：<span className="font-semibold text-ink-700">{formatDate(job.application_deadline)}</span></div>
        </div>

        {/* Body: details + attachments */}
        <div className="grid gap-8 pt-6 lg:grid-cols-[1.6fr_1fr]">
          <dl className="divide-y divide-ink-100">
            <Row label="引越予定日" value={formatDate(job.moving_date)} />
            <Row label="時間帯" value={job.time_slot ?? "指定なし"} />
            <Row label="荷物量 / 間取り" value={luggageLayout(job.layout, job.luggage_volume)} />
            <Row label="希望金額" value={<span className="text-base font-bold text-ink-900">{formatYen(job.desired_price)}</span>} />
            <Row label="建物種別" value={`${job.building_type}${job.has_elevator === null ? "" : job.has_elevator ? "（エレベーターあり）" : "（エレベーターなし）"}`} />
            {job.floors && <Row label="階数" value={job.floors} />}
            {job.worker_count && <Row label="必要人数" value={`${job.worker_count}名`} />}
            <Row label="備考" value={job.note ?? "—"} />
            <Row label="募集会社" value={job.company?.name ?? "—"} />
          </dl>

          <div>
            <div className="mb-2 text-sm font-semibold text-ink-700">添付画像 <span className="text-xs font-normal text-ink-400">(3枚まで)</span></div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50 text-ink-300">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 17l5-4 3 2 5-4 5 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-400">※ 添付画像は成約後の詳細確認時に共有されます。</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-ink-100 pt-5">
          {job.is_owner ? (
            <>
              <OwnerActions job={job} onChanged={load} setError={setError} />
              <Link href={`/my/jobs/${job.id}/applications`} className="btn btn-primary">応募者一覧を見る</Link>
            </>
          ) : (
            <>
              <Button variant="secondary">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                お気に入りに追加
              </Button>
              {canApply ? (
                <Button onClick={() => setApplyOpen(true)}>応募する</Button>
              ) : job.has_applied ? (
                <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">応募済み</Badge>
              ) : (
                <span className="text-sm text-ink-500">募集を終了しています</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Customer info (only when authorized by API) */}
      {job.customer && (
        <div className="card mt-6 border-brand-200 bg-brand-50/40 p-6">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17a4 4 0 0 1 8 0" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <h2 className="text-base font-bold text-ink-900">顧客情報</h2>
            <Badge tone="bg-brand-100 text-brand-700 ring-brand-600/20">成約者のみ閲覧可</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Row label="顧客氏名" value={<span className="font-bold">{job.customer.name}</span>} inline />
            <Row label="電話番号" value={<span className="font-bold">{job.customer.phone}</span>} inline />
            <div className="sm:col-span-2"><Row label="詳細住所" value={job.customer.address} inline /></div>
            {job.customer.contact_note && <div className="sm:col-span-2"><Row label="連絡事項" value={job.customer.contact_note} inline /></div>}
          </dl>
        </div>
      )}

      {applyOpen && <ApplyModal jobId={job.id} onClose={() => setApplyOpen(false)} onApplied={() => { setApplyOpen(false); load(); }} setError={setError} />}
    </div>
  );
}

function Row({ label, value, inline }: { label: string; value: React.ReactNode; inline?: boolean }) {
  if (inline) {
    return (
      <div>
        <dt className="text-xs text-ink-400">{label}</dt>
        <dd className="mt-0.5 text-sm text-ink-800">{value}</dd>
      </div>
    );
  }
  return (
    <div className="flex gap-4 py-3">
      <dt className="w-28 shrink-0 text-sm text-ink-500">{label}</dt>
      <dd className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-ink-800">{value}</dd>
    </div>
  );
}

function OwnerActions({ job, onChanged, setError }: { job: Job; onChanged: () => void; setError: (s: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  async function act(path: string, msg: string) {
    if (!confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/jobs/${job.id}/${path}`, { method: "POST" });
      onChanged();
    } catch {
      setError("処理に失敗しました。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {job.status === "contracted" && <Button variant="secondary" loading={busy} onClick={() => act("complete", "この案件を完了にしますか？")}>完了登録</Button>}
      {(job.status === "recruiting" || job.status === "contracted") && <Button variant="danger" loading={busy} onClick={() => act("cancel", "この案件をキャンセルしますか？")}>キャンセル</Button>}
    </>
  );
}

function ApplyModal({ jobId, onClose, onApplied, setError }: { jobId: number; onClose: () => void; onApplied: () => void; setError: (s: string | null) => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try {
      await api(`/jobs/${jobId}/apply`, { method: "POST", body: { message } });
      onApplied();
    } catch (err) {
      const m = err instanceof ApiError ? ((err.body as { errors?: Record<string, string[]>; message?: string }).errors?.job?.[0] ?? (err.body as { message?: string }).message) : null;
      setError(m ?? "応募に失敗しました。");
      onClose();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-ink-900">この案件に応募する</h3>
        <p className="mt-1 text-sm text-ink-500">掲載会社へのメッセージを添えて応募できます（任意）。</p>
        <Textarea rows={4} className="mt-4" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="対応可能な日程や実績など" />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>キャンセル</Button>
          <Button loading={busy} onClick={submit}>応募する</Button>
        </div>
      </div>
    </div>
  );
}
