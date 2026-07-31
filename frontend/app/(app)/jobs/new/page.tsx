"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Job } from "@/lib/types";
import { Button, Field, Input, Select, Stepper, Textarea } from "@/components/ui";
import { BUILDING_TYPES, PREFECTURES, TIME_SLOTS, TRUCK_SIZES, formatDate, formatYen } from "@/lib/format";

type Errors = Record<string, string[]>;
const STEPS = ["案件情報入力", "顧客情報入力（成約後開示）", "確認"];

const initial = {
  moving_date: "", time_slot: "", from_prefecture: "", from_city: "", to_prefecture: "", to_city: "",
  building_type: "", layout: "", luggage_volume: "", truck_size: "", worker_count: "", floors: "",
  has_elevator: "", desired_price: "", application_deadline: "", note: "",
  customer_name: "", customer_phone: "", customer_address: "", contact_note: "",
};

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }
  const err = (k: string) => errors[k]?.[0];

  // 初期リリースでは加盟店からの案件投稿は無効（管理者のみ登録）。将来の追加開発で有効化予定。
  const POSTING_ENABLED = false;
  if (!POSTING_ENABLED) {
    return (
      <div className="animate-fade-in mx-auto max-w-lg py-6">
        <div className="card p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-400">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 className="text-lg font-bold text-ink-900">この機能は現在ご利用いただけません</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            案件の登録は管理者が行います。<br />
            募集中の案件は「案件一覧」からご確認・ご応募いただけます。
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push("/jobs")}>案件一覧を見る</Button>
          </div>
        </div>
      </div>
    );
  }

  const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  function addFiles(list: FileList | File[]) {
    setFileError(null);
    const incoming = Array.from(list);
    const valid: File[] = [];
    for (const f of incoming) {
      if (!ACCEPT.includes(f.type)) { setFileError("画像（JPG/PNG/WebP）またはPDFのみ添付できます。"); continue; }
      if (f.size > 10 * 1024 * 1024) { setFileError("1ファイルあたり最大10MBです。"); continue; }
      valid.push(f);
    }
    setFiles((prev) => {
      const merged = [...prev, ...valid];
      if (merged.length > 3) { setFileError("添付は3ファイルまでです。"); return merged.slice(0, 3); }
      return merged;
    });
  }
  function removeFile(i: number) { setFiles((prev) => prev.filter((_, idx) => idx !== i)); }

  function validateStep1(): boolean {
    const e: Errors = {};
    if (!form.moving_date) e.moving_date = ["引越予定日を入力してください。"];
    if (!form.from_prefecture) e.from_prefecture = ["出発地を選択してください。"];
    if (!form.to_prefecture) e.to_prefecture = ["到着地を選択してください。"];
    if (!form.building_type) e.building_type = ["建物種別を選択してください。"];
    if (!form.luggage_volume) e.luggage_volume = ["荷物量を入力してください。"];
    if (!form.application_deadline) e.application_deadline = ["応募締切を入力してください。"];
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 0 && !validateStep1()) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setStep((s) => Math.min(2, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() { setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function submit() {
    setSubmitting(true);
    setGeneral(null);
    const payload: Record<string, unknown> = { ...form };
    payload.worker_count = form.worker_count ? Number(form.worker_count) : null;
    payload.desired_price = form.desired_price ? Number(form.desired_price) : null;
    payload.has_elevator = form.has_elevator === "" ? null : form.has_elevator === "1";
    Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
    try {
      const res = await api<{ data: Job }>("/jobs", { method: "POST", body: payload });
      // 添付ファイルがあれば作成後にアップロード（失敗しても掲載自体は完了させ、詳細画面で通知）
      let uploadFailed = false;
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files[]", f));
        try {
          await api(`/jobs/${res.data.id}/attachments`, { method: "POST", body: fd });
        } catch {
          uploadFailed = true;
        }
      }
      router.push(`/jobs/${res.data.id}?created=1${uploadFailed ? "&upload=failed" : ""}`);
    } catch (e2) {
      if (e2 instanceof ApiError && e2.status === 422) {
        setErrors((e2.body as { errors?: Errors }).errors ?? {});
        setGeneral("入力内容に誤りがあります。「案件情報入力」に戻ってご確認ください。");
      } else {
        setGeneral("送信に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <div className="card p-6 sm:p-8">
        <Stepper steps={STEPS} current={step} />

        <div className="mt-8">
          {general && <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{general}</div>}

          {step === 0 && (
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="引越予定日" required error={err("moving_date")}>
                  <input type="date" className="input-base" value={form.moving_date} onChange={(e) => set("moving_date", e.target.value)} />
                </Field>
                <Field label="引越予定時間" error={err("time_slot")}>
                  <Select value={form.time_slot} onChange={(e) => set("time_slot", e.target.value)}>
                    <option value="">指定なし</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="出発地" required error={err("from_prefecture")}>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={form.from_prefecture} onChange={(e) => set("from_prefecture", e.target.value)}>
                      <option value="">都道府県</option>
                      {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </Select>
                    <Input value={form.from_city} onChange={(e) => set("from_city", e.target.value)} placeholder="市区町村" />
                  </div>
                </Field>
                <Field label="到着地" required error={err("to_prefecture")}>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={form.to_prefecture} onChange={(e) => set("to_prefecture", e.target.value)}>
                      <option value="">都道府県</option>
                      {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </Select>
                    <Input value={form.to_city} onChange={(e) => set("to_city", e.target.value)} placeholder="市区町村" />
                  </div>
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="建物種別" required error={err("building_type")}>
                  <Select value={form.building_type} onChange={(e) => set("building_type", e.target.value)}>
                    <option value="">選択してください</option>
                    {BUILDING_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </Select>
                </Field>
                <Field label="間取り" error={err("layout")}>
                  <Input value={form.layout} onChange={(e) => set("layout", e.target.value)} placeholder="2LDK" />
                </Field>
                <Field label="荷物量" required error={err("luggage_volume")}>
                  <Input value={form.luggage_volume} onChange={(e) => set("luggage_volume", e.target.value)} placeholder="2tトラック1台程度" />
                </Field>
                <Field label="トラックサイズ" error={err("truck_size")}>
                  <Select value={form.truck_size} onChange={(e) => set("truck_size", e.target.value)}>
                    <option value="">選択してください</option>
                    {TRUCK_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
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
                <Field label="必要人数" error={err("worker_count")}>
                  <Input type="number" min={0} value={form.worker_count} onChange={(e) => set("worker_count", e.target.value)} placeholder="2" />
                </Field>
                <Field label="希望金額（円）" error={err("desired_price")}>
                  <Input type="number" min={0} value={form.desired_price} onChange={(e) => set("desired_price", e.target.value)} placeholder="120000" />
                </Field>
              </div>

              <Field label="応募締切" required error={err("application_deadline")} hint="この日時を過ぎると自動的に募集終了となります">
                <input type="datetime-local" className="input-base sm:max-w-xs" value={form.application_deadline} onChange={(e) => set("application_deadline", e.target.value)} />
              </Field>

              <Field label="備考" error={err("note")}>
                <Textarea rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="大きな家具・家電あり。丁寧な作業を希望します。" />
              </Field>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-700">添付ファイル <span className="text-xs font-normal text-ink-400">(画像・PDF、3ファイルまで)</span></span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInput.current?.click()}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInput.current?.click(); }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 text-center transition-colors ${dragging ? "border-brand-400 bg-brand-50" : "border-ink-200 bg-ink-50 hover:border-brand-300"}`}
                >
                  <svg viewBox="0 0 24 24" className="h-8 w-8 text-ink-300" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <p className="mt-2 text-sm text-ink-500">クリックまたはドラッグ＆ドロップで追加</p>
                  <p className="text-xs text-ink-400">JPG / PNG / WebP / PDF（最大10MB）</p>
                </div>
                {fileError && <p className="mt-2 text-xs text-rose-600">{fileError}</p>}

                {files.length > 0 && (
                  <ul className="mt-3 grid grid-cols-3 gap-3">
                    {files.map((f, i) => (
                      <li key={i} className="relative rounded-lg border border-ink-200 bg-white p-2">
                        {f.type.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={URL.createObjectURL(f)} alt={f.name} className="h-24 w-full rounded object-cover" />
                        ) : (
                          <div className="flex h-24 w-full flex-col items-center justify-center rounded bg-ink-50 text-ink-400">
                            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span className="mt-1 text-[10px]">PDF</span>
                          </div>
                        )}
                        <p className="mt-1 truncate text-[11px] text-ink-500">{f.name}</p>
                        <button type="button" onClick={() => removeFile(i)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-500 shadow ring-1 ring-ink-200 hover:text-rose-600" aria-label="削除">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" /></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-start gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16v-4M12 8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ここで入力した顧客情報は公開されません。成約後、成約した会社にのみ開示されます。（任意）
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="顧客氏名"><Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="山田 太郎" /></Field>
                <Field label="電話番号"><Input value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} placeholder="090-1234-5678" /></Field>
              </div>
              <Field label="詳細住所"><Input value={form.customer_address} onChange={(e) => set("customer_address", e.target.value)} placeholder="東京都港区..." /></Field>
              <Field label="連絡事項"><Textarea rows={2} value={form.contact_note} onChange={(e) => set("contact_note", e.target.value)} /></Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <ConfirmBlock title="案件情報">
                <ConfirmRow label="引越予定日" value={formatDate(form.moving_date)} />
                <ConfirmRow label="引越予定時間" value={form.time_slot || "指定なし"} />
                <ConfirmRow label="出発地" value={`${form.from_prefecture} ${form.from_city}`} />
                <ConfirmRow label="到着地" value={`${form.to_prefecture} ${form.to_city}`} />
                <ConfirmRow label="建物種別" value={form.building_type} />
                <ConfirmRow label="間取り / 荷物量" value={`${form.layout || "—"} / ${form.luggage_volume}`} />
                <ConfirmRow label="トラック / 人数" value={`${form.truck_size || "—"} / ${form.worker_count ? form.worker_count + "名" : "—"}`} />
                <ConfirmRow label="希望金額" value={formatYen(form.desired_price ? Number(form.desired_price) : null)} />
                <ConfirmRow label="応募締切" value={form.application_deadline.replace("T", " ")} />
                <ConfirmRow label="備考" value={form.note || "—"} />
                <ConfirmRow label="添付ファイル" value={files.length ? `${files.length}件` : "なし"} />
              </ConfirmBlock>
              <ConfirmBlock title="顧客情報（成約後に成約会社へ開示）">
                <ConfirmRow label="顧客氏名" value={form.customer_name || "—"} />
                <ConfirmRow label="電話番号" value={form.customer_phone || "—"} />
                <ConfirmRow label="詳細住所" value={form.customer_address || "—"} />
                <ConfirmRow label="連絡事項" value={form.contact_note || "—"} />
              </ConfirmBlock>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-6">
          {step === 0 ? (
            <Button variant="secondary" onClick={() => router.push("/my/jobs")}>キャンセル</Button>
          ) : (
            <Button variant="secondary" onClick={back}>戻る</Button>
          )}
          {step < 2 ? (
            <Button onClick={next}>次へ</Button>
          ) : (
            <Button loading={submitting} onClick={submit}>この内容で掲載する</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-200">
      <div className="border-b border-ink-100 bg-ink-50 px-4 py-2.5 text-sm font-bold text-ink-800">{title}</div>
      <dl className="divide-y divide-ink-100">{children}</dl>
    </div>
  );
}
function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-2.5">
      <dt className="w-32 shrink-0 text-sm text-ink-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-ink-800">{value}</dd>
    </div>
  );
}
