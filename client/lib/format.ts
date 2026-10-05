/**
 * Presentation-only formatting.
 *
 * These helpers exist so that the same value reads the same way on every
 * screen. Counts, dates and amounts are all rendered inline in list rows and
 * card headers, which is exactly where five copies of the same logic drifted
 * apart before.
 *
 * Nothing here decides what a value means — only how it is written.
 */

/**
 * `pluralise(1, "project")` → "1 project", `pluralise(0, "project")` →
 * "0 projects".
 *
 * The plural is derived from the singular rather than hard-coded at each call
 * site, which is what let "1 projects" reach five pages. Pass `plural` only for
 * nouns whose plural is not the singular plus "s".
 */
export function pluralise(
  count: number,
  singular: string,
  plural?: string,
): string {
  const noun = count === 1 ? singular : (plural ?? `${singular}s`);

  return `${count} ${noun}`;
}

/**
 * A date as "12 Mar 2026", or `null` for an absent or unparseable value.
 *
 * `en-GB` is deliberate: the practice is Ghana-first, where the day-month-year
 * order is the expected one.
 *
 * Returns `null` rather than "Invalid Date" so callers can omit the whole
 * fragment instead of rendering a broken-looking row.
 */
export function formatDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * A start/end pair as one compact phrase: "12 Mar – 4 Jun 2026", or the full
 * form when the two dates fall in different years.
 *
 * Returns `null` when neither end is set, and collapses to the single date when
 * only one is, so a half-specified range never reads as two blanks.
 */
export function formatDateRange(
  start?: string | null,
  end?: string | null,
): string | null {
  const from = formatDate(start);
  const to = formatDate(end);

  if (!from || !to) {
    return from ?? to;
  }

  const sameYear =
    new Date(start as string).getFullYear() === new Date(end as string).getFullYear();

  // Within one year the year is stated once, at the end of the range.
  if (sameYear) {
    const endWithoutYear = new Date(end as string).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

    return `${from} – ${endWithoutYear}`;
  }

  return `${from} – ${to}`;
}

/**
 * A stored amount as a grouped decimal: "250,000" / "12,500.50".
 *
 * Deliberately carries no currency symbol. No amount field in the API has an
 * associated currency, so prefixing one would assert a fact the data does not
 * contain. Adding currency is a product decision, not a formatting one.
 *
 * Returns `null` for an absent or non-numeric value so a row can omit the
 * fragment rather than print "NaN".
 */
export function formatAmount(value?: string | number | null): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** A file size as "1.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Up to two initials for an avatar, from a display name when there is one and
 * from the local part of an email otherwise.
 *
 * The email fallback exists because `TenantMember` carries no name — the
 * directory can only show one until the members endpoint returns `fullName`.
 */
export function initials(source?: string | null): string {
  const trimmed = source?.trim();

  if (!trimmed) {
    return "";
  }

  // An email has no meaningful spaces to split on, so use the mailbox name.
  const name = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;

  const words = name
    // Treat separators as word breaks so "aaron-nartey" and "aaron_nartey" work.
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}