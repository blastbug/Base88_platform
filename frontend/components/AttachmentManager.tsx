"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Attachment, Job } from "@/lib/types";
import { Button } from "@/components/ui";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

/**
 * 添付ファイル管理（画像・PDF、最大3件）。
 * editable=true のとき追加・削除が可能。add/delete 後は最新一覧を取得して onChange に返す。
 */
export function AttachmentManager({
  jobId,
  items,
  onChange,
  editable = true,
}: {
  jobId: number;
  items: Attachment[];
  onChange: (items: Attachment[]) => void;
  editable?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const remaining = 3 - items.length;

  async function reload() {
    const res = await api<{ data: Job }>(`/jobs/${jobId}`);
    onChange(res.data.attachments ?? []);
  }

  async function onFiles(list: FileList | null) {
    setErr(null);
    if (!list || list.length === 0) return;
    const fd = new FormData();
    let added = 0;
    for (const f of Array.from(list).slice(0, remaining)) {
      if (!ACCEPT.includes(f.type)) { setErr("画像（JPG/PNG/WebP/GIF）またはPDFのみ添付できます。"); continue; }
      if (f.size > 10 * 1024 * 1024) { setErr("1ファイルあたり最大10MBです。"); continue; }
      fd.append("files[]", f);
      added++;
    }
    if (added === 0) return;
    setBusy(true);
    try {
      await api(`/jobs/${jobId}/attachments`, { method: "POST", body: fd });
      await reload();
    } catch (e) {
      const m = e instanceof ApiError ? ((e.body as { errors?: Record<string, string[]>; message?: string }).errors?.["files.0"]?.[0] ?? (e.body as { message?: string }).message) : null;
      setErr(m ?? "アップロードに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  async function del(mediaId: number) {
    if (!confirm("この添付ファイルを削除しますか？")) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/jobs/${jobId}/attachments/${mediaId}`, { method: "DELETE" });
      await reload();
    } catch {
      setErr("削除に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((a) => (
            <li key={a.id} className="relative">
              {a.is_image ? (
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-ink-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.name} className="aspect-[4/3] w-full object-cover" />
                </a>
              ) : (
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex aspect-[4/3] flex-col items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-500 hover:bg-ink-100">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span className="mt-1 max-w-[90%] truncate text-[11px]">{a.name}</span>
                </a>
              )}
              {editable && (
                <button type="button" onClick={() => del(a.id)} disabled={busy} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-500 shadow ring-1 ring-ink-200 hover:text-rose-600 disabled:opacity-50" aria-label="削除">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" /></svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !editable && <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50 text-sm text-ink-400">添付ファイルはありません</div>
      )}

      {editable && (
        <div className="mt-3">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          {remaining > 0 ? (
            <>
              <Button type="button" size="sm" variant="secondary" loading={busy} onClick={() => inputRef.current?.click()}>＋ 添付ファイルを追加</Button>
              <p className="mt-1.5 text-xs text-ink-400">残り{remaining}件・JPG / PNG / WebP / GIF / PDF・最大10MB</p>
            </>
          ) : (
            <p className="text-xs text-ink-400">添付は上限（3件）に達しています。不要なファイルを削除すると追加できます。</p>
          )}
        </div>
      )}
      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
    </div>
  );
}
