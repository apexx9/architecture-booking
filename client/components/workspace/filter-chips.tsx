import type { ReactNode } from "react";

/**
 * Single-select filter chips.
 *
 * A `Select` is the wrong control here. Status filtering is choosing between
 * three to eight known values that fit on one line, and a chip row keeps the
 * current filter visible instead of hiding it inside a collapsed dropdown —
 * which matters because the chip is also the count's home.
 *
 * Only genuinely distinct values are offered. Options are built from the
 * statuses actually present in the data, so a practice that has never issued a
 * drawing is not shown a filter for issuing drawings.
 */

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  /** Rendered after the label in tabular numerals. */
  count?: number;
}

interface FilterChipsProps<T extends string> {
  /** Accessible name for the group. */
  label: string;
  options: FilterOption<T>[];
  value: T | "all";
  onChange: (value: T | "all") => void;
  /** Label for the "show everything" chip. */
  allLabel?: string;
  className?: string;
}

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  allLabel = "All",
  className,
}: FilterChipsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={["flex flex-wrap items-center gap-1.5", className ?? ""].join(" ")}
    >
      <Chip active={value === "all"} onClick={() => onChange("all")}>
        {allLabel}
      </Chip>

      {options.map((option) => (
        <Chip
          key={option.value}
          active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}

          {option.count !== undefined && (
            <span className="ml-1.5 text-ink-subtle tabular-nums">
              {option.count}
            </span>
          )}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center rounded-sm border px-2.5 py-1 text-[13px]",
        "transition-colors duration-150 motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        active
          ? "border-line-strong bg-surface-subtle text-ink"
          : "border-line bg-transparent text-ink-muted hover:bg-surface-subtle hover:text-ink",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default FilterChips;