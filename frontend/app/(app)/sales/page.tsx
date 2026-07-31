"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Badge, Button, Field, Input, SectionCard, Select, Spinner } from "@/components/ui";

type Monthly = { month: string; count: number; sales: number; collected: number; additional: number; billing: number; payment: number; remit: number };
type Finance = {
  id: number; job_code: string | null; moving_date: string | null; route: string | null; settled_month: string | null;
  sale_amount: number | null; collected_amount: number | null; collection_fee_rate: number; collection_fee: number; remit_amount: number;
  collection_confirmed: boolean; additional_amount: number | null; additional_detail: string | null; additional_reason: string | null;
  additional_note: string | null; additional_confirmed: boolean; billing_amount: number | null; payment_amount: number | null;
  deposit_status: string; payment_status: string;
};
type Invoice = {
  id: number; target_month: string; amount: number | null; file_url: string | null; uploaded_at: string | null;
  review_status: string; review_status_label: string; reject_reason: string | null; payment_status: string; paid_at: string | null;
};

const yen = (n?: number | null) => (n === null || n === undefined ? "—" : "¥" + n.toLocaleString("ja-JP"));
const monthLabel = (ym: string) => (/^\d{4}-\d{2}$/.test(ym) ? `${ym.slice(0, 4)}年${Number(ym.slice(5, 7))}月` : ym);
const DEPOSIT: Record<string, { l: string; t: string }> = {
  paid: { l: "入金済み", t: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  partial: { l: "一部入金", t: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  unpaid: { l: "未入金", t: "bg-ink-100 text-ink-600 ring-ink-500/20" },
};
const PAY: Record<string, { l: string; t: string }> = {
  paid: { l: "支払済み", t: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  unpaid: { l: "未払い", t: "bg-amber-50 text-amber-700 ring-amber-600/20" },
};
const INVOICE_REVIEW: Record<string, { l: string; t: string }> = {
  confirmed: { l: "確認済み", t: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  rejected: { l: "修正依頼", t: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  pending: { l: "確認待ち", t: "bg-brand-50 text-brand-700 ring-brand-600/20" },
};

export default function SalesPage() {
  const [monthly, setMonthly] = useState<Monthly[]>([]);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  async function load() {
    try {
      const r = await api<{ monthly: Monthly[]; finances: Finance[]; invoices: Invoice[] }>("/me/sales");
      setMonthly(r.monthly);
      setFinances(r.finances);
      setInvoices(r.invoices);
      setError(null);
    } catch {
      setError("売上・精算情報の取得に失敗しました。");
    }
  }
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-24 text-brand-600"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {/* 月別売上サマリー */}
      <SectionCard>
        <div className="border-b border-ink-100 px-5 py-3"><h2 className="text-sm font-bold text-ink-800">月別売上サマリー</h2></div>
        <div className="overflow-x-auto">
          <table className="dtable">
            <thead>
              <tr><th>対象月</th><th>成約件数</th><th>売上</th><th>代行集金</th><th>送金額</th><th>追加料金</th><th>請求予定</th><th>支払予定</th></tr>
            </thead>
            <tbody>
              {monthly.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-ink-400">売上データがありません。</td></tr>
              ) : monthly.map((m) => (
                <tr key={m.month}>
                  <td className="whitespace-nowrap font-semibold text-ink-800">{monthLabel(m.month)}</td>
                  <td className="text-ink-600">{m.count} 件</td>
                  <td className="whitespace-nowrap font-medium text-ink-800">{yen(m.sales)}</td>
                  <td className="whitespace-nowrap text-ink-600">{yen(m.collected)}</td>
                  <td className="whitespace-nowrap font-medium text-emerald-700">{yen(m.remit)}</td>
                  <td className="whitespace-nowrap text-ink-600">{yen(m.additional)}</td>
                  <td className="whitespace-nowrap text-ink-600">{yen(m.billing)}</td>
                  <td className="whitespace-nowrap text-ink-600">{yen(m.payment)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 案件別精算（代行集金・追加料金の入力） */}
      <SectionCard>
        <div className="border-b border-ink-100 px-5 py-3">
          <h2 className="text-sm font-bold text-ink-800">案件別 精算</h2>
          <p className="mt-0.5 text-xs text-ink-500">現地で代行集金した金額や、当日発生した追加料金を入力してください。管理者確認後は編集できません。</p>
        </div>
        <ul className="divide-y divide-ink-100">
          {finances.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-ink-400">成約案件がありません。</li>
          ) : finances.map((f) => (
            <li key={f.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-brand-600">{f.job_code ?? `#${f.id}`}</span>
                    <span className="text-sm text-ink-600">{f.route}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                    <span>売上 <span className="font-medium text-ink-800">{yen(f.sale_amount)}</span></span>
                    <span>代行集金 <span className="font-medium text-ink-800">{yen(f.collected_amount)}</span></span>
                    <span>手数料（{f.collection_fee_rate}%） {yen(f.collection_fee)}</span>
                    <span>送金額 <span className="font-medium text-emerald-700">{yen(f.remit_amount)}</span></span>
                    {f.additional_amount ? <span>追加 <span className="font-medium text-ink-800">{yen(f.additional_amount)}</span></span> : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={DEPOSIT[f.deposit_status]?.t ?? DEPOSIT.unpaid.t}>{DEPOSIT[f.deposit_status]?.l ?? "未入金"}</Badge>
                  <Badge tone={PAY[f.payment_status]?.t ?? PAY.unpaid.t}>{PAY[f.payment_status]?.l ?? "未払い"}</Badge>
                  {f.collection_confirmed ? (
                    <span className="text-xs text-ink-400">確認済み（編集不可）</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setEditId(editId === f.id ? null : f.id)}>
                      {editId === f.id ? "閉じる" : "入力する"}
                    </Button>
                  )}
                </div>
              </div>
              {editId === f.id && !f.collection_confirmed && (
                <FinanceEditor finance={f} onSaved={async () => { setEditId(null); await load(); }} />
              )}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* 請求書アップロード */}
      <SectionCard>
        <div className="border-b border-ink-100 px-5 py-3">
          <h2 className="text-sm font-bold text-ink-800">請求書</h2>
          <p className="mt-0.5 text-xs text-ink-500">対象月ごとに請求書をアップロードしてください。BASE88の確認後、お支払いとなります。</p>
        </div>
        <div className="p-5">
          <InvoiceUploader onUploaded={load} />
        </div>
        <ul className="divide-y divide-ink-100 border-t border-ink-100">
          {invoices.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-ink-400">アップロードされた請求書はありません。</li>
          ) : invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-800">{monthLabel(inv.target_month)}</span>
                  <span className="text-sm text-ink-600">{yen(inv.amount)}</span>
                  {inv.file_url && <a href={inv.file_url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">請求書を表示</a>}
                </div>
                {inv.review_status === "rejected" && inv.reject_reason && (
                  <p className="mt-1 text-xs text-rose-600">修正依頼：{inv.reject_reason}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={INVOICE_REVIEW[inv.review_status]?.t ?? INVOICE_REVIEW.pending.t}>{inv.review_status_label}</Badge>
                <Badge tone={PAY[inv.payment_status]?.t ?? PAY.unpaid.t}>{PAY[inv.payment_status]?.l ?? "未払い"}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function FinanceEditor({ finance, onSaved }: { finance: Finance; onSaved: () => void }) {
  const [collected, setCollected] = useState(finance.collected_amount?.toString() ?? "");
  const [addAmount, setAddAmount] = useState(finance.additional_amount?.toString() ?? "");
  const [addDetail, setAddDetail] = useState(finance.additional_detail ?? "");
  const [addReason, setAddReason] = useState(finance.additional_reason ?? "");
  const [addNote, setAddNote] = useState(finance.additional_note ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      await api(`/me/finances/${finance.id}`, {
        method: "PUT",
        body: {
          collected_amount: collected === "" ? null : Number(collected),
          additional_amount: addAmount === "" ? null : Number(addAmount),
          additional_detail: addDetail || null,
          additional_reason: addReason || null,
          additional_note: addNote || null,
        },
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? "保存に失敗しました。入力内容をご確認ください。" : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50/50 p-4">
      {err && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="代行集金額（円）">
          <Input type="number" min="0" value={collected} onChange={(e) => setCollected(e.target.value)} placeholder="例: 88000" />
        </Field>
        <Field label="追加料金額（円）">
          <Input type="number" min="0" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="例: 5000" />
        </Field>
        <Field label="追加料金の内容">
          <Input value={addDetail} onChange={(e) => setAddDetail(e.target.value)} placeholder="例: 階段作業・待機料 など" />
        </Field>
        <Field label="発生理由">
          <Input value={addReason} onChange={(e) => setAddReason(e.target.value)} placeholder="例: エレベーター点検のため" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="備考">
            <Input value={addNote} onChange={(e) => setAddNote(e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={save} disabled={saving}>{saving ? "保存中…" : "保存する"}</Button>
      </div>
    </div>
  );
}

function InvoiceUploader({ onUploaded }: { onUploaded: () => void }) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 直近12か月の選択肢
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  async function submit() {
    setErr(null);
    setMsg(null);
    if (!amount) { setErr("請求金額を入力してください。"); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("target_month", month);
      fd.append("amount", amount);
      if (file) fd.append("file", file);
      const res = await api<{ message: string }>("/me/invoices", { method: "POST", body: fd });
      setMsg(res.message);
      setAmount("");
      setFile(null);
      onUploaded();
    } catch (e) {
      setErr(e instanceof ApiError ? "アップロードに失敗しました。ファイル形式（画像/PDF・10MBまで）をご確認ください。" : "アップロードに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink-200 p-4">
      {msg && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</div>}
      {err && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      <div className="grid gap-4 sm:grid-cols-[160px_180px_1fr_auto] sm:items-end">
        <Field label="対象月">
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </Select>
        </Field>
        <Field label="請求金額（円）">
          <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例: 120000" />
        </Field>
        <Field label="請求書ファイル（画像・PDF）">
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100" />
        </Field>
        <Button onClick={submit} disabled={busy}>{busy ? "送信中…" : "アップロード"}</Button>
      </div>
    </div>
  );
}
