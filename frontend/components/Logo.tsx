/**
 * BASE88 ロゴ（トラック×ヘキサゴンのマーク＋ワードマーク）。
 * variant: "light"（濃色背景・白文字） / "dark"（明色背景・濃色文字）
 */
export function Logo({
  variant = "light",
  tagline = false,
  size = "md",
}: {
  variant?: "light" | "dark";
  tagline?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const mark = size === "lg" ? "h-14" : size === "sm" ? "h-8" : "h-9";
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-lg";
  const base = variant === "light" ? "text-white" : "text-ink-900";
  const acc = variant === "light" ? "text-brand-400" : "text-brand-500";
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/base88-mark.png" alt="BASE88" className={`${mark} w-auto shrink-0`} />
      <div className="text-left leading-none">
        <div className={`${text} font-extrabold tracking-tight`}>
          <span className={base}>BASE</span>
          <span className={acc}>88</span>
        </div>
        {tagline && <div className="mt-1.5 text-xs font-medium text-ink-400">引越し案件共有プラットフォーム</div>}
      </div>
    </div>
  );
}
