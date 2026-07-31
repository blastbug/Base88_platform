"use client";

import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Field, Input, SectionCard, Select, Spinner, Textarea } from "@/components/ui";

type Vehicle = { id?: number; vehicle_type: string; truck_size: string; count: string; max_load: string; plate_number: string; ownership: string; availability: string };
type Doc = { id: number; doc_type: string; doc_type_label: string; doc_name: string | null; permit_number: string | null; expiry_date: string | null; file_url: string | null; review_status: string; review_status_label: string; reject_reason: string | null };
type Profile = Record<string, unknown> & {
  review_status: string; review_status_label: string; review_note: string | null; is_approved: boolean;
  can_edit: boolean; can_submit: boolean; vehicles: Vehicle[]; documents: Doc[]; truck_sizes: string[]; document_types: Record<string, string>;
};

const SERVICES: [string, string][] = [
  ["svc_disposal_pickup", "不用品引き取り"], ["svc_disposal_buy", "不用品買取"], ["svc_ac_install", "エアコン脱着"],
  ["svc_washer_install", "洗濯機設置"], ["svc_furniture_assembly", "家具組立て"], ["svc_appliance_install", "家電設置"],
  ["svc_packing", "梱包作業"], ["svc_unpacking", "開梱作業"], ["svc_protection", "養生作業"],
  ["svc_long_distance", "長距離配送"], ["svc_storage", "一時保管"],
];
const LICENSES: [string, string][] = [
  ["has_antique_license", "古物商許可"], ["has_light_cargo_license", "軽貨物運送事業"], ["has_general_cargo_license", "一般貨物自動車運送事業"],
];
const INSURANCES: [string, string][] = [
  ["has_transport_insurance", "運送保険"], ["has_cargo_insurance", "貨物保険"], ["has_liability_insurance", "請負業者賠償責任保険"], ["has_auto_insurance", "自動車保険"],
];
const REVIEW_TONE: Record<string, string> = {
  draft: "bg-ink-100 text-ink-600 ring-ink-500/20", submitted: "bg-brand-50 text-brand-700 ring-brand-600/20",
  under_review: "bg-amber-50 text-amber-700 ring-amber-600/20", revision: "bg-rose-50 text-rose-700 ring-rose-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", suspended: "bg-rose-50 text-rose-700 ring-rose-600/20", terminated: "bg-ink-100 text-ink-600 ring-ink-500/20",
};
const DOC_TONE: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", rejected: "bg-rose-50 text-rose-700 ring-rose-600/20", pending: "bg-brand-50 text-brand-700 ring-brand-600/20",
};

const emptyVehicle = (): Vehicle => ({ vehicle_type: "", truck_size: "", count: "1", max_load: "", plate_number: "", ownership: "", availability: "" });

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "company_admin";
  const [p, setP] = useState<Profile | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await api<{ data: Profile }>("/me/company/profile");
    const d = res.data;
    setP(d);
    const f: Record<string, string | boolean> = {};
    Object.entries(d).forEach(([k, v]) => {
      if (["vehicles", "documents", "truck_sizes", "document_types"].includes(k)) return;
      if (typeof v === "boolean") f[k] = v;
      else f[k] = v === null || v === undefined ? "" : String(v);
    });
    setForm(f);
    setVehicles((d.vehicles ?? []).map((v) => ({ ...v, count: String(v.count ?? "") })));
  }
  useEffect(() => { load().catch(() => setError("登録情報の取得に失敗しました。")).finally(() => setLoading(false)); }, []);

  const set = (k: string) => (e: { target: { value: string } }) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const toggle = (k: string) => setForm((s) => ({ ...s, [k]: !s[k] }));
  const readonly = !!p && !p.can_edit;

  async function save(): Promise<boolean> {
    setSaving(true); setError(null); setMsg(null);
    try {
      const body: Record<string, unknown> = { ...form };
      // 数値・真偽の整形
      ["employee_count", "worker_count", "sales_staff_count", "vehicle_count", "experience_years", "annual_jobs", "monthly_capacity", "peak_capacity", "coverage_amount", "material_hanger_box", "material_futon_bag", "material_mattress_cover", "material_plastic_sheet", "material_floor_board_m"].forEach((k) => {
        body[k] = form[k] === "" || form[k] === undefined ? null : Number(form[k]);
      });
      ["review_status", "review_status_label", "review_note", "is_approved", "can_edit", "can_submit"].forEach((k) => delete body[k]);
      body.vehicles = vehicles.filter((v) => v.truck_size || v.vehicle_type).map((v) => ({ ...v, count: v.count === "" ? null : Number(v.count) }));
      await api("/me/company/profile", { method: "PUT", body });
      setMsg("登録情報を保存しました。");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof ApiError && e.status === 422 ? "入力内容にエラーがあります。必須項目（会社名）やメール形式をご確認ください。" : "保存に失敗しました。");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submitReview() {
    if (!confirm("登録情報を保存し、審査を申請します。よろしいですか？")) return;
    const ok = await save();
    if (!ok) return;
    try {
      const res = await api<{ message: string }>("/me/company/submit", { method: "POST" });
      await load();
      alert(res.message);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "申請に失敗しました。");
    }
  }

  if (loading) return <div className="flex justify-center py-24 text-brand-600"><Spinner className="h-8 w-8" /></div>;
  if (!p) return <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error ?? "読み込みに失敗しました。"}</div>;

  return (
    <div className="animate-fade-in space-y-6">
      {/* ヘッダー・状態 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-ink-900">登録情報</h1>
          <p className="text-sm text-ink-500">加盟店情報を入力し、審査を申請してください。</p>
        </div>
        <Badge tone={REVIEW_TONE[p.review_status] ?? REVIEW_TONE.draft}>{p.review_status_label}</Badge>
      </div>

      {p.review_status === "revision" && p.review_note && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-5 py-4">
          <p className="text-sm font-semibold text-rose-700">BASE88からの修正依頼</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{p.review_note}</p>
        </div>
      )}
      {p.is_approved && <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-5 py-3 text-sm text-emerald-700">審査が完了しています。内容を更新した場合は再度保存してください。</div>}
      {readonly && <div className="rounded-xl border border-ink-200 bg-ink-50 px-5 py-3 text-sm text-ink-600">現在、編集できない状態です。</div>}

      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <fieldset disabled={readonly || !isAdmin} className="space-y-6 disabled:opacity-70">
        {/* 1. 会社情報 */}
        <Section n={1} title="会社情報">
          <Grid>
            <TF label="会社名" required value={form.name} onChange={set("name")} />
            <TF label="会社名フリガナ" value={form.name_kana} onChange={set("name_kana")} />
            <TF label="法人番号" value={form.corporate_number} onChange={set("corporate_number")} />
            <TF label="インボイス番号" value={form.invoice_number} onChange={set("invoice_number")} />
            <TF label="郵便番号" value={form.postal_code} onChange={set("postal_code")} placeholder="123-4567" />
            <TF label="所在地" value={form.address} onChange={set("address")} full />
            <TF label="電話番号" value={form.phone} onChange={set("phone")} />
            <TF label="メールアドレス" type="email" value={form.company_email} onChange={set("company_email")} />
            <TF label="設立年月" value={form.established_ym} onChange={set("established_ym")} placeholder="2015-04" />
            <TF label="会社ホームページ" value={form.website} onChange={set("website")} />
            <TF label="対応可能エリア" value={form.service_areas} onChange={set("service_areas")} full />
            <TF label="営業時間" value={form.business_hours} onChange={set("business_hours")} placeholder="9:00〜18:00" />
            <TF label="定休日" value={form.holidays} onChange={set("holidays")} />
          </Grid>
        </Section>

        {/* 2. 代表者情報 */}
        <Section n={2} title="代表者情報">
          <Grid>
            <TF label="代表者氏名" value={form.rep_name} onChange={set("rep_name")} />
            <TF label="代表者氏名フリガナ" value={form.rep_name_kana} onChange={set("rep_name_kana")} />
            <TF label="生年月日" type="date" value={form.rep_birthday} onChange={set("rep_birthday")} />
            <TF label="住所" value={form.rep_address} onChange={set("rep_address")} />
            <TF label="電話番号" value={form.rep_phone} onChange={set("rep_phone")} />
            <TF label="メールアドレス" type="email" value={form.rep_email} onChange={set("rep_email")} />
          </Grid>
        </Section>

        {/* 3. 担当者情報 */}
        <Section n={3} title="担当者情報">
          <Grid>
            <TF label="担当者氏名" value={form.contact_name} onChange={set("contact_name")} />
            <TF label="部署名" value={form.contact_department} onChange={set("contact_department")} />
            <TF label="役職" value={form.contact_title} onChange={set("contact_title")} />
            <TF label="電話番号" value={form.contact_phone} onChange={set("contact_phone")} />
            <TF label="メールアドレス" type="email" value={form.contact_email} onChange={set("contact_email")} />
          </Grid>
        </Section>

        {/* 4. 会社規模 */}
        <Section n={4} title="会社規模">
          <Grid cols={4}>
            <TF label="従業員数" type="number" value={form.employee_count} onChange={set("employee_count")} suffix="名" />
            <TF label="作業員数" type="number" value={form.worker_count} onChange={set("worker_count")} suffix="名" />
            <TF label="営業担当者数" type="number" value={form.sales_staff_count} onChange={set("sales_staff_count")} suffix="名" />
            <TF label="車両数" type="number" value={form.vehicle_count} onChange={set("vehicle_count")} suffix="台" />
          </Grid>
        </Section>

        {/* 5. 保有車両 */}
        <Section n={5} title="保有車両情報">
          <div className="space-y-3">
            {vehicles.length === 0 && <p className="text-sm text-ink-400">「車両を追加」から保有車両を登録してください。</p>}
            {vehicles.map((v, i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-ink-200 p-3 sm:grid-cols-7">
                <FieldSm label="車両区分"><Input value={v.vehicle_type} onChange={(e) => updV(setVehicles, i, "vehicle_type", e.target.value)} /></FieldSm>
                <FieldSm label="サイズ"><Select value={v.truck_size} onChange={(e) => updV(setVehicles, i, "truck_size", e.target.value)}><option value="">選択</option>{(p.truck_sizes ?? []).map((t) => <option key={t} value={t}>{t}</option>)}</Select></FieldSm>
                <FieldSm label="台数"><Input type="number" value={v.count} onChange={(e) => updV(setVehicles, i, "count", e.target.value)} /></FieldSm>
                <FieldSm label="最大積載量"><Input value={v.max_load} onChange={(e) => updV(setVehicles, i, "max_load", e.target.value)} /></FieldSm>
                <FieldSm label="ナンバー"><Input value={v.plate_number} onChange={(e) => updV(setVehicles, i, "plate_number", e.target.value)} /></FieldSm>
                <FieldSm label="所有区分"><Select value={v.ownership} onChange={(e) => updV(setVehicles, i, "ownership", e.target.value)}><option value="">選択</option><option value="自社所有">自社所有</option><option value="リース">リース</option></Select></FieldSm>
                <div className="flex items-end"><Button type="button" size="sm" variant="danger" onClick={() => setVehicles((s) => s.filter((_, j) => j !== i))}>削除</Button></div>
              </div>
            ))}
            <Button type="button" size="sm" variant="secondary" onClick={() => setVehicles((s) => [...s, emptyVehicle()])}>＋ 車両を追加</Button>
          </div>
        </Section>

        {/* 6. 許可・書類 */}
        <Section n={6} title="許可証・本人確認書類">
          <div className="mb-4 flex flex-wrap gap-4">
            {LICENSES.map(([k, l]) => <CheckRow key={k} label={l} checked={!!form[k]} onChange={() => toggle(k)} />)}
          </div>
          <DocumentManager profile={p} onChanged={load} disabled={readonly || !isAdmin} />
        </Section>

        {/* 7. 会社実績 */}
        <Section n={7} title="会社実績">
          <Grid cols={4}>
            <TF label="経験年数" type="number" value={form.experience_years} onChange={set("experience_years")} suffix="年" />
            <TF label="年間対応件数" type="number" value={form.annual_jobs} onChange={set("annual_jobs")} suffix="件" />
            <TF label="月間対応可能件数" type="number" value={form.monthly_capacity} onChange={set("monthly_capacity")} suffix="件" />
            <TF label="繁忙期の対応可能件数" type="number" value={form.peak_capacity} onChange={set("peak_capacity")} suffix="件" />
          </Grid>
          <div className="mt-4 flex flex-wrap gap-4">
            <CheckRow label="法人案件の対応実績" checked={!!form.corporate_experience} onChange={() => toggle("corporate_experience")} />
            <CheckRow label="個人案件の対応実績" checked={!!form.individual_experience} onChange={() => toggle("individual_experience")} />
            <CheckRow label="長距離引っ越しの対応" checked={!!form.long_distance_support} onChange={() => toggle("long_distance_support")} />
          </div>
          <div className="mt-4 grid gap-4">
            <Field label="主な取引先"><Textarea rows={2} value={String(form.main_clients ?? "")} onChange={set("main_clients")} /></Field>
            <Field label="過去の実績・アピール内容"><Textarea rows={3} value={String(form.achievements ?? "")} onChange={set("achievements")} /></Field>
          </div>
        </Section>

        {/* 8. 保険 */}
        <Section n={8} title="保険加入状況">
          <div className="mb-4 flex flex-wrap gap-4">
            {INSURANCES.map(([k, l]) => <CheckRow key={k} label={l} checked={!!form[k]} onChange={() => toggle(k)} />)}
          </div>
          <Grid>
            <TF label="保険会社名" value={form.insurer_name} onChange={set("insurer_name")} />
            <TF label="保険証券番号" value={form.policy_number} onChange={set("policy_number")} />
            <TF label="補償金額" type="number" value={form.coverage_amount} onChange={set("coverage_amount")} prefix="¥" />
            <TF label="保険の有効期限" type="date" value={form.insurance_expiry} onChange={set("insurance_expiry")} />
          </Grid>
        </Section>

        {/* 9. 保有資材 */}
        <Section n={9} title="保有資材">
          <Grid cols={3}>
            <TF label="ハンガーボックス" type="number" value={form.material_hanger_box} onChange={set("material_hanger_box")} suffix="個" />
            <TF label="布団袋" type="number" value={form.material_futon_bag} onChange={set("material_futon_bag")} suffix="個" />
            <TF label="マットレスカバー" type="number" value={form.material_mattress_cover} onChange={set("material_mattress_cover")} suffix="個" />
            <TF label="プラ段シート" type="number" value={form.material_plastic_sheet} onChange={set("material_plastic_sheet")} suffix="枚" />
            <TF label="床養生ボード" type="number" value={form.material_floor_board_m} onChange={set("material_floor_board_m")} suffix="m" />
          </Grid>
        </Section>

        {/* 10. 対応サービス */}
        <Section n={10} title="対応可能サービス">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SERVICES.map(([k, l]) => <CheckRow key={k} label={l} checked={!!form[k]} onChange={() => toggle(k)} />)}
          </div>
        </Section>
      </fieldset>

      {/* フッター */}
      {!readonly && isAdmin && (
        <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-end gap-3 border-t border-ink-200 bg-white/90 px-5 py-3 backdrop-blur">
          <Link href="/mypage" className="text-sm text-ink-500 hover:text-ink-700">マイページへ戻る</Link>
          <Button variant="secondary" onClick={save} disabled={saving}>{saving ? "保存中…" : "保存する"}</Button>
          {p.can_submit && <Button onClick={submitReview} disabled={saving}>保存して審査を申請</Button>}
        </div>
      )}
      {!isAdmin && <div className="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">登録情報の編集は会社管理者のみ可能です。</div>}
    </div>
  );
}

/* ---------- 部品 ---------- */
function updV(setter: Dispatch<SetStateAction<Vehicle[]>>, i: number, key: keyof Vehicle, val: string) {
  setter((s) => s.map((v, j) => (j === i ? { ...v, [key]: val } : v)));
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <SectionCard>
      <div className="border-b border-ink-100 px-5 py-3"><h2 className="text-sm font-bold text-ink-800">{n}. {title}</h2></div>
      <div className="p-5">{children}</div>
    </SectionCard>
  );
}
function Grid({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  const cls = cols === 4 ? "sm:grid-cols-4" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return <div className={`grid gap-4 ${cls}`}>{children}</div>;
}
function TF({ label, value, onChange, type = "text", placeholder, suffix, prefix, required, full }: {
  label: string; value: string | boolean | undefined; onChange: (e: { target: { value: string } }) => void;
  type?: string; placeholder?: string; suffix?: string; prefix?: string; required?: boolean; full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Field label={label} required={required}>
        <div className="flex items-center gap-1.5">
          {prefix && <span className="text-sm text-ink-500">{prefix}</span>}
          <Input type={type} value={String(value ?? "")} onChange={onChange} placeholder={placeholder} />
          {suffix && <span className="text-sm text-ink-500">{suffix}</span>}
        </div>
      </Field>
    </div>
  );
}
function FieldSm({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-ink-600">{label}</span>{children}</label>;
}
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
      {label}
    </label>
  );
}

function DocumentManager({ profile, onChanged, disabled }: { profile: Profile; onChanged: () => Promise<void>; disabled: boolean }) {
  const types = profile.document_types ?? {};
  const [docType, setDocType] = useState(Object.keys(types)[0] ?? "");
  const [docName, setDocName] = useState("");
  const [permit, setPermit] = useState("");
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload() {
    setErr(null); setBusy(true);
    try {
      const fd = new FormData();
      fd.append("doc_type", docType);
      if (docName) fd.append("doc_name", docName);
      if (permit) fd.append("permit_number", permit);
      if (expiry) fd.append("expiry_date", expiry);
      if (file) fd.append("file", file);
      await api("/me/company/documents", { method: "POST", body: fd });
      setDocName(""); setPermit(""); setExpiry(""); setFile(null);
      await onChanged();
    } catch (e) {
      setErr(e instanceof ApiError ? "アップロードに失敗しました（画像/PDF・10MBまで）。" : "アップロードに失敗しました。");
    } finally { setBusy(false); }
  }
  async function remove(id: number) {
    if (!confirm("この書類を削除しますか？")) return;
    try { await api(`/me/company/documents/${id}`, { method: "DELETE" }); await onChanged(); }
    catch (e) { alert(e instanceof ApiError ? e.message : "削除に失敗しました。"); }
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {(profile.documents ?? []).length === 0 && <li className="text-sm text-ink-400">登録された書類はありません。</li>}
        {(profile.documents ?? []).map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-200 px-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-ink-800">{d.doc_type_label}</span>
                {d.doc_name && <span className="text-ink-500">{d.doc_name}</span>}
                {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">表示</a>}
                <Badge tone={DOC_TONE[d.review_status] ?? DOC_TONE.pending}>{d.review_status_label}</Badge>
              </div>
              {d.review_status === "rejected" && d.reject_reason && <p className="mt-0.5 text-xs text-rose-600">差し戻し：{d.reject_reason}</p>}
            </div>
            {!disabled && d.review_status !== "confirmed" && <button type="button" onClick={() => remove(d.id)} className="text-xs text-rose-600 hover:underline">削除</button>}
          </li>
        ))}
      </ul>
      {!disabled && (
        <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-3">
          {err && <div className="mb-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">{err}</div>}
          <div className="grid gap-3 sm:grid-cols-4">
            <FieldSm label="書類種別"><Select value={docType} onChange={(e) => setDocType(e.target.value)}>{Object.entries(types).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></FieldSm>
            <FieldSm label="書類名"><Input value={docName} onChange={(e) => setDocName(e.target.value)} /></FieldSm>
            <FieldSm label="許可番号"><Input value={permit} onChange={(e) => setPermit(e.target.value)} /></FieldSm>
            <FieldSm label="有効期限"><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></FieldSm>
            <FieldSm label="ファイル（画像・PDF）"><input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-ink-600 file:mr-2 file:rounded file:border-0 file:bg-brand-50 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-brand-700" /></FieldSm>
            <div className="flex items-end"><Button type="button" size="sm" onClick={upload} disabled={busy}>{busy ? "送信中…" : "書類を追加"}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
