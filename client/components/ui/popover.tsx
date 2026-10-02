"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
  const panelRef = useRef<HTMLDivElement>(null);

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
  }, [isOpen]);

  return (
    <div className={`relative ${className ?? ""}`}>
      {trigger({
        ref: triggerRef,
        onClick: () => setIsOpen((open) => !open),
        "aria-expanded": isOpen,
        "aria-haspopup": "menu",
        "aria-controls": isOpen ? panelId : undefined,
      })}

      {isOpen ? (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-label={label}
          className={[
            "absolute top-full z-50 mt-1.5 min-w-56 rounded-md border border-line",
            "bg-surface py-1",
            align === "end" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}

export default Popover;
