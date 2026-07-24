"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Job } from "@/lib/types";
import { Button, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { BUILDING_TYPES, PREFECTURES, TIME_SLOTS, TRUCK_SIZES } from "@/lib/format";

type Errors = Record<string, string[]>;

export default function NewJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [form, setForm] = useState({
    moving_date: "",
    time_slot: "",
    from_prefecture: "",
    from_city: "",
    to_prefecture: "",
    to_city: "",
    building_type: "",
    layout: "",
    luggage_volume: "",
    truck_size: "",
    worker_count: "",
    floors: "",
    has_elevator: "",
    desired_price: "",
    note: "",
    application_deadline: "",
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    contact_note: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);

    const payload: Record<string, unknown> = { ...form };
    // 数値・真偽の整形
    payload.worker_count = form.worker_count ? Number(form.worker_count) : null;
    payload.desired_price = form.desired_price ? Number(form.desired_price) : null;
    payload.has_elevator = form.has_elevator === "" ? null : form.has_elevator === "1";
    // 空文字は送らない（任意項目）
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });

    try {
      const res = await api<{ data: Job }>("/jobs", { method: "POST", body: payload });
      router.push(`/jobs/${res.data.id}?created=1`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: Errors };
        setErrors(body.errors ?? {});
        setGeneralError("入力内容に誤りがあります。ご確認ください。");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setGeneralError("送信に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k: string) => errors[k]?.[0];

  return (
    <div className="animate-fade-in">
      <PageHeader title="案件を掲載する" description="自社で対応できない引越案件を掲載し、他社へ依頼できます。" />

      {generalError && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {generalError}
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* 基本情報 */}
        <Section title="引越情報">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="引越日" required error={err("moving_date")}>
              <input type="date" className="input-base" value={form.moving_date} onChange={(e) => set("moving_date", e.target.value)} required />
            </Field>
            <Field label="時間帯" error={err("time_slot")}>
              <Select value={form.time_slot} onChange={(e) => set("time_slot", e.target.value)}>
                <option value="">指定なし</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="出発地（都道府県）" required error={err("from_prefecture")}>
                <Select value={form.from_prefecture} onChange={(e) => set("from_prefecture", e.target.value)} required>
                  <option value="">選択</option>
                  {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="市区町村" error={err("from_city")}>
                <Input value={form.from_city} onChange={(e) => set("from_city", e.target.value)} placeholder="世田谷区" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="到着地（都道府県）" required error={err("to_prefecture")}>
                <Select value={form.to_prefecture} onChange={(e) => set("to_prefecture", e.target.value)} required>
                  <option value="">選択</option>
                  {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="市区町村" error={err("to_city")}>
                <Input value={form.to_city} onChange={(e) => set("to_city", e.target.value)} placeholder="横浜市" />
              </Field>
            </div>
          </div>
        </Section>

        {/* 物件・作業 */}
        <Section title="物件・作業内容">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="建物種別" required error={err("building_type")}>
              <Select value={form.building_type} onChange={(e) => set("building_type", e.target.value)} required>
                <option value="">選択</option>
                {BUILDING_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </Select>
            </Field>
            <Field label="間取り" error={err("layout")}>
              <Input value={form.layout} onChange={(e) => set("layout", e.target.value)} placeholder="2LDK" />
            </Field>
            <Field label="階数" error={err("floors")}>
              <Input value={form.floors} onChange={(e) => set("floors", e.target.value)} placeholder="3階" />
            </Field>
            <Field label="エレベーター" error={err("has_elevator")}>
              <Select value={form.has_elevator} onChange={(e) => set("has_elevator", e.target.value)}>
                <option value="">不明</option>
                <option value="1">あり</option>
                <option value="0">なし</option>
              </Select>
            </Field>
            <Field label="荷物量" required error={err("luggage_volume")}>
              <Input value={form.luggage_volume} onChange={(e) => set("luggage_volume", e.target.value)} placeholder="2tトラック1台程度" required />
            </Field>
            <Field label="トラックサイズ" error={err("truck_size")}>
              <Select value={form.truck_size} onChange={(e) => set("truck_size", e.target.value)}>
                <option value="">選択</option>
                {TRUCK_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="必要人数" error={err("worker_count")}>
              <Input type="number" min={0} value={form.worker_count} onChange={(e) => set("worker_count", e.target.value)} placeholder="2" />
            </Field>
            <Field label="希望依頼金額（円）" error={err("desired_price")} hint="未入力の場合は「応相談」と表示されます">
              <Input type="number" min={0} value={form.desired_price} onChange={(e) => set("desired_price", e.target.value)} placeholder="45000" />
            </Field>
          </div>
          <Field label="備考・注意事項" error={err("note")}>
            <Textarea rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="大型家具の有無、作業上の注意点など" />
          </Field>
        </Section>

        {/* 募集 */}
        <Section title="募集設定">
          <Field label="応募締切" required error={err("application_deadline")} hint="この日時を過ぎると自動的に募集終了となります">
            <input type="datetime-local" className="input-base sm:max-w-xs" value={form.application_deadline} onChange={(e) => set("application_deadline", e.target.value)} required />
          </Field>
        </Section>

        {/* 顧客情報 */}
        <Section
          title="顧客情報（任意）"
          note="ここで入力した顧客情報は公開されません。成約後、成約した会社にのみ開示されます。"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="顧客氏名" error={err("customer_name")}>
              <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="山田 太郎" />
            </Field>
            <Field label="電話番号" error={err("customer_phone")}>
              <Input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} placeholder="090-1234-5678" />
            </Field>
          </div>
          <Field label="詳細住所" error={err("customer_address")}>
            <Input value={form.customer_address} onChange={(e) => set("customer_address", e.target.value)} placeholder="東京都港区..." />
          </Field>
          <Field label="連絡事項" error={err("contact_note")}>
            <Textarea rows={2} value={form.contact_note} onChange={(e) => set("contact_note", e.target.value)} />
          </Field>
        </Section>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button type="submit" loading={submitting}>
            この内容で掲載する
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-ink-900">{title}</h2>
      {note && (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-ink-500">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 16v-4M12 8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {note}
        </p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}
