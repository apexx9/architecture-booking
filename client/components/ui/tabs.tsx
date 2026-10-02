"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export interface TabItem {
  /** Stable key. Becomes the panel id, so it must survive content changes. */
  value: string;
  label: ReactNode;
  /** Optional count shown beside the label. */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** Uncontrolled default. */
  defaultValue?: string;
  /** Controlled value. Provide together with `onValueChange`. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name for the tab list. */
  label: string;
  children: ReactNode | ((activeValue: string) => ReactNode);
  className?: string;
}

/**
 * Tabs following the WAI-ARIA tabs pattern with manual activation.
 *
 * Arrow keys move focus; Enter/Space selects. Activation is manual rather than
 * automatic so arrowing past a tab does not fire a network request for a panel the
 * user is only passing through.
 */
const Tabs = ({
  items,
  defaultValue,
  value,
  onValueChange,
  label,
  children,
  className,
}: TabsProps) => {
  const generatedId = useId();
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? items.find((item) => !item.disabled)?.value ?? "",
  );
  const listRef = useRef<HTMLDivElement>(null);

  const isControlled = value !== undefined;
  const active = isControlled ? value : internalValue;

  const select = (next: string) => {
    if (isControlled) onValueChange?.(next);
    else setInternalValue(next);
  };

  const focusTabAt = (index: number) => {
    const tabs = listRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]:not([disabled])',
    );
    if (!tabs?.length) return;
    const wrapped = (index + tabs.length) % tabs.length;
    tabs[wrapped]?.focus();
  };

  const enabledValues = items.filter((item) => !item.disabled).map((item) => item.value);

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className="flex gap-1 overflow-x-auto border-b border-line"
        onKeyDown={(event) => {
          const currentIndex = enabledValues.indexOf(active);
          if (currentIndex === -1) return;

          const move = (to: number) => {
            event.preventDefault();
            focusTabAt(to);
          };

          switch (event.key) {
            case "ArrowRight":
              move(currentIndex + 1);
              break;
            case "ArrowLeft":
              move(currentIndex - 1);
              break;
            case "Home":
              move(0);
              break;
            case "End":
              move(enabledValues.length - 1);
              break;
          }
        }}
      >
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`${generatedId}-tab-${item.value}`}
              aria-selected={isActive}
              aria-controls={`${generatedId}-panel-${item.value}`}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.value)}
              className={[
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2",
                "text-[13px] whitespace-nowrap",
                "transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
                item.disabled
                  ? "cursor-not-allowed border-transparent text-ink-subtle"
                  : isActive
                    ? "cursor-pointer border-ink font-medium text-ink"
                    : "cursor-pointer border-transparent text-ink-muted hover:text-ink hover:border-line-strong",
              ].join(" ")}
            >
              {item.label}
              {typeof item.count === "number" ? (
                <span
                  className={[
                    "text-[11px] tabular-nums",
                    isActive ? "text-ink-muted" : "text-ink-subtle",
                  ].join(" ")}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/*
       * Only the active panel is mounted. Hidden-but-present panels would hold
       * stale data behind a tab the user cannot see, and any form state inside
       * them would silently survive a switch.
       */}
      {items.map((item) =>
        item.value === active ? (
          <div
            key={item.value}
            role="tabpanel"
            id={`${generatedId}-panel-${item.value}`}
            aria-labelledby={`${generatedId}-tab-${item.value}`}
            tabIndex={0}
            className="pt-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
          >
            {typeof children === "function" ? children(item.value) : children}
          </div>
        ) : null,
      )}
    </div>
  );
};

export default Tabs;
