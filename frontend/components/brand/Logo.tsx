export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
          <path d="M3 13.5 12 4l9 9.5M5.5 11.5V19a1 1 0 0 0 1 1h4v-5h3v5h4a1 1 0 0 0 1-1v-7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={light ? "text-white" : "text-ink-900"}>
        BASE<span className="text-brand-600">88</span>
      </span>
    </span>
  );
}
