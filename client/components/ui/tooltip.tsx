"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";

type TooltipSide = "top" | "right" | "bottom" | "left";

interface TooltipProps {
  /** The tooltip's text. Keep it short — it labels a control, it does not
   *  describe it. Longer explanation belongs in visible UI. */
  label: string;
  /** The trigger. A single focusable element; its `aria-describedby` is wired
   *  to the tooltip so assistive technology announces the label with it. */
  children: ReactElement;
  side?: TooltipSide;
  className?: string;
}

const SIDE_CLASSES: Record<TooltipSide, string> = {
  top: "bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2",
  right: "left-[calc(100%+6px)] top-1/2 -translate-y-1/2",
  bottom: "top-[calc(100%+6px)] left-1/2 -translate-x-1/2",
  left: "right-[calc(100%+6px)] top-1/2 -translate-y-1/2",
};

/**
 * A label that appears on hover and on keyboard focus.
 *
 * Deliberately dependency-free: no positioning library, no animation package.
 * The bubble is placed with plain CSS offsets against a relatively positioned
 * wrapper, which is sufficient for a trigger-sized label and carries none of
 * the cost of a floating-element engine.
 *
 * It replaces the native `title` attribute, which is what the collapsed
 * navigation used to rely on: `title` is invisible to keyboard users, does not
 * appear on touch at all, and cannot be styled.
 *
 * Dismissible with Escape, as tooltips are expected to be.
 */
const Tooltip = ({
  label,
  children,
  side = "top",
  className,
}: TooltipProps) => {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);

  if (!isValidElement(children)) {
    return children;
  }

  const child = children as ReactElement<{
    "aria-describedby"?: string;
    onKeyDown?: (event: KeyboardEvent) => void;
    onBlur?: () => void;
  }>;

  const trigger = cloneElement(child, {
    "aria-describedby": id,
    onKeyDown: (event: KeyboardEvent) => {
      child.props.onKeyDown?.(event);

      if (event.key === "Escape") {
        setDismissed(true);
      }
    },
    onBlur: () => {
      // Focus moving away always re-arms the tooltip for the next visit.
      setDismissed(false);
      child.props.onBlur?.();
    },
  });

  return (
    <span
      className={[
        "group/tt relative inline-flex",
        className ?? "",
      ].join(" ")}
    >
      {trigger}

      {/* `pointer-events-none` so the bubble never steals the pointer from the
          control underneath it. Visibility is driven by hover and focus of the
          wrapper, which means it also shows for keyboard focus without any
          JavaScript. */}
      <span
        role="tooltip"
        id={id}
        className={[
          "pointer-events-none absolute z-50 hidden w-max max-w-[16rem] rounded-sm",
          "bg-ink px-2 py-1 text-[12px] leading-snug font-medium text-ink-inverse",
          "shadow-sm group-hover/tt:block group-focus-within/tt:block",
          dismissed ? "hidden" : "",
          SIDE_CLASSES[side],
        ].join(" ")}
      >
        {label}
      </span>
    </span>
  );
};

export default Tooltip;

export type { TooltipProps, TooltipSide };