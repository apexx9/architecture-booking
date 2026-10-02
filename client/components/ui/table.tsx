import type { ReactNode } from "react";

/**
 * Table primitives.
 *
 * Composable rather than configured: a `Table` with a dozen boolean props cannot
 * express the column layouts these screens need, so the pieces are exported and
 * the caller composes them.
 *
 * Alignment follows DESIGN.md — numeric columns right-align and use tabular
 * numerals so digits line up down the column. Headers are sentence case, not
 * uppercase, and the table carries a name for assistive technology.
 */

type Alignment = "left" | "center" | "right";

const ALIGN_STYLES: Record<Alignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export interface TableProps {
  /**
   * Names the table. Rendered as a visually hidden `<caption>`, so a screen
   * reader announces what the table contains rather than just "table".
   */
  label: string;
  children: ReactNode;
  className?: string;
}

export function Table({ label, children, className }: TableProps) {
  return (
    /*
     * A horizontally scrollable region must be reachable by keyboard, otherwise
     * columns past the fold are mouse-only. `role` + `aria-label` give that tab
     * stop a name instead of leaving it anonymous.
     */
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="w-full overflow-x-auto rounded-sm border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <table
        className={`w-full border-collapse text-[13px] text-ink ${className ?? ""}`}
      >
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
  );
}

export interface TableSectionProps {
  children: ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableSectionProps) {
  return (
    <thead className={`border-b border-line bg-surface-subtle ${className ?? ""}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableSectionProps) {
  return <tbody className={className}>{children}</tbody>;
}

/** Totals or summary row, pinned below the body with a heavier rule. */
export function TableFooter({ children, className }: TableSectionProps) {
  return (
    <tfoot className={`border-t border-line bg-surface-subtle ${className ?? ""}`}>
      {children}
    </tfoot>
  );
}

export interface TableRowProps {
  children: ReactNode;
  /** Highlights on hover. Use when the whole row is clickable or selectable. */
  interactive?: boolean;
  selected?: boolean;
  className?: string;
}

export function TableRow({
  children,
  interactive = false,
  selected = false,
  className,
}: TableRowProps) {
  return (
    <tr
      aria-selected={selected || undefined}
      className={[
        "border-b border-line-muted last:border-b-0",
        "transition-colors duration-150 motion-reduce:transition-none",
        interactive ? "cursor-pointer hover:bg-surface-subtle" : "",
        selected ? "bg-surface-subtle" : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </tr>
  );
}

export interface TableHeadProps {
  children?: ReactNode;
  align?: Alignment;
  /** Width hint, e.g. `"w-32"`. Use when columns would otherwise jump. */
  width?: string;
  className?: string;
}

export function TableHead({
  children,
  align = "left",
  width,
  className,
}: TableHeadProps) {
  return (
    <th
      scope="col"
      className={[
        "px-4 py-2.5",
        "text-[12px] font-medium text-ink-muted whitespace-nowrap",
        ALIGN_STYLES[align],
        width ?? "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

export interface TableCellProps {
  children?: ReactNode;
  align?: Alignment;
  /**
   * Applies tabular numerals. Set alongside `align="right"` on any column of
   * quantities, dates, counts or money.
   */
  numeric?: boolean;
  className?: string;
}

export function TableCell({
  children,
  align = "left",
  numeric = false,
  className,
}: TableCellProps) {
  return (
    <td
      className={[
        "px-4 py-3 align-middle",
        ALIGN_STYLES[align],
        numeric ? "tabular-nums" : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

export interface TableEmptyProps {
  /** Must equal the number of columns, or the cell will not span the row. */
  colSpan: number;
  children: ReactNode;
}

/** Row that spans the table when there is nothing to show. Put an `EmptyState` in it. */
export function TableEmpty({ colSpan, children }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan}>{children}</td>
    </tr>
  );
}
