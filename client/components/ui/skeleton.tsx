import type { ComponentProps } from "react";

/**
 * Inert placeholder block for loading states.
 *
 * Purely visual: it must never carry text a screen reader would announce as
 * content, so it is `aria-hidden` by default and the surrounding state is
 * responsible for announcing itself (`aria-busy`, a live region, or an
 * `sr-only` label).
 *
 * The pulse is disabled under `prefers-reduced-motion` — it conveys no
 * information that a static block does not.
 */
export function Skeleton({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-sm bg-surface-sunken motion-reduce:animate-none ${className ?? ""}`}
      {...props}
    />
  );
}

export default Skeleton;