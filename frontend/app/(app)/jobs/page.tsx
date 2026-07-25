"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Job, Paginated } from "@/lib/types";
import { Badge, Button, EmptyState, Select, Spinner } from "@/components/ui";
import { formatDate, formatDateDow, jobCode, listJobStatus, luggageLayout, route, shortDate } from "@/lib/format";

const STATUS_OPTIONS: { v: string; l: string }[] = [
  { v: "", l: "すべて" },
  { v: "recruiting", l: "募集中" },
  { v: "closed", l: "募集終了" },
  { v: "contracted", l: "成約済" },
  { v: "completed", l: "完了" },
];
const LAYOUT_OPTIONS = ["1LDK", "2LDK", "3LDK", "4LDK"];
const SORT_OPTIONS: { v: string; l: string }[] = [
  { v: "new", l: "新しい順" },
  { v: "old", l: "古い順" },
  { v: "moving_asc", l: "引越日が近い順" },
  { v: "moving_desc", l: "引越日が遠い順" },
  { v: "deadline", l: "締切が近い順" },
  { v: "applications", l: "応募が多い順" },
];

const EMPTY = { keyword: "", dateFrom: "", dateTo: "", layout: "", status: "" };

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
    if (f.status) q.set("status", f.status);
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
      const header = ["案件ID", "引越予定日", "出発地", "到着地", "荷物量/間取り", "募集状況", "締切日", "応募数"];
      const rows = all.map((j) => [
        jobCode(j.id, j.moving_date),
        formatDate(j.moving_date),
        `${j.from_prefecture}${j.from_city ?? ""}`,
        `${j.to_prefecture}${j.to_city ?? ""}`,
        luggageLayout(j.layout, j.luggage_volume),
        listJobStatus(j.status, j.application_deadline).label,
        formatDate(j.application_deadline),
        `${j.applications_count ?? 0}社`,
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
      <div className="card p-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <Field label="キーワード">
            <div className="relative">
              <input
                className="input-base pr-9"
                placeholder="出発地・到着地・案件IDで検索"
                value={draft.keyword}
                onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </Field>
          <Field label="引越予定日">
            <div className="flex items-center gap-2">
              <input type="date" className="input-base min-w-0" value={draft.dateFrom} onChange={(e) => setDraft({ ...draft, dateFrom: e.target.value })} />
              <span className="shrink-0 text-ink-400">〜</span>
              <input type="date" className="input-base min-w-0" value={draft.dateTo} onChange={(e) => setDraft({ ...draft, dateTo: e.target.value })} />
            </div>
          </Field>
          <Field label="荷物量 / 間取り">
            <Select value={draft.layout} onChange={(e) => setDraft({ ...draft, layout: e.target.value })}>
              <option value="">すべて</option>
              {LAYOUT_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
          <Field label="募集状況">
            <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              {STATUS_OPTIONS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </Select>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">並び順</span>
            <Select className="min-w-[12rem]" value={sort} onChange={(e) => changeSort(e.target.value)}>
              {SORT_OPTIONS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </Select>
          </label>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={reset}>リセット</Button>
            <Button onClick={search}>検索</Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="text-sm font-bold text-ink-800">全 <span className="text-brand-600">{total}</span> 件</div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" loading={csvBusy} onClick={downloadCsv}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              CSVダウンロード
            </Button>
            <Pager page={page} lastPage={lastPage} onPage={setPage} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-7 w-7" /></div>
        ) : jobs.length === 0 ? (
          <EmptyState title="該当する案件がありません" description="検索条件を変更してお試しください。" />
        ) : (
          <>
            {/* PC・タブレット: テーブル */}
            <div className="hidden overflow-x-auto md:block">
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
                    <th className="text-center">応募数</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const st = listJobStatus(job.status, job.application_deadline);
                    return (
                      <tr key={job.id}>
                        <td className="whitespace-nowrap">
                          <Link href={`/jobs/${job.id}`} className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">{jobCode(job.id, job.moving_date)}</Link>
                        </td>
                        <td className="whitespace-nowrap font-medium text-ink-800">{formatDateDow(job.moving_date)}</td>
                        <td className="font-medium text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</td>
                        <td className="text-ink-600">{luggageLayout(job.layout, job.luggage_volume)}</td>
                        <td><Badge tone={st.tone}>{st.label}</Badge></td>
                        <td className="whitespace-nowrap text-ink-600">{formatDate(job.application_deadline)}</td>
                        <td className="text-center font-medium text-ink-700">{job.applications_count ?? 0} 社</td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => router.push(`/jobs/${job.id}`)}>詳細</Button>
                            <RowMenu code={jobCode(job.id, job.moving_date)} onDetail={() => router.push(`/jobs/${job.id}`)} />
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
                    <button onClick={() => router.push(`/jobs/${job.id}`)} className="block w-full px-4 py-3.5 text-left transition-colors hover:bg-ink-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-brand-600">{jobCode(job.id, job.moving_date)}</span>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <div className="mt-1.5 font-semibold text-ink-800">{route(job.from_prefecture, job.from_city, job.to_prefecture, job.to_city)}</div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-ink-500">
                        <span>{formatDateDow(job.moving_date)}・{luggageLayout(job.layout, job.luggage_volume)}</span>
                        <span>応募 {job.applications_count ?? 0}社</span>
                      </div>
                      <div className="mt-0.5 text-xs text-ink-400">締切 {shortDate(job.application_deadline)}</div>
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
