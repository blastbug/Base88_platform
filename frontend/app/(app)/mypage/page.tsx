"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Field, Input, SectionCard, Select, Spinner, Tabs } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface CompanyDetail {
  id: number; name: string; address: string | null; phone: string | null;
  corporate_number: string | null; invoice_number: string | null; status: string;
  member_code: string; registered_at: string | null; contact_email: string;
}
interface Staff { id: number; name: string; email: string; role: string; is_active: boolean; }

const ROLE_LABEL: Record<string, string> = { platform_admin: "BASE88管理者", company_admin: "会社管理者", staff: "一般担当者" };
const TABS = [
  { key: "company", label: "会社情報" },
  { key: "staff", label: "担当者管理" },
  { key: "password", label: "パスワード変更" },
  { key: "history", label: "各種履歴" },
];

export default function MyPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("company");
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [staffMsg, setStaffMsg] = useState<string | null>(null);
  const isCompanyAdmin = user?.role === "company_admin";

  async function toggleStaff(s: Staff) {
    setStaffMsg(null);
    if (!confirm(`${s.name} を${s.is_active ? "停止" : "有効化"}しますか？`)) return;
    try {
      const res = await api<{ message: string }>(`/me/staff/${s.id}/active`, { method: "PATCH" });
      setStaffMsg(res.message);
      await loadCompany();
    } catch {
      setStaffMsg("状態の変更に失敗しました。");
    }
  }

  async function handleWithdraw() {
    await api("/me/withdraw", { method: "POST" });
    await logout();
    router.replace("/login");
  }

  async function loadCompany() {
    try {
      const [c, s] = await Promise.all([
        api<{ data: CompanyDetail | null }>("/me/company"),
        api<{ data: Staff[] }>("/me/staff"),
      ]);
      setCompany(c.data);
      setStaff(s.data);
      setError(null);
    } catch {
      setError("会社情報の取得に失敗しました。時間をおいて再度お試しください。");
    }
  }

  useEffect(() => { loadCompany().finally(() => setLoading(false)); }, []);

  return (
    <div className="animate-fade-in flex flex-1 flex-col space-y-5">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <SectionCard className="flex flex-1 flex-col">
        <div className="px-4 pt-2">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex justify-center py-10 text-brand-600"><Spinner className="h-7 w-7" /></div>
          ) : (
            <>
              {tab === "company" && (
                <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                  <div className="rounded-xl border border-ink-200">
                    <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
                      <h3 className="text-sm font-bold text-ink-800">会社情報</h3>
                      {user?.role === "company_admin" && <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>編集する</Button>}
                    </div>
                    <dl className="divide-y divide-ink-100 px-5">
                      <KV label="会社名" value={company?.name} />
                      <KV label="所在地" value={company?.address} />
                      <KV label="電話番号" value={company?.phone} />
                      <KV label="メールアドレス" value={company?.contact_email} />
                    </dl>
                  </div>
                  <div className="rounded-xl border border-ink-200">
                    <div className="border-b border-ink-100 px-5 py-3"><h3 className="text-sm font-bold text-ink-800">その他情報</h3></div>
                    <dl className="divide-y divide-ink-100 px-5">
                      <KV label="会員ID" value={company?.member_code} />
                      <KV label="登録日" value={company?.registered_at ? formatDate(company.registered_at) : "—"} />
                      <KV label="会員ステータス" value={<Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">正常</Badge>} />
                    </dl>
                  </div>
                </div>

                {isCompanyAdmin && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/40">
                    <div className="border-b border-rose-100 px-5 py-3"><h3 className="text-sm font-bold text-rose-700">退会</h3></div>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <p className="text-sm text-ink-600">退会すると加盟会社アカウントは利用停止となり、担当者はログインできなくなります。</p>
                      <Button variant="danger" onClick={() => setWithdrawOpen(true)}>退会する</Button>
                    </div>
                  </div>
                )}
                </div>
              )}

              {tab === "staff" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-ink-500">自社の担当者アカウントを管理します。</p>
                    {isCompanyAdmin && <Button size="sm" onClick={() => { setStaffMsg(null); setAddStaffOpen(true); }}>＋ 担当者を追加</Button>}
                  </div>
                  {staffMsg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{staffMsg}</div>}
                  {/* PC・タブレット: テーブル */}
                  <div className="hidden overflow-x-auto rounded-xl border border-ink-200 md:block">
                    <table className="dtable">
                      <thead><tr><th>担当者名</th><th>メールアドレス</th><th>権限</th><th>状態</th>{isCompanyAdmin && <th className="text-right">操作</th>}</tr></thead>
                      <tbody>
                        {staff.map((s) => (
                          <tr key={s.id}>
                            <td className="font-medium text-ink-800">{s.name}{s.id === user?.id && <span className="ml-2 text-xs text-ink-400">(あなた)</span>}</td>
                            <td className="text-ink-600">{s.email}</td>
                            <td><Badge tone="bg-brand-50 text-brand-700 ring-brand-600/20">{ROLE_LABEL[s.role] ?? s.role}</Badge></td>
                            <td>{s.is_active ? <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">有効</Badge> : <Badge tone="bg-ink-100 text-ink-500 ring-ink-500/20">停止</Badge>}</td>
                            {isCompanyAdmin && (
                              <td className="text-right">
                                {s.id !== user?.id && (
                                  <Button size="sm" variant={s.is_active ? "danger" : "secondary"} onClick={() => toggleStaff(s)}>
                                    {s.is_active ? "停止" : "有効化"}
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* スマホ: カード */}
                  <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 md:hidden">
                    {staff.map((s) => (
                      <li key={s.id} className="px-4 py-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-ink-800">{s.name}{s.id === user?.id && <span className="ml-2 text-xs text-ink-400">(あなた)</span>}</span>
                          {s.is_active ? <Badge tone="bg-emerald-50 text-emerald-700 ring-emerald-600/20">有効</Badge> : <Badge tone="bg-ink-100 text-ink-500 ring-ink-500/20">停止</Badge>}
                        </div>
                        <div className="mt-0.5 break-all text-sm text-ink-600">{s.email}</div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/20">{ROLE_LABEL[s.role] ?? s.role}</Badge>
                          {isCompanyAdmin && s.id !== user?.id && (
                            <Button size="sm" variant={s.is_active ? "danger" : "secondary"} onClick={() => toggleStaff(s)}>
                              {s.is_active ? "停止" : "有効化"}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tab === "password" && <PasswordForm />}

              {tab === "history" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <HistoryLink href="/my/jobs" label="掲載履歴" desc="自社が掲載した案件" />
                  <HistoryLink href="/my/applications" label="応募履歴" desc="自社が応募した案件" />
                  <HistoryLink href="/my/contracts" label="成約履歴" desc="成約した案件・顧客情報" />
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>

      {editOpen && company && <EditCompanyModal company={company} onClose={() => setEditOpen(false)} onSaved={async () => { setEditOpen(false); await loadCompany(); }} />}
      {addStaffOpen && <AddStaffModal onClose={() => setAddStaffOpen(false)} onAdded={async (msg) => { setAddStaffOpen(false); setStaffMsg(msg); await loadCompany(); }} />}
      {withdrawOpen && <WithdrawModal companyName={company?.name ?? ""} onClose={() => setWithdrawOpen(false)} onConfirm={handleWithdraw} />}
    </div>
  );
}

function AddStaffModal({ onClose, onAdded }: { onClose: () => void; onAdded: (msg: string) => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "staff" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ message: string }>("/me/staff", { method: "POST", body: form });
      onAdded(res.message);
    } catch (err) {
      const m = err instanceof ApiError ? ((err.body as { errors?: Record<string, string[]>; message?: string }).errors?.email?.[0] ?? (err.body as { message?: string }).message) : null;
      setError(m ?? "追加に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={save} className="relative my-auto max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-ink-900">担当者を追加</h3>
        <p className="text-xs text-ink-500">追加した担当者にはパスワード設定用の招待メールが送信されます。</p>
        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}
        <Field label="担当者名" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="山田 太郎" /></Field>
        <Field label="メールアドレス" required><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="staff@company.co.jp" /></Field>
        <Field label="権限" required>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="staff">一般担当者</option>
            <option value="company_admin">会社管理者</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>キャンセル</Button>
          <Button type="submit" loading={busy}>追加して招待</Button>
        </div>
      </form>
    </div>
  );
}

function WithdrawModal({ companyName, onClose, onConfirm }: { companyName: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError("退会手続きに失敗しました。時間をおいて再度お試しください。");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative my-auto max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-rose-700">退会の確認</h3>
        <p className="text-sm text-ink-600">
          退会すると、<span className="font-semibold">{companyName}</span> の加盟会社アカウントは利用停止となり、すべての担当者がログインできなくなります。この操作は元に戻せません。
        </p>
        <p className="text-sm text-ink-600">続行するには <span className="font-mono font-bold">退会する</span> と入力してください。</p>
        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="退会する" />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>キャンセル</Button>
          <Button variant="danger" loading={busy} disabled={confirmText !== "退会する"} onClick={submit}>退会を確定する</Button>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink-800">{value || "—"}</dd>
    </div>
  );
}

function HistoryLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="rounded-xl border border-ink-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50">
      <div className="font-semibold text-ink-900">{label}</div>
      <div className="mt-0.5 text-xs text-ink-500">{desc}</div>
    </Link>
  );
}

function PasswordForm() {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [conf, setConf] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api("/me/password", { method: "PUT", body: { current_password: cur, password: pw, password_confirmation: conf } });
      setMsg({ ok: true, text: "パスワードを変更しました。" });
      setCur(""); setPw(""); setConf("");
    } catch (err) {
      const m = err instanceof ApiError ? ((err.body as { errors?: Record<string, string[]>; message?: string }).errors?.current_password?.[0] ?? (err.body as { errors?: Record<string, string[]> }).errors?.password?.[0] ?? (err.body as { message?: string }).message) : null;
      setMsg({ ok: false, text: m ?? "変更に失敗しました。" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-5">
      {msg && <div className={`rounded-lg px-4 py-3 text-sm ${msg.ok ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>{msg.text}</div>}
      <Field label="現在のパスワード" required><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required /></Field>
      <Field label="新しいパスワード" required hint="8文字以上"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></Field>
      <Field label="新しいパスワード（確認）" required><Input type="password" value={conf} onChange={(e) => setConf(e.target.value)} required /></Field>
      <Button type="submit" loading={busy}>変更する</Button>
    </form>
  );
}

function EditCompanyModal({ company, onClose, onSaved }: { company: CompanyDetail; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: company.name, address: company.address ?? "", phone: company.phone ?? "", corporate_number: company.corporate_number ?? "", invoice_number: company.invoice_number ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/me/company", { method: "PUT", body: form });
      onSaved();
    } catch {
      setError("更新に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={save} className="relative my-auto max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-ink-900">会社情報を編集</h3>
        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}
        <Field label="会社名" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
        <Field label="所在地"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="電話番号"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="法人番号"><Input value={form.corporate_number} onChange={(e) => setForm({ ...form, corporate_number: e.target.value })} /></Field>
          <Field label="インボイス番号"><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>キャンセル</Button>
          <Button type="submit" loading={busy}>保存する</Button>
        </div>
      </form>
    </div>
  );
}
