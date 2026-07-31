"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Attachment, Job } from "@/lib/types";
import { Button, EmptyState, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { AttachmentManager } from "@/components/AttachmentManager";
import { BUILDING_TYPES, PREFECTURES, TIME_SLOTS, TRUCK_SIZES } from "@/lib/format";

type Errors = Record<string, string[]>;
const EMPTY = {
  moving_date: "", time_slot: "", from_prefecture: "", from_city: "", to_prefecture: "", to_city: "",
  building_type: "", layout: "", luggage_volume: "", truck_size: "", worker_count: "", floors: "",
  has_elevator: "", desired_price: "", application_deadline: "", note: "",
  customer_name: "", customer_phone: "", customer_address: "", contact_note: "",
};

/** ISO8601 → datetime-local（ローカル時刻 "YYYY-MM-DDTHH:mm"） */
function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [form, setForm] = useState({ ...EMPTY });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = (k: string) => errors[k]?.[0];

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api<{ data: Job }>(`/jobs/${id}`);
        if (!active) return;
        const j = res.data;
        if (!j.is_owner) { setBlocked("この案件を編集する権限がありません。"); return; }
        if (j.status !== "recruiting") { setBlocked("募集中の案件のみ編集できます。"); return; }
        setForm({
          moving_date: j.moving_date ?? "",
          time_slot: j.time_slot ?? "",
          from_prefecture: j.from_prefecture ?? "",
          from_city: j.from_city ?? "",
          to_prefecture: j.to_prefecture ?? "",
          to_city: j.to_city ?? "",
          building_type: j.building_type ?? "",
          layout: j.layout ?? "",
          luggage_volume: j.luggage_volume ?? "",
          truck_size: j.truck_size ?? "",
          worker_count: j.worker_count != null ? String(j.worker_count) : "",
          floors: j.floors ?? "",
          has_elevator: j.has_elevator == null ? "" : j.has_elevator ? "1" : "0",
          desired_price: j.desired_price != null ? String(j.desired_price) : "",
          application_deadline: toDatetimeLocal(j.application_deadline),
          note: j.note ?? "",
          customer_name: j.customer?.name ?? "",
          customer_phone: j.customer?.phone ?? "",
          customer_address: j.customer?.address ?? "",
          contact_note: j.customer?.contact_note ?? "",
        });
        setAttachments(j.attachments ?? []);
      } catch {
        if (active) setBlocked("案件の読み込みに失敗しました。時間をおいて再度お試しください。");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setGeneral(null);
    setErrors({});
    const payload: Record<string, unknown> = { ...form };
    payload.worker_count = form.worker_count ? Number(form.worker_count) : null;
    payload.desired_price = form.desired_price ? Number(form.desired_price) : null;
    payload.has_elevator = form.has_elevator === "" ? null : form.has_elevator === "1";
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    try {
      await api(`/jobs/${id}`, { method: "PUT", body: payload });
      router.push(`/jobs/${id}?updated=1`);
    } catch (e2) {
      if (e2 instanceof ApiError && e2.status === 422) {
        setErrors((e2.body as { errors?: Errors }).errors ?? {});
        setGeneral("入力内容に誤りがあります。ご確認ください。");
      } else {
        setGeneral("更新に失敗しました。時間をおいて再度お試しください。");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24 text-brand-600"><Spinner className="h-8 w-8" /></div>;
  if (blocked) {
    return (
      <div className="card">
        <EmptyState title="編集できません" description={blocked} action={<Button variant="secondary" onClick={() => router.push(`/jobs/${id}`)}>案件詳細へ</Button>} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <button onClick={() => router.push(`/jobs/${id}`)} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        案件詳細に戻る
      </button>

      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-ink-900">案件を編集</h2>
        <p className="mt-1 text-sm text-ink-500">募集中の案件の内容を変更できます。</p>

        {general && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{general}</div>}

        <form onSubmit={submit} className="mt-6 space-y-6">
          {/* 案件情報 */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="引越予定日" required error={err("moving_date")}>
              <input type="date" className="input-base" value={form.moving_date} onChange={set("moving_date")} />
            </Field>
            <Field label="引越予定時間" error={err("time_slot")}>
              <Select value={form.time_slot} onChange={set("time_slot")}>
                <option value="">指定なし</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="出発地" required error={err("from_prefecture")}>
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.from_prefecture} onChange={set("from_prefecture")}>
                  <option value="">都道府県</option>
                  {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
                <Input value={form.from_city} onChange={set("from_city")} placeholder="市区町村" />
              </div>
            </Field>
            <Field label="到着地" required error={err("to_prefecture")}>
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.to_prefecture} onChange={set("to_prefecture")}>
                  <option value="">都道府県</option>
                  {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
                <Input value={form.to_city} onChange={set("to_city")} placeholder="市区町村" />
              </div>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="建物種別" required error={err("building_type")}>
              <Select value={form.building_type} onChange={set("building_type")}>
                <option value="">選択してください</option>
                {BUILDING_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </Select>
            </Field>
            <Field label="間取り" error={err("layout")}>
              <Input value={form.layout} onChange={set("layout")} placeholder="2LDK" />
            </Field>
            <Field label="荷物量" required error={err("luggage_volume")}>
              <Input value={form.luggage_volume} onChange={set("luggage_volume")} placeholder="2tトラック1台程度" />
            </Field>
            <Field label="トラックサイズ" error={err("truck_size")}>
              <Select value={form.truck_size} onChange={set("truck_size")}>
                <option value="">選択してください</option>
                {TRUCK_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="階数" error={err("floors")}>
              <Input value={form.floors} onChange={set("floors")} placeholder="3階" />
            </Field>
            <Field label="エレベーター" error={err("has_elevator")}>
              <Select value={form.has_elevator} onChange={set("has_elevator")}>
                <option value="">不明</option>
                <option value="1">あり</option>
                <option value="0">なし</option>
              </Select>
            </Field>
            <Field label="必要人数" error={err("worker_count")}>
              <Input type="number" min={0} value={form.worker_count} onChange={set("worker_count")} placeholder="2" />
            </Field>
            <Field label="希望金額（円）" error={err("desired_price")}>
              <Input type="number" min={0} value={form.desired_price} onChange={set("desired_price")} placeholder="120000" />
            </Field>
          </div>

          <Field label="応募締切" required error={err("application_deadline")} hint="この日時を過ぎると自動的に募集終了となります">
            <input type="datetime-local" className="input-base sm:max-w-xs" value={form.application_deadline} onChange={set("application_deadline")} />
          </Field>

          <Field label="備考" error={err("note")}>
            <Textarea rows={3} value={form.note} onChange={set("note")} placeholder="大きな家具・家電あり。丁寧な作業を希望します。" />
          </Field>

          {/* 添付ファイル（追加・削除は即時反映） */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-700">添付ファイル <span className="text-xs font-normal text-ink-400">(画像・PDF、3ファイルまで／変更は即時保存されます)</span></span>
            <AttachmentManager jobId={Number(id)} items={attachments} onChange={setAttachments} editable />
          </div>

          {/* 顧客情報 */}
          <div className="border-t border-ink-100 pt-6">
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16v-4M12 8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              顧客情報は公開されません。成約後、成約した会社にのみ開示されます。（任意）
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="顧客氏名"><Input value={form.customer_name} onChange={set("customer_name")} placeholder="山田 太郎" /></Field>
              <Field label="電話番号"><Input value={form.customer_phone} onChange={set("customer_phone")} placeholder="090-1234-5678" /></Field>
            </div>
            <div className="mt-5 space-y-5">
              <Field label="詳細住所"><Input value={form.customer_address} onChange={set("customer_address")} placeholder="東京都港区..." /></Field>
              <Field label="連絡事項"><Textarea rows={2} value={form.contact_note} onChange={set("contact_note")} /></Field>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-ink-100 pt-6">
            <Button type="button" variant="secondary" onClick={() => router.push(`/jobs/${id}`)}>キャンセル</Button>
            <Button type="submit" loading={submitting}>変更を保存する</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
