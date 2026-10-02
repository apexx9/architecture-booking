import type { HTMLAttributes, ReactNode } from "react";

/**
 * Grouping surface for the workspace.
 *
 * DESIGN.md is explicit that not every information group should become a floating
 * card, so this is deliberately restrained: a fine border, no shadow, square-ish
 * corners. Reach for a plain section with a heading first and only use this when
 * the grouping genuinely needs an edge.
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Removes the outer padding when the card wraps a full-bleed table or list. */
  flush?: boolean;
}

export function Card({ children, flush = false, className, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-sm border border-line bg-surface",
        flush ? "" : "p-5",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

/*
 * `title` is this component's own prop, so these interfaces do not extend
 * `HTMLAttributes` — the DOM `title` attribute would collide with it.
 */
interface CardHeaderProps {
  children?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Typically a button or link. */
  action?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  description,
  action,
  children,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-start justify-between gap-3",
        className ?? "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="text-[14px] leading-5 font-medium text-ink">{title}</p>
        {description ? (
          <p className="mt-1 text-[13px] leading-5 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
