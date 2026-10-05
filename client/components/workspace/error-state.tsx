import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCw } from "lucide-react";

import Button from "@/components/ui/button";

/**
 * A failure the user can act on.
 *
 * Separate from `EmptyState` on purpose, because the two say opposite things and
 * collapsing them produces the worst of both: an error that looks like "nothing
 * here yet", or an empty state that shouts at someone whose data is simply
 * absent. This one states what failed and offers the way out; that one explains
 * what belongs in the space.
 *
 * `detail` carries the specific reason — "only owners and admins can rename a
 * practice" — when the API gave one. Generic copy is not shown in place of a
 * specific reason.
 */

interface ErrorStateProps {
  /** What failed, as a short statement. "Couldn't load projects." */
  title: string;
  /** What happens next, in product language. */
  description?: ReactNode;
  /** The server's specific reason, when it has one worth surfacing. */
  detail?: string | null;
  /** Renders a retry button. Omit for failures a retry cannot fix. */
  onRetry?: () => void;
  retryLabel?: string;
  /**
   * A way out that is not a retry. On a detail route the record is missing, so
   * retrying cannot help — going back to the list can.
   */
  backHref?: string;
  backLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ErrorState({
  title,
  description,
  detail,
  onRetry,
  retryLabel = "Try again",
  backHref,
  backLabel = "Back",
  size = "md",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={[
        "flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between",
        size === "sm" ? "py-6" : "py-10",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertCircle
          className="mt-0.5 size-4 shrink-0 text-danger"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <p className="text-[14px] font-medium text-ink">{title}</p>

          {description && (
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-muted">
              {description}
            </p>
          )}

          {detail && (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-subtle">
              {detail}
            </p>
          )}
        </div>
      </div>

      {(onRetry || backHref) && (
        <div className="flex shrink-0 items-center gap-2">
          {onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              <RotateCw className="size-4" aria-hidden="true" />
              {retryLabel}
            </Button>
          )}

          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              {backLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The same failure shown while other data on the page is still usable.
 *
 * A partial failure is not the same as a failed page: if the projects loaded and
 * the clients did not, the projects should stay on screen. This is the quiet
 * inline form of `ErrorState`.
 */
export function InlineError({
  title,
  detail,
  onRetry,
  className,
}: {
  title: string;
  detail?: string | null;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={[
        "flex flex-wrap items-center justify-between gap-3 rounded-sm",
        "border border-danger/25 bg-danger/5 px-3 py-2",
        className ?? "",
      ].join(" ")}
    >
      <p className="text-[13px] text-danger">
        {title}
        {detail ? <span className="text-danger/80"> {detail}</span> : null}
      </p>

      {onRetry && (
        <Button size="sm" variant="tertiary" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  );
}

export default ErrorState;