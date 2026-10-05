import type { ReactNode } from "react";

/**
 * The strip between a page header and its data: search, filters, and the count.
 *
 * Sits on a hairline rather than in a card. A toolbar is chrome around the data,
 * not a container for it, and giving it edges would put a second border on screen
 * for no informational gain.
 *
 * `count` is a separate prop rather than being inferred, because the honest
 * number is rarely the total: it is what survives the current search and filter,
 * and saying so is the point.
 */

interface PageToolbarProps {
  /** Search input. */
  children?: ReactNode;
  /** Right-aligned filter controls. */
  filters?: ReactNode;
  /** Live result count. Keep it short — "12 of 48". */
  count?: ReactNode;
  className?: string;
  /** Pins the toolbar under the context bar while the data scrolls. */
  sticky?: boolean;
}

export function PageToolbar({
  children,
  filters,
  count,
  className,
  sticky = false,
}: PageToolbarProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-y border-line py-3",
        sticky ? "sticky top-0 z-10 bg-surface" : "",
        className ?? "",
      ].join(" ")}
    >
      {children && <div className="w-full max-w-xs sm:w-64">{children}</div>}

      {filters && (
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      )}

      {count && (
        <p className="text-[13px] text-ink-subtle tabular-nums">{count}</p>
      )}
    </div>
  );
}

export default PageToolbar;