/**
 * Cursor pagination types and helpers, per §22.1.
 *
 * The API contract is one-directional:
 *
 * ```json
 * {
 *   "data": [],
 *   "meta": { "nextCursor": "...", "hasNextPage": true }
 * }
 * ```
 *
 * There is no `previousCursor`. Going back therefore means the client keeping the
 * cursors it has already been handed, which is what a `CursorHistory` is. These are
 * pure functions over that history — no fetching, no React, no store. The list
 * query that owns the data decides when to call them and caches each page's `meta`
 * alongside its cursor.
 */

export interface PageMeta {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PageMeta;
}

/** The query string for a page. Omitted for the first page. */
export interface CursorParams {
  limit?: number;
  cursor?: string;
}

/**
 * Cursors already visited, oldest first. Index 0 is the first page, which is
 * fetched with no cursor at all, so it is `undefined` rather than `""`.
 */
export type CursorHistory = readonly (string | undefined)[];

/** The starting history: one entry, the un-cursored first page. */
export const INITIAL_CURSOR_HISTORY: CursorHistory = [undefined];

/** Cursor for the page currently in view — the top of the stack. */
export function currentCursor(history: CursorHistory): string | undefined {
  return history[history.length - 1];
}

/** True when there is an earlier page to return to. */
export function canGoBack(history: CursorHistory): boolean {
  return history.length > 1;
}

/** Query params for the page currently in view. */
export function cursorParams(
  history: CursorHistory,
  options: { limit?: number } = {},
): CursorParams {
  const cursor = currentCursor(history);
  return cursor === undefined
    ? { limit: options.limit }
    : { limit: options.limit, cursor };
}

/**
 * Records the cursor leading to the next page, then moves to it.
 *
 * A `null` nextCursor means there is nothing further, so the history is left alone.
 * When the user goes back and then forward again, `truncate` discards the abandoned
 * branch so the history stays a path rather than a tree.
 */
export function advance(
  history: CursorHistory,
  meta: PageMeta,
): CursorHistory {
  if (!meta.hasNextPage || meta.nextCursor === null) return history;
  return [...history, meta.nextCursor];
}

/** Moves back one page. No-op when already on the first page. */
export function retreat(history: CursorHistory): CursorHistory {
  return canGoBack(history) ? history.slice(0, -1) : history;
}

/** Drops everything after the page in view, so a forward load starts from there. */
export function truncateAfter(
  history: CursorHistory,
  pageIndex: number,
): CursorHistory {
  return history.slice(0, pageIndex + 1);
}
