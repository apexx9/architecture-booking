import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export interface EmptyStateProps {
  /** A lucide icon element, e.g. `<Inbox className="size-5" />`. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** A button or link. Keep it to the single action that resolves the state. */
  action?: ReactNode;
  /**
   * `error` marks a state the user did not cause and may not be able to resolve
   * alone — it changes the accent and supplies a default icon. `empty` is the
   * neutral case of "there is genuinely nothing here yet".
   */
  tone?: "neutral" | "error";
  /** `sm` for inside a card or table; `md` for a full-page region. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * The one place a list, table or panel says "nothing to show".
 *
 * Deliberately has no default title or copy: what an empty screen means is a
 * product decision per screen, and a generic "No data" would paper over the
 * difference between "no results for this filter" and "you have not created
 * anything yet".
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  tone = "neutral",
  size = "md",
  className,
}: EmptyStateProps) => {
  const isError = tone === "error";

  /*
   * Only an error state gets a default icon. A neutral empty state shows no
   * glyph rather than borrowing an alarming one to fill the space.
   */
  const glyph = icon ?? (isError ? <AlertCircle className="size-4" aria-hidden="true" /> : null);

  return (
    <div
      className={[
        "flex flex-col items-center text-center",
        size === "sm" ? "px-4 py-10" : "px-6 py-16",
        className ?? "",
      ].join(" ")}
    >
      {glyph ? (
        <span
          className={[
            "flex items-center justify-center rounded-sm",
            size === "sm" ? "size-8" : "size-10",
            isError
              ? "bg-danger/10 text-danger"
              : "bg-surface-sunken text-ink-subtle",
          ].join(" ")}
        >
          {glyph}
        </span>
      ) : null}

      <p
        className={[
          "text-balance font-medium text-ink",
          glyph ? "mt-4" : "",
          size === "sm" ? "text-[14px]" : "text-[15px]",
        ].join(" ")}
      >
        {title}
      </p>

      {description ? (
        <p
          className={[
            "mt-1.5 max-w-sm text-pretty leading-relaxed text-ink-muted",
            size === "sm" ? "text-[13px]" : "text-[14px]",
          ].join(" ")}
        >
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};

export default EmptyState;
