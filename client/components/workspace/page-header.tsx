import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Page composition: title, purpose and action.
 *
 * The brief this answers is "what am I looking at, why am I here, what can I
 * do" — in that order and with visual weight in that order. Every workspace
 * route opens with this, which is what makes nine screens read as one product.
 *
 * The title stays small on purpose. DESIGN.md asks for editorial hierarchy
 * without oversized workspace headings, so this is the same 28px light display
 * face already used across the app, not a hero.
 *
 * `meta` exists so supporting facts can sit in the header as quiet text instead
 * of being scattered into the first row of a table or into a card subtitle.
 */

export interface PageHeaderMetaItem {
  label: string;
  value: ReactNode;
}

interface PageHeaderProps {
  title: ReactNode;
  /** One sentence on why the user is here. */
  description?: ReactNode;
  /** The primary commitment on the screen. Usually one button. */
  actions?: ReactNode;
  /** Quiet key/value facts rendered as a single wrapped line. */
  meta?: PageHeaderMetaItem[];
  /** Renders a back link above the title, for detail routes. */
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  backHref,
  backLabel = "Back",
  className,
}: PageHeaderProps) {
  return (
    <header
      className={["motion-enter flex flex-wrap items-start justify-between gap-x-6 gap-y-4", className ?? ""].join(" ")}
    >
      <div className="min-w-0 flex-1">
        {backHref && (
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-1.5 rounded-sm text-[13px] text-ink-subtle transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {backLabel}
          </Link>
        )}

        <h1 className="font-display text-[28px] leading-tight font-light text-balance text-ink">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}

        {meta && meta.length > 0 && (
          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {meta.map((item) => (
              <div key={item.label} className="flex items-baseline gap-1.5">
                <dt className="text-[12px] text-ink-subtle">{item.label}</dt>

                <dd className="text-[13px] text-ink-muted">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

export default PageHeader;