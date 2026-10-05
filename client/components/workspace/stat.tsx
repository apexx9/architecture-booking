import type { ReactNode } from "react";
import Link from "next/link";

/**
 * A figure, a label, and optionally a destination.
 *
 * Not a card. The brief's "attention" region needs to read as a strip of numbers
 * rather than four more bordered boxes, so this is typography: a tabular figure
 * at display weight, a label beneath it, and a hairline between neighbours. The
 * colour is reserved for when the number is a problem — a count of zero that
 * means nothing is left monochrome rather than coloured as a warning.
 *
 * `href` turns the whole thing into a link, which is what makes the strip
 * actionable: a number you can click through to the thing it counted.
 */

export type StatTone = "neutral" | "positive" | "warning" | "danger";

const TONE_STYLES: Record<StatTone, string> = {
  neutral: "text-ink",
  positive: "text-success",
  warning: "text-caution",
  danger: "text-danger",
};

interface StatProps {
  value: ReactNode;
  label: string;
  /** A short qualifier under the label — "across 4 projects", "needs review". */
  hint?: ReactNode;
  tone?: StatTone;
  href?: string;
  /** Appends "s" based on the value. Use for genuinely countable nouns. */
  pluralLabel?: string;
  className?: string;
}

export function Stat({
  value,
  label,
  hint,
  tone = "neutral",
  href,
  pluralLabel,
  className,
}: StatProps) {
  const isPlural =
    pluralLabel !== undefined && typeof value === "number" && value !== 1;

  const body = (
    <>
      <span
        className={[
          "block font-display text-[30px] leading-none font-light tabular-nums",
          TONE_STYLES[tone],
        ].join(" ")}
      >
        {value}
      </span>

      <span className="mt-2 block text-[13px] leading-snug text-ink-muted">
        {isPlural ? pluralLabel : label}
      </span>

      {hint && (
        <span className="mt-0.5 block text-[12px] leading-snug text-ink-subtle">
          {hint}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={[
          "block rounded-sm px-4 py-4 transition-colors",
          "hover:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
          className ?? "",
        ].join(" ")}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={`px-4 py-4 ${className ?? ""}`}>{body}</div>
  );
}

/**
 * A horizontal strip of stats divided by hairlines rather than gaps.
 *
 * Scrolls on narrow screens instead of wrapping, because a wrapped strip turns
 * into a grid of small boxes — the exact card pattern this replaces.
 */
export function StatStrip({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={[
        "flex snap-x snap-mandatory overflow-x-auto",
        "divide-x divide-line border-y border-line",
        "[&>*]:shrink-0",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default Stat;