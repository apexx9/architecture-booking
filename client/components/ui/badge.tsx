import type { ReactNode } from "react";

/**
 * Small tone-carrying label.
 *
 * Tone is the only visual axis. Every tone is a *pair* — a tinted surface plus a
 * darker text colour that clears AA — because tint alone does not convey meaning
 * to someone who cannot distinguish it, and a badge is never the sole carrier of
 * state anyway.
 *
 * `tone="neutral"` is the default: if a caller has not decided what a label
 * means, it should not be coloured as though they had.
 */
export type BadgeTone = "neutral" | "positive" | "warning" | "danger" | "info";

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: "border-line bg-surface-sunken text-ink-muted",
  positive: "border-success/30 bg-success/10 text-success",
  warning: "border-caution/30 bg-caution/10 text-caution",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-line-strong/40 bg-surface-subtle text-ink",
};

const DOT_STYLES: Record<BadgeTone, string> = {
  neutral: "bg-ink-subtle",
  positive: "bg-success",
  warning: "bg-caution",
  danger: "bg-danger",
  info: "bg-ink",
};

export interface BadgeProps {
  tone?: BadgeTone;
  /** Leading dot. Adds a non-colour cue and reads well in dense tables. */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5",
        "text-[11px] font-medium whitespace-nowrap",
        TONE_STYLES[tone],
        className ?? "",
      ].join(" ")}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${DOT_STYLES[tone]}`}
        />
      ) : null}
      {children}
    </span>
  );
}

export default Badge;
