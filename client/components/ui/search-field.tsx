"use client";

import { Search, X } from "lucide-react";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name. Say what is being searched, e.g. "Search projects". */
  label: string;
  placeholder?: string;
  className?: string;
}

/**
 * A filter box for an already-loaded list.
 *
 * Filtering happens in the browser against data the page has already fetched —
 * there is no search endpoint, so nothing here claims otherwise. That does mean
 * the result count stays honest: it reflects what is on screen.
 *
 * Labelled visually-hidden rather than by placeholder, because a placeholder
 * disappears exactly when the user needs to remember what the box was for.
 */
const SearchField = ({
  value,
  onChange,
  label,
  placeholder = "Search",
  className,
}: SearchFieldProps) => {
  const id = `search-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className={["relative", className ?? ""].join(" ")}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden="true"
      />

      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[
          "w-full rounded-sm border border-line bg-background py-2 pr-9 pl-9",
          "text-[13px] text-ink placeholder:text-ink-subtle",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
          "[&::-webkit-search-cancel-button]:appearance-none",
        ].join(" ")}
      />

      {value !== "" && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={[
            "absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center",
            "rounded-sm text-ink-subtle transition-colors hover:bg-surface-subtle hover:text-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          ].join(" ")}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default SearchField;
