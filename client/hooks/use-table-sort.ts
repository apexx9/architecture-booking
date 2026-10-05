"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  SortDirection,
  SortState,
} from "@/components/workspace/data-view";

/**
 * Client-side column sorting for `DataView`.
 *
 * Sorting runs on the rows a page has already loaded, which is the same
 * constraint as the per-page search: there is no server-side sort to defer to.
 * The list is fetched whole, so a user who is sorting is sorting the complete
 * set, not a page of it.
 *
 * Toggling a column cycles ascending → descending → ascending, which is what a
 * two-state control should do. Re-selecting the same column deliberately does
 * not reset to unsorted: a column is either sorted one way or the other, and a
 * third hidden state leaves the user unsure what they are looking at.
 */
export function useTableSort<T>(
  rows: T[],
  /**
   * Receives the active sort key so one comparator can switch between columns
   * without the caller having to hold a second copy of the sort state. Reading it
   * from inside the comparator is what keeps the hook free of a dependency cycle
   * with the caller's own memoisation.
   */
  compare: (key: string | null, a: T, b: T) => number,
  initialKey: string | null = null,
) {
  const [sort, setSort] = useState<SortState>({
    key: initialKey,
    direction: "asc",
  });

  const onSortChange = useCallback((key: string) => {
    setSort((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sorted = useMemo(() => {
    if (!sort.key) return rows;

    const direction = sort.direction === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => compare(sort.key, a, b) * direction);
  }, [rows, sort, compare]);

  return { sort, onSortChange, sorted };
}

/**
 * Compares by a derived value, with nullish values always last regardless of
 * direction — a missing date is not "the earliest", it is simply absent, and
 * letting it sort to the top of a descending list buries the real work.
 */
export function compareBy<T>(
  getValue: (row: T) => string | number | null | undefined,
) {
  return (a: T, b: T) => {
    const left = getValue(a);
    const right = getValue(b);

    const leftMissing = left === null || left === undefined || left === "";
    const rightMissing = right === null || right === undefined || right === "";

    if (leftMissing && rightMissing) return 0;
    if (leftMissing) return 1;
    if (rightMissing) return -1;

    if (typeof left === "number" && typeof right === "number") {
      return left - right;
    }

    return String(left).localeCompare(String(right), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  };
}

export type { SortDirection, SortState };
