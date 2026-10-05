import type { HTMLAttributes, ReactNode } from "react";

/**
 * An editorial group of content, and the heading that introduces it.
 *
 * This is the deliberate answer to card overuse. A `Section` is borderless: it
 * groups by typography, spacing and a single hairline rule, which is how a page
 * reads as one surface rather than a grid of floating boxes.
 *
 * `contained` is the escape hatch for content that genuinely needs an edge —
 * a form panel, a table with its own scroll region. It is opt-in precisely so
 * that reaching for it is a decision rather than a default.
 */

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Adds the border and surface. Use sparingly. */
  contained?: boolean;
  /** Adds a hairline above the section to separate it from what came before. */
  divided?: boolean;
}

export function Section({
  children,
  contained = false,
  divided = false,
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={[
        contained ? "rounded-sm border border-line bg-surface p-5" : "",
        divided ? "border-t border-line pt-6" : "",
        className ?? "",
      ]
        .join(" ")
        .trim()}
      {...props}
    >
      {children}
    </section>
  );
}

export interface SectionHeaderProps {
  title: ReactNode;
  /** Secondary line under the title. */
  description?: ReactNode;
  /** Right-aligned controls: filters, "New …", view switchers. */
  actions?: ReactNode;
  /**
   * A short uppercase-free label above the title for grouping several sections
   * under one idea — "Overview", "Record". Kept at metadata size so it never
   * competes with the section title itself.
   */
  eyebrow?: ReactNode;
  className?: string;
  /** Heading level. Match the page's outline: an `h2` under a `PageHeader` `h1`. */
  as?: "h2" | "h3";
}

export function SectionHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
  as: Heading = "h2",
}: SectionHeaderProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-3",
        className ?? "",
      ].join(" ")}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[12px] text-ink-subtle">{eyebrow}</p>
        )}

        <Heading className="text-[15px] leading-5 font-medium text-ink">
          {title}
        </Heading>

        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export default Section;