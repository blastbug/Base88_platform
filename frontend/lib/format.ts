import type { ApplicationStatus, JobStatus } from "./types";

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export const TRUCK_SIZES = [
  "軽トラック", "1トン", "2トンショート", "2トンロング", "3トン", "4トン", "その他",
];

export const BUILDING_TYPES = [
  "アパート", "マンション", "タワーマンション", "戸建て", "オフィス", "その他",
];

export const TIME_SLOTS = ["午前指定", "午後指定", "時間帯指定", "フリー便", "指定なし"];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  recruiting: "募集中",
  closed: "募集終了",
  contracted: "成約済",
  completed: "完了",
  cancelled: "キャンセル",
};

/** ステータスごとの配色（Badge 用のクラス断片） */
export const JOB_STATUS_TONE: Record<JobStatus, string> = {
  recruiting: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  closed: "bg-ink-100 text-ink-600 ring-ink-500/20",
  contracted: "bg-brand-50 text-brand-700 ring-brand-600/20",
  completed: "bg-ink-100 text-ink-600 ring-ink-500/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

/** 表示用ステータス。募集中でも締切超過なら「締切」（オレンジ）を返す。 */
export function displayJobStatus(status: JobStatus, deadlineIso?: string | null): { label: string; tone: string } {
  if (status === "recruiting" && deadlineIso) {
    const past = new Date(deadlineIso).getTime() <= Date.now();
    if (past) return { label: "締切", tone: "bg-amber-50 text-amber-700 ring-amber-600/20" };
  }
  return { label: JOB_STATUS_LABEL[status], tone: JOB_STATUS_TONE[status] };
}

/** 一覧向けステータス（募集中・締切間近・募集終了・成約済・完了）。締切5日以内は「締切間近」。 */
export function listJobStatus(status: JobStatus, deadlineIso?: string | null): { label: string; tone: string } {
  const GREEN = "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  const AMBER = "bg-amber-50 text-amber-700 ring-amber-600/20";
  const ROSE = "bg-rose-50 text-rose-700 ring-rose-600/20";
  const BRAND = "bg-brand-50 text-brand-700 ring-brand-600/20";
  const INK = "bg-ink-100 text-ink-600 ring-ink-500/20";
  if (status === "recruiting") {
    if (deadlineIso) {
      const diff = new Date(deadlineIso).getTime() - Date.now();
      if (diff <= 0) return { label: "募集終了", tone: ROSE };
      if (diff <= 5 * 86400000) return { label: "締切間近", tone: AMBER };
    }
    return { label: "募集中", tone: GREEN };
  }
  if (status === "closed") return { label: "募集終了", tone: ROSE };
  if (status === "contracted") return { label: "成約済", tone: BRAND };
  if (status === "completed") return { label: "完了", tone: INK };
  return { label: "キャンセル", tone: ROSE };
}

/**
 * 案件表示コード（例: T-2026-0815-001）。
 * 管理者が登録した案件ID（stored）があればそれを優先し、無ければ moving_date と id から生成。
 */
export function jobCode(id: number, movingIso?: string | null, stored?: string | null): string {
  if (stored && stored.trim()) return stored.trim();
  const d = movingIso ? new Date(movingIso) : null;
  const datePart = d && !isNaN(d.getTime())
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
    : "0000-0000";
  return `T-${datePart}-${String(id).padStart(3, "0")}`;
}

/** 曜日付きの日付（例: 2026/08/15 (金)） */
export function formatDateDow(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} (${dow})`;
}

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: "応募中",
  accepted: "成約",
  rejected: "不成立",
};

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, string> = {
  applied: "bg-brand-50 text-brand-700 ring-brand-600/20",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-ink-100 text-ink-500 ring-ink-500/20",
};

export function formatYen(value?: number | null): string {
  if (value === null || value === undefined) return "応相談";
  return "¥" + value.toLocaleString("ja-JP");
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 締切までの残り。過ぎていれば「締切済」 */
export function deadlineLabel(iso?: string | null): { text: string; urgent: boolean; past: boolean } {
  if (!iso) return { text: "—", urgent: false, past: false };
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (diffMs <= 0) return { text: "締切済", urgent: false, past: true };
  const days = Math.floor(diffMs / 86400000);
  if (days >= 1) return { text: `残り${days}日`, urgent: days <= 2, past: false };
  const hours = Math.floor(diffMs / 3600000);
  return { text: `残り${hours}時間`, urgent: true, past: false };
}

export function route(from: string, fromCity: string | null, to: string, toCity: string | null): string {
  const f = from + (fromCity ? " " + fromCity : "");
  const t = to + (toCity ? " " + toCity : "");
  return `${f} → ${t}`;
}

/** 「荷物量 / 間取り」列の表示（例: 2LDK / 2tトラック1台程度） */
export function luggageLayout(layout: string | null, luggage: string): string {
  return layout ? `${layout} / ${luggage}` : luggage;
}

/** 短い日付 M/D */
export function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
