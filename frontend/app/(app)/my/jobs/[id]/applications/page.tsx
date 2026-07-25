"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Application, Job } from "@/lib/types";
import { Badge, Button, EmptyState, SectionCard, Spinner } from "@/components/ui";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE, formatDateTime, route, shortDate } from "@/lib/format";

export default function ApplicantsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [j, a] = await Promise.all([
        api<{ data: Job }>(`/jobs/${id}`),
        api<{ data: Application[] }>(`/jobs/${id}/applications`),
      ]);
      setJob(j.data);
      setApps(a.data);
    } catch {
      setError("応募情報の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function decide(appId: number, name?: string) {
    if (!confirm(`${name ?? "この会社"} を依頼先として決定しますか？\n決定後は他社への依頼・変更ができません。`)) return;
    setBusyId(appId);
    setError(null);
    try {
      await api(`/jobs/${id}/decide`, { method: "POST", body: { application_id: appId } });
      await load();
    } catch (e) {
      const m = e instanceof ApiError ? (e.body as { errors?: Record<string, string[]> }).errors?.status?.[0] : null;
      setError(m ?? "成約処理に失敗しました。");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="flex justify-center py-24 text-brand-600"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="animate-fade-in space-y-5">
      <button onClick={() => router.push("/my/jobs")} className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        自社案件一覧に戻る
      </button>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <SectionCard
        title={job ? `応募者一覧：${route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}（${shortDate(job.moving_date)}）` : "応募者一覧"}
      >
        {apps.length === 0 ? (
          <EmptyState title="まだ応募はありません" description="他社からの応募が入るとここに表示されます。" />
        ) : (
          <>
            {/* PC・タブレット: テーブル */}
            <div className="hidden overflow-x-auto md:block">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>会社名</th>
                    <th>応募日時</th>
                    <th>メッセージ</th>
                    <th>ステータス</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app.id}>
                      <td className="whitespace-nowrap font-semibold text-ink-800">{app.company?.name}</td>
                      <td className="whitespace-nowrap text-ink-600">{formatDateTime(app.created_at)}</td>
                      <td className="max-w-xs text-ink-600">{app.message ?? "—"}</td>
                      <td><Badge tone={APPLICATION_STATUS_TONE[app.status]}>{APPLICATION_STATUS_LABEL[app.status]}</Badge></td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => router.push(`/jobs/${id}`)}>詳細</Button>
                          {job?.status === "recruiting" && app.status === "applied" && (
                            <Button size="sm" loading={busyId === app.id} onClick={() => decide(app.id, app.company?.name)}>成約にする</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* スマホ: カード */}
            <ul className="divide-y divide-ink-100 md:hidden">
              {apps.map((app) => (
                <li key={app.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-ink-800">{app.company?.name}</span>
                    <Badge tone={APPLICATION_STATUS_TONE[app.status]}>{APPLICATION_STATUS_LABEL[app.status]}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-400">{formatDateTime(app.created_at)}</div>
                  {app.message && <p className="mt-2 whitespace-pre-wrap text-sm text-ink-600">{app.message}</p>}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => router.push(`/jobs/${id}`)}>詳細</Button>
                    {job?.status === "recruiting" && app.status === "applied" && (
                      <Button size="sm" className="flex-1" loading={busyId === app.id} onClick={() => decide(app.id, app.company?.name)}>成約にする</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="border-t border-ink-100 px-5 py-3 text-xs text-ink-500">
          ※ 成約を確定すると、他の会社は案件・詳細情報を閲覧できなくなります。
        </div>
      </SectionCard>
    </div>
  );
}
