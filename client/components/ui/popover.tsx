"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useFloatingPanel } from "@/components/ui/use-floating-panel";

interface PopoverProps {
  /** Renders the trigger. Receives the ARIA wiring it must spread onto a button. */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
    "aria-controls": string | undefined;
  }) => ReactNode;

  children: ReactNode | ((close: () => void) => ReactNode);

  align?: "start" | "end";
  label: string;
  className?: string;
}

/**
 * Disclosure popover built on a real `<button>`.
 *
 * Deliberately not a `listbox` and not a generic container with a click handler:
 * keyboard operation is part of the contract, so Escape closes, click-outside
 * closes, focus returns to the trigger on close, and Tab reaching the last item
 * closes the panel rather than stranding focus inside it.
 *
 * The panel is portalled and placed against the viewport. Both of its uses sit in
 * the top bar, where the in-flow panel was cropped by the bar's own overflow and
 * counted towards it, and where a menu that cannot escape its container would
 * open behind the edge of the screen.
 */
export function Popover({
  trigger,
  children,
  align = "end",
  label,
  className,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  /* `min-w-56` in panel terms: a menu should never be narrower than its widest label. */
  const { panelRef, panelStyle } = useFloatingPanel<HTMLButtonElement>({
    anchorRef: triggerRef,
    open: isOpen,
    align,
    minWidth: 224,
  });

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, panelRef]);

  return (
    <div className={`relative ${className ?? ""}`}>
      {trigger({
        ref: triggerRef,
        onClick: () => setIsOpen((open) => !open),
        "aria-expanded": isOpen,
        "aria-haspopup": "menu",
        "aria-controls": isOpen ? panelId : undefined,
      })}

      {isOpen
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              style={panelStyle}
              role="menu"
              aria-label={label}
              className={[
                "relative z-50 min-w-56 rounded-sm border border-line",
                "bg-surface py-0.5 shadow-[0_12px_32px_-16px_rgba(25,25,25,0.35)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white",
              ].join(" ")}
            >
              {typeof children === "function" ? children(close) : children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default Popover;
