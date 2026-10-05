import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * One column definition, two presentations.
 *
 * This is the answer to "high information density, low visual noise". A table is
 * the right form for structured records and the wrong form at 375px, so the same
 * column set is declared once and rendered as a table from `md` up and as compact
 * rows below it. Declaring the columns in one place is what stops the two
 * presentations from drifting apart and showing different data.
 *
 * Interaction rules:
 * - The row responds to clicks, but never at the cost of the controls inside it.
 *   A click that lands on a link, button or field belongs to that element.
 * - The row is never focusable. Keyboard users reach the same destination
 *   through the real link in the primary cell, which carries an accessible name
 *   and supports middle-click and "open in new tab".
 */

export interface DataColumn<T> {
  /** Stable key, also the sort key. */
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Width hint, e.g. `"w-40"`. Worth setting when a column would otherwise jump. */
  width?: string;
  align?: "left" | "center" | "right";
  /** Tabular numerals. Set on every date, count and money column. */
  numeric?: boolean;
  /** Drop the column below this breakpoint rather than squashing it. */
  hideBelowMd?: boolean;
  hideBelowLg?: boolean;
  /** Allow sorting. Requires `sort` and `onSortChange`. */
  sortable?: boolean;
  /** Extra classes shared by the header and body cells so alignment cannot drift. */
  className?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string | null;
  direction: SortDirection;
}

interface DataViewProps<T> {
  /** Names the table, and the mobile list, for assistive technology. */
  label: string;
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;

  /** Mobile primary line. Should be the thing that identifies the record. */
  primary: (row: T) => ReactNode;
  /** Mobile secondary line, for disambiguating context. */
  secondary?: (row: T) => ReactNode;
  /** Mobile metadata row — statuses, dates, counts. */
  meta?: (row: T) => ReactNode;
  /** Row actions, rendered in both presentations. */
  actions?: (row: T) => ReactNode;

  /** Where a row leads, when the record has a detail page. */
  rowHref?: (row: T) => string | undefined;
  /** Called when the row body is clicked outside any interactive element. */
  onRowClick?: (row: T) => void;

  /** Rendered in place of both presentations when `rows` is empty. */
  empty?: ReactNode;

  sort?: SortState;
  onSortChange?: (key: string) => void;
}

/** Clicking inside a control must not also activate the row. */
const INTERACTIVE = "a, button, input, select, textarea, [role='button']";

const columnClasses = (column: DataColumn<never>) =>
  [
    column.hideBelowMd ? "hidden md:table-cell" : "",
    column.hideBelowLg ? "hidden lg:table-cell" : "",
  ]
    .join(" ")
    .trim();

function SortButton({
  column,
  state,
  onSortChange,
}: {
  column: DataColumn<never>;
  state: SortState;
  onSortChange: (key: string) => void;
}) {
  const active = state.key === column.key;

  const Icon = !active
    ? ChevronsUpDown
    : state.direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSortChange(column.key)}
      className={[
        "-ml-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5",
        "text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        active ? "text-ink" : "text-ink-muted hover:text-ink",
      ].join(" ")}
    >
      {column.header}

      <Icon
        className={`size-3 ${active ? "text-ink" : "text-ink-subtle"}`}
        aria-hidden="true"
      />

      {/* Announced instead of the icon, which conveys nothing to a screen reader. */}
      <span className="sr-only">
        {active
          ? `sorted ${state.direction === "asc" ? "ascending" : "descending"}`
          : "not sorted"}
      </span>
    </button>
  );
}

export function DataView<T>({
  label,
  columns,
  rows,
  rowKey,
  primary,
  secondary,
  meta,
  actions,
  rowHref,
  onRowClick,
  empty,
  sort,
  onSortChange,
}: DataViewProps<T>) {
  const router = useRouter();

  const activate = (row: T) => {
    const href = rowHref?.(row);

    if (href) {
      router.push(href);

      return;
    }

    onRowClick?.(row);
  };

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowClick && !rowHref) return;
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return;

    activate(row);
  };

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <>
      <div className="hidden md:block">
        <Table label={label}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  align={column.align}
                  width={column.width}
                  numeric={column.numeric}
                  className={[columnClasses(column), column.className ?? ""].join(" ")}
                >
                  {column.sortable && sort && onSortChange ? (
                    <SortButton column={column} state={sort} onSortChange={onSortChange} />
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}

              {actions && (
                <TableHead width="w-px" align="right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => {
              const href = rowHref?.(row);
              const [first] = columns;
              const rest = columns.slice(1);

              return (
                <TableRow
                  key={rowKey(row)}
                  interactive={Boolean(onRowClick || href)}
                  onClick={(event) => handleRowClick(event, row)}
                >
                  {first && (
                    <TableCell
                      align={first.align}
                      numeric={first.numeric}
                      width={first.width}
                      className={[columnClasses(first), first.className ?? ""].join(" ")}
                    >
                      {href ? (
                        <Link
                          href={href}
                          className="rounded-sm font-medium text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                        >
                          {first.cell(row)}
                        </Link>
                      ) : (
                        <span className="font-medium text-ink">
                          {first.cell(row)}
                        </span>
                      )}
                    </TableCell>
                  )}

                  {rest.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align}
                      numeric={column.numeric}
                      className={[columnClasses(column), column.className ?? ""].join(" ")}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}

                  {actions && (
                    <TableCell align="right" className="w-px">
                      <div className="flex items-center justify-end gap-1.5">
                        {actions(row)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-line border-y border-line md:hidden">
        {rows.map((row) => {
          const href = rowHref?.(row);

          return (
            <li key={rowKey(row)} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-ink">
                    {href ? (
                      <Link
                        href={href}
                        className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        {primary(row)}
                      </Link>
                    ) : (
                      primary(row)
                    )}
                  </div>

                  {secondary && (
                    <div className="mt-0.5 text-[13px] text-ink-subtle">
                      {secondary(row)}
                    </div>
                  )}
                </div>

                {actions && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    {actions(row)}
                  </div>
                )}
              </div>

              {meta && (
                <div className="mt-2 flex flex-wrap items-center gap-2">{meta(row)}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default DataView;