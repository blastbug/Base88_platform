"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Job, Paginated } from "@/lib/types";
import { Badge, Button, EmptyState, Select, Spinner } from "@/components/ui";
import { formatDate, formatDateDow, jobCode, listJobStatus, luggageLayout, route } from "@/lib/format";

const LAYOUT_OPTIONS = ["1LDK", "2LDK", "3LDK", "4LDK"];
const SORT_OPTIONS: { v: string; l: string }[] = [
  { v: "new", l: "新しい順" },
  { v: "old", l: "古い順" },
  { v: "moving_asc", l: "引越日が近い順" },
  { v: "moving_desc", l: "引越日が遠い順" },
  { v: "deadline", l: "締切が近い順" },
];

// 加盟店の案件一覧は「募集中」のみ表示するため、募集状況フィルタは廃止。
const EMPTY = { keyword: "", dateFrom: "", dateTo: "", layout: "" };

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);

  const [filters, setFilters] = useState({ ...EMPTY });
  const [draft, setDraft] = useState({ ...EMPTY });
  const [sort, setSort] = useState("new");

  function buildParams(p: number, f: typeof EMPTY, s: string) {
    const q = new URLSearchParams();
    if (f.keyword) q.set("keyword", f.keyword);
    if (f.dateFrom) q.set("date_from", f.dateFrom);
    if (f.dateTo) q.set("date_to", f.dateTo);
    if (f.layout) q.set("layout", f.layout);
    if (s) q.set("sort", s);
    q.set("page", String(p));
    return q.toString();
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api<Paginated<Job>>(`/jobs?${buildParams(page, filters, sort)}`)
      .then((res) => {
        if (!active) return;
        setJobs(res.data);
        setLastPage(res.meta?.last_page ?? 1);
        setTotal(res.meta?.total ?? res.data.length);
      })
      .catch(() => { if (active) setError("案件の取得に失敗しました。時間をおいて再度お試しください。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, filters, sort]);

  function search() { setFilters({ ...draft }); setPage(1); }
  function reset() { setDraft({ ...EMPTY }); setFilters({ ...EMPTY }); setSort("new"); setPage(1); }
  function changeSort(v: string) { setSort(v); setPage(1); }
  function toggleDateSort() { changeSort(sort === "moving_asc" ? "moving_desc" : "moving_asc"); }

  async function downloadCsv() {
    setCsvBusy(true);
    try {
      const all: Job[] = [];
      const last = lastPage;
      for (let p = 1; p <= last; p++) {
        const res = await api<Paginated<Job>>(`/jobs?${buildParams(p, filters, sort)}`);
        all.push(...res.data);
      }
      const header = ["案件ID", "引越予定日", "引越予定時間", "出発地", "到着地", "荷物量/間取り", "募集状況", "締切日"];
      const rows = all.map((j) => [
        jobCode(j.id, j.moving_date, j.job_code),
        formatDate(j.moving_date),
        j.time_slot ?? "指定なし",
        `${j.from_prefecture}${j.from_city ?? ""}`,
        `${j.to_prefecture}${j.to_city ?? ""}`,
        luggageLayout(j.layout, j.luggage_volume),
        listJobStatus(j.status, j.application_deadline).label,
        formatDate(j.application_deadline),
      ]);
      const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "案件一覧.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("CSVの生成に失敗しました。");
    } finally {
      setCsvBusy(false);
    }
  }

  const dateSortActive = sort === "moving_asc" || sort === "moving_desc";

  return (
    <div className="animate-fade-in space-y-5">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {/* Filter bar */}
      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-4">
            <Field label="キーワード">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Ic className="h-4 w-4 text-ink-400"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Ic>
                </span>
                <input
                  className="input-base pl-9"
                  placeholder="出発地・到着地・案件IDで検索"
                  value={draft.keyword}
                  onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                />
              </div>
            </Field>
          </div>
          <Field label="引越予定日">
            <DateRangeField from={draft.dateFrom} to={draft.dateTo} onFrom={(v) => setDraft({ ...draft, dateFrom: v })} onTo={(v) => setDraft({ ...draft, dateTo: v })} />
          </Field>
          <Field label="荷物量 / 間取り">
            <Select value={draft.layout} onChange={(e) => setDraft({ ...draft, layout: e.target.value })}>
              <option value="">すべて</option>
              {LAYOUT_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
          <Field label="並び順">
            <Select value={sort} onChange={(e) => changeSort(e.target.value)}>
              {SORT_OPTIONS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </Select>
          </Field>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:flex sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto sm:min-w-[7rem]" onClick={reset}>リセット</Button>
          <Button className="w-full sm:w-auto sm:min-w-[7rem]" onClick={search}>検索</Button>
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-4 sm:px-5">
          <div className="text-sm font-bold text-ink-800">全 <span className="text-brand-600">{total}</span> 件</div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" loading={csvBusy} onClick={downloadCsv}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              CSVダウンロード
            </Button>
            <div className="hidden sm:block"><Pager page={page} lastPage={lastPage} onPage={setPage} /></div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-7 w-7" /></div>
        ) : jobs.length === 0 ? (
          <EmptyState title="該当する案件がありません" description="検索条件を変更してお試しください。" />
        ) : (
          <>
            {/* PC・タブレット: テーブル */}
            <div className="mx-5 mb-5 mt-4 hidden overflow-x-auto rounded-lg border border-ink-200 md:block">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>案件ID</th>
                    <th>
                      <button onClick={toggleDateSort} className="inline-flex items-center gap-1 font-semibold hover:text-ink-700">
                        引越予定日
                        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${dateSortActive ? "text-brand-600" : "text-ink-400"}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 15 5 5 5-5M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </th>
                    <th>出発地 → 到着地</th>
                    <th>荷物量 / 間取り</th>
                    <th>募集状況</th>
                    <th>締切日</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const st = listJobStatus(job.status, job.application_deadline);
                    return (
                      <tr key={job.id}>
                        <td className="whitespace-nowrap">
                          <Link href={`/jobs/${job.id}`} className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">{jobCode(job.id, job.moving_date, job.job_code)}</Link>
                        </td>
                        <td className="whitespace-nowrap font-medium text-ink-800">
                          {formatDateDow(job.moving_date)}
                          {job.time_slot && <span className="mt-0.5 block text-xs font-normal text-ink-500">{job.time_slot}</span>}
                        </td>
                        <td className="font-medium text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</td>
                        <td className="text-ink-600">{luggageLayout(job.layout, job.luggage_volume)}</td>
                        <td><Badge tone={st.tone}>{st.label}</Badge></td>
                        <td className="whitespace-nowrap text-ink-600">{formatDate(job.application_deadline)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => router.push(`/jobs/${job.id}`)}>詳細</Button>
                            <RowMenu code={jobCode(job.id, job.moving_date, job.job_code)} onDetail={() => router.push(`/jobs/${job.id}`)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* スマホ: カード */}
            <ul className="divide-y divide-ink-100 md:hidden">
              {jobs.map((job) => {
                const st = listJobStatus(job.status, job.application_deadline);
                return (
                  <li key={job.id}>
                    <button onClick={() => router.push(`/jobs/${job.id}`)} className="flex w-full items-center gap-2 px-4 py-4 text-left transition-colors hover:bg-ink-50">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="whitespace-nowrap font-mono text-sm font-bold text-brand-600">{jobCode(job.id, job.moving_date, job.job_code)}</span>
                          <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                            <Badge tone={st.tone}>{st.label}</Badge>
                            <span className="text-xs text-ink-400">締切日 {formatDate(job.application_deadline)}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-ink-700">
                          <Ic className="h-4 w-4 shrink-0 text-ink-400"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></Ic>
                          {formatDateDow(job.moving_date)}
                          {job.time_slot && <span className="text-ink-400">・{job.time_slot}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-ink-700">
                          <Ic className="h-4 w-4 shrink-0 text-ink-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" /><circle cx="12" cy="10" r="3" /></Ic>
                          <span className="min-w-0 truncate">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-ink-600">
                          <Ic className="h-4 w-4 shrink-0 text-ink-400"><path d="m7.5 4.3 9 5.2M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" /></Ic>
                          {luggageLayout(job.layout, job.luggage_volume)}
                        </div>
                      </div>
                      <Ic className="h-5 w-5 shrink-0 text-ink-300"><path d="m9 18 6-6-6-6" /></Ic>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {!loading && jobs.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <Pager page={page} lastPage={lastPage} onPage={setPage} />
          <p className="text-center text-xs text-ink-400">全 {total} 件</p>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
    </label>
  );
}

function Ic({ children, className = "h-4 w-4 shrink-0 text-ink-400" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

/** コンパクトな日付レンジ入力（カレンダーアイコン＋「開始日 〜 終了日」。タップでポップオーバー） */
function DateRangeField({ from, to, onFrom, onTo }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const has = from || to;
  const fmt = (s: string) => (s ? s.replace(/-/g, "/") : "");
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="input-base flex w-full items-center gap-2 text-left">
        <Ic className="h-4 w-4 shrink-0 text-ink-400"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></Ic>
        <span className={`truncate text-sm ${has ? "text-ink-800" : "text-ink-400"}`}>
          {has ? `${from ? fmt(from) : "開始日"} 〜 ${to ? fmt(to) : "終了日"}` : "開始日 〜 終了日"}
        </span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 w-64 max-w-[calc(100vw-2.5rem)] rounded-xl border border-ink-200 bg-white p-3 shadow-lg">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-500">開始日</span>
            <input type="date" className="input-base" value={from} onChange={(e) => onFrom(e.target.value)} />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-ink-500">終了日</span>
            <input type="date" className="input-base" value={to} onChange={(e) => onTo(e.target.value)} />
          </label>
          <div className="mt-3 flex items-center justify-end gap-3">
            <button type="button" onClick={() => { onFrom(""); onTo(""); }} className="text-xs font-medium text-ink-500 hover:text-ink-700">クリア</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** ページネーション（前/番号/次） */
function Pager({ page, lastPage, onPage }: { page: number; lastPage: number; onPage: (p: number) => void }) {
  if (lastPage <= 1) return null;
  const pages: (number | "…")[] = [];
  pages.push(1);
  const start = Math.max(2, page - 1);
  const end = Math.min(lastPage - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < lastPage - 1) pages.push("…");
  if (lastPage > 1) pages.push(lastPage);

  const btn = "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm transition-colors";
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={`${btn} border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-40`}>‹</button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-sm text-ink-400">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)} className={`${btn} ${p === page ? "border-brand-600 bg-brand-600 font-semibold text-white" : "border-ink-200 text-ink-600 hover:bg-ink-50"}`}>{p}</button>
        )
      )}
      <button onClick={() => onPage(page + 1)} disabled={page >= lastPage} className={`${btn} border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-40`}>›</button>
    </div>
  );
}

/** 行のケバブメニュー（詳細を見る／案件IDをコピー） */
function RowMenu({ code, onDetail }: { code: string; onDetail: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function copyCode() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* noop */ }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600" aria-label="操作メニュー">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 text-left shadow-lg">
          <button onClick={() => { setOpen(false); onDetail(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" /></svg>
            詳細を見る
          </button>
          <button onClick={copyCode} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {copied ? "コピーしました" : "案件IDをコピー"}
          </button>
        </div>
      )}
    </div>
  );
}
