"use client";

import { useState } from "react";

export interface AvatarProps {
  /**
   * Image URL. Falls back to initials if it is missing, fails to load, or is
   * blocked — a broken photo must not leave a blank hole in a table row.
   */
  src?: string;
  /** Full name. Drives both the initials and the accessible name. */
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-[11px]",
  lg: "size-10 text-[13px]",
} as const;

/**
 * Up to two initials from a person's name.
 *
 * Takes the first and last word, so "Kwabena Owusu Mensah" reads "KM" rather than
 * "KOM". Iterating by code point via `Array.from` keeps surrogate pairs intact
 * for names containing emoji or non-BMP characters.
 */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";

  const firstGrapheme = (word: string) => Array.from(word)[0] ?? "?";

  if (words.length === 1) {
    return Array.from(words[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (firstGrapheme(words[0]) + firstGrapheme(words[words.length - 1])).toUpperCase();
}

const Avatar = ({ src, name, size = "md", className }: AvatarProps) => {
  const [failed, setFailed] = useState(false);

  const base = [
    "inline-flex shrink-0 items-center justify-center overflow-hidden",
    "rounded-full border border-line bg-surface-sunken",
    "font-medium tracking-[0.02em] text-ink-muted select-none",
    SIZES[size],
  ].join(" ");

  if (!src || failed) {
    return (
      <span className={`${base} ${className ?? ""}`} role="img" aria-label={name}>
        {initialsOf(name)}
      </span>
    );
  }

  return (
    <span className={`${base} ${className ?? ""}`} role="img" aria-label={name}>
      {/*
       * `next/image` requires every remote host to be configured, and avatar
       * sources are arbitrary object-storage or CDN URLs, so a plain `img` is the
       * honest choice. eslint is silenced for exactly that reason.
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="size-full object-cover"
      />
    </span>
  );
};

export default Avatar;

/**
 * Overlapping stack with an overflow count. `max` is a visual budget, not a data
 * limit — the full list still belongs in the page's accessible text somewhere.
 */
export function AvatarGroup({
  people,
  max = 3,
  className,
}: {
  people: { name: string; src?: string }[];
  max?: number;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const remaining = people.length - shown.length;

  return (
    <div className={`flex items-center -space-x-2 ${className ?? ""}`}>
      {shown.map((person) => (
        <Avatar
          key={person.name}
          name={person.name}
          src={person.src}
          size="sm"
          className="ring-2 ring-surface"
        />
      ))}

      {remaining > 0 ? (
        <span
          role="img"
          aria-label={`${remaining} more`}
          className={[
            "inline-flex size-6 shrink-0 items-center justify-center rounded-full",
            "border border-line bg-surface-sunken ring-2 ring-surface",
            "text-[10px] font-medium text-ink-subtle tabular-nums",
          ].join(" ")}
        >
          {remaining}
        </span>
      ) : null}
    </div>
  );
}
