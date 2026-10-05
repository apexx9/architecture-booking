import Link from "next/link";

/**
 * Breadcrumbs for the context bar.
 *
 * The bar above the workspace used to print the current practice and nothing
 * else, so it carried no information about where in the product you were. These
 * trail from the practice down to the record.
 *
 * Only the last item is ever a link to something else; everything before it is
 * either already on screen or a real ancestor. `aria-current="page"` marks the
 * last item so it is not announced as another destination.
 */

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-line-strong">
                  /
                </span>
              )}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="truncate rounded-sm text-[13px] text-ink-subtle transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={[
                    "truncate text-[13px]",
                    isLast ? "text-ink" : "text-ink-subtle",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;