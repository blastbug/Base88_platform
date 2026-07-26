"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/* ---------- Badge ---------- */
export function Badge({ children, tone }: { children: ReactNode; tone: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}>
      {children}
    </span>
  );
}

/* ---------- Button ---------- */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
export function Button({
  variant = "primary",
  loading,
  size,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; size?: "sm" }) {
  return (
    <button className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size,
  href,
  className = "",
  children,
}: {
  variant?: Variant;
  size?: "sm";
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`}>
      {children}
    </Link>
  );
}

/* ---------- Spinner ---------- */
export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ animation: "spin 0.6s linear infinite" }}
      aria-label="読み込み中"
    />
  );
}

/* ---------- Form ---------- */
export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-700">
        {label}
        {required && <span className="rounded bg-rose-50 px-1 text-[10px] font-bold text-rose-600 ring-1 ring-rose-200">必須</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input-base ${props.className ?? ""}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`input-base ${props.className ?? ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`input-base ${props.className ?? ""}`} />;
}

/* ---------- StatCard (label + big number + colored icon) ---------- */
export function StatCard({
  label,
  value,
  unit,
  icon,
  tone = "bg-brand-50 text-brand-600",
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <div className="card flex items-start justify-between p-5">
      <div>
        <div className="text-sm font-medium text-ink-500">{label}</div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-ink-900">
          {value}
          {unit && <span className="ml-1 text-base font-semibold text-ink-500">{unit}</span>}
        </div>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-ink-200">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative -mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              on ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-800"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${on ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-500"}`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Pagination ---------- */
export function Pagination({ page, lastPage, onPage }: { page: number; lastPage: number; onPage: (p: number) => void }) {
  if (lastPage <= 1) return null;
  const pages: (number | "…")[] = [];
  const push = (p: number) => pages.push(p);
  push(1);
  const start = Math.max(2, page - 1);
  const end = Math.min(lastPage - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) push(p);
  if (end < lastPage - 1) pages.push("…");
  if (lastPage > 1) push(lastPage);

  return (
    <div className="mt-5 flex items-center justify-center gap-1">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="rounded-md border border-ink-200 px-2.5 py-1.5 text-sm text-ink-500 disabled:opacity-40 hover:bg-ink-50">
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-sm text-ink-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`min-w-9 rounded-md border px-2.5 py-1.5 text-sm font-medium ${
              p === page ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 text-ink-600 hover:bg-ink-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button onClick={() => onPage(page + 1)} disabled={page >= lastPage} className="rounded-md border border-ink-200 px-2.5 py-1.5 text-sm text-ink-500 disabled:opacity-40 hover:bg-ink-50">
        ›
      </button>
    </div>
  );
}

/* ---------- Stepper (wizard progress) ---------- */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  active ? "bg-brand-600 text-white" : done ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`hidden text-sm font-semibold sm:inline ${active ? "text-ink-900" : done ? "text-brand-700" : "text-ink-400"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`mx-3 h-px flex-1 ${done ? "bg-brand-300" : "bg-ink-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- EmptyState ---------- */
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-sm font-semibold text-ink-700">{title}</div>
      {description && <div className="max-w-sm text-sm text-ink-500">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ---------- Card section header ---------- */
export function SectionCard({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          {title && <h2 className="text-base font-bold text-ink-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
