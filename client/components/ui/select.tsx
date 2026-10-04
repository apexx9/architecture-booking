"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { FieldError, FieldHint } from "@/components/ui/field-error";

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary line under the label. Use for context, not for the value itself. */
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  description?: string;
  placeholder?: string;
  options: SelectOption[];

  /** Controlled value. Omit to use `defaultValue` and let the field own state. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;

  /** Renders a hidden input so the value submits inside a native form. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  /** Shows a control to return the field to its empty state. */
  clearable?: boolean;
  emptyMessage?: string;
  fullWidth?: boolean;
  id?: string;
  className?: string;
}

/*
 * Height of one option row, used to decide before mount whether the panel will
 * need to scroll. Measuring after render would mean setting state inside an
 * effect, which is both a lint error and an extra render on every open.
 */
const OPTION_HEIGHT_PX = 40;
const PANEL_MAX_HEIGHT_PX = 288;
const TYPEAHEAD_RESET_MS = 500;

function isPrintable(key: string): boolean {
  return key.length === 1 && !key.match(/\s/);
}

/**
 * Select.
 *
 * A custom listbox, not a styled `<select>`: the native popup cannot carry the
 * description line, the check affordance, or the panel geometry the design
 * system uses, and it renders differently on every platform.
 *
 * Accessibility follows the disclosure-listbox pattern — the trigger keeps
 * focus for the entire interaction and the active row is exposed through
 * `aria-activedescendant`. That avoids a focus trap entirely and means screen
 * readers hear each option as the user arrows through it.
 *
 * Keyboard: Up/Down move, Home/End jump, Enter/Space commit, Escape cancels,
 * Tab closes and continues, and typing jumps to the first matching label.
 */
const Select = ({
  label,
  error,
  hint,
  description,
  placeholder = "Select an option",
  options,
  value,
  defaultValue,
  onChange,
  name,
  disabled = false,
  required = false,
  clearable = false,
  emptyMessage = "No options available",
  fullWidth = true,
  id,
  className,
}: SelectProps) => {
  const generatedId = useId();
  const baseId = id ?? name ?? generatedId;

  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;
  const descriptionId = `${baseId}-description`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue,
  );
  const currentValue = isControlled ? value : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [shouldFlip, setShouldFlip] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const typeahead = useRef<{ query: string; timer: number | null }>({
    query: "",
    timer: null,
  });

  const selectedIndex = options.findIndex(
    (option) => option.value === currentValue,
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const willScroll = options.length * OPTION_HEIGHT_PX > PANEL_MAX_HEIGHT_PX;

  const describedBy =
    [
      description ? descriptionId : null,
      error ? errorId : hint ? hintId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const firstEnabled = useCallback(
    () => options.findIndex((option) => !option.disabled),
    [options],
  );

  const lastEnabled = useCallback(() => {
    for (let i = options.length - 1; i >= 0; i -= 1) {
      if (!options[i].disabled) {
        return i;
      }
    }

    return -1;
  }, [options]);

  const moveActive = useCallback(
    (step: 1 | -1, from: number) => {
      if (options.length === 0) {
        return;
      }

      let next = from;

      for (let i = 0; i < options.length; i += 1) {
        next = (next + step + options.length) % options.length;

        if (!options[next].disabled) {
          setActiveIndex(next);
          optionRefs.current[next]?.scrollIntoView({ block: "nearest" });

          return;
        }
      }
    },
    [options],
  );

  const close = useCallback(
    ({ restoreFocus = true } = {}) => {
      setIsOpen(false);
      setActiveIndex(-1);

      if (restoreFocus) {
        triggerRef.current?.focus();
      }
    },
    [],
  );

  const open = useCallback(() => {
    if (disabled || options.length === 0) {
      return;
    }

    /*
     * Decide the panel's direction from the trigger's position at the moment it
     * opens. Doing this here rather than after mount means the first paint is
     * already in the right place — no flip flash.
     */
    const rect = triggerRef.current?.getBoundingClientRect();

    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setShouldFlip(
        spaceBelow < PANEL_MAX_HEIGHT_PX && spaceAbove > spaceBelow,
      );
    }

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled());
    setIsOpen(true);
  }, [disabled, options.length, selectedIndex, firstEnabled]);

  const commit = useCallback(
    (index: number) => {
      const option = options[index];

      if (!option || option.disabled) {
        return;
      }

      if (!isControlled) {
        setInternalValue(option.value);
      }

      onChange?.(option.value);
      close();
    },
    [options, isControlled, onChange, close],
  );

  // Click outside closes without stealing focus back from wherever the user went.
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
      setActiveIndex(-1);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  const runTypeahead = useCallback(
    (key: string) => {
      const store = typeahead.current;

      if (store.timer !== null) {
        window.clearTimeout(store.timer);
      }

      store.query += key.toLowerCase();
      store.timer = window.setTimeout(() => {
        store.query = "";
        store.timer = null;
      }, TYPEAHEAD_RESET_MS);

      const start = activeIndex >= 0 ? activeIndex : 0;

      for (let i = 1; i <= options.length; i += 1) {
        const index = (start + i) % options.length;
        const option = options[index];

        if (!option.disabled && option.label.toLowerCase().startsWith(store.query)) {
          setActiveIndex(index);
          optionRefs.current[index]?.scrollIntoView({ block: "nearest" });

          return;
        }
      }
    },
    [activeIndex, options],
  );

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();

        if (isOpen) {
          moveActive(1, activeIndex);
        } else {
          open();
        }

        break;

      case "ArrowUp":
        event.preventDefault();

        if (isOpen) {
          moveActive(-1, activeIndex);
        } else {
          open();
        }

        break;

      case "Home":
        if (isOpen) {
          event.preventDefault();
          setActiveIndex(firstEnabled());
        }
        break;

      case "End":
        if (isOpen) {
          event.preventDefault();
          setActiveIndex(lastEnabled());
        }
        break;

      case "Enter":
      case " ":
        event.preventDefault();

        if (isOpen) {
          commit(activeIndex);
        } else {
          open();
        }

        break;

      case "Escape":
        if (isOpen) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        break;

      case "Tab":
        // Let focus move on, but do not leave an orphaned panel behind.
        if (isOpen) {
          close({ restoreFocus: false });
        }
        break;

      default:
        if (isPrintable(event.key)) {
          event.preventDefault();

          if (!isOpen) {
            open();
          }

          runTypeahead(event.key);
        }
    }
  };

  const showClear =
    clearable && !disabled && currentValue !== undefined && currentValue !== "";

  return (
    <div
      className={[
        "flex flex-col gap-1.5",
        fullWidth ? "w-full" : "",
        className ?? "",
      ].join(" ")}
    >
      {label ? (
        <label
          htmlFor={triggerId}
          className="text-[13px] font-medium text-ink"
        >
          {label}
        </label>
      ) : null}

      {description ? (
        <p id={descriptionId} className="text-[13px] text-ink-subtle">
          {description}
        </p>
      ) : null}

      <div className="relative">
        <div
          className={[
            "flex w-full items-center gap-2 rounded-sm border bg-surface",
            "transition-colors duration-150 ease-out",
            disabled
              ? "cursor-not-allowed border-line bg-surface-sunken opacity-60"
              : error
                ? "border-danger focus-within:border-danger"
                : isOpen
                  ? "border-ink"
                  : "border-line hover:border-line-strong focus-within:border-ink",
          ].join(" ")}
        >
          <button
            ref={triggerRef}
            id={triggerId}
            type="button"
            role="combobox"
            disabled={disabled}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={
              isOpen && activeIndex >= 0
                ? `${listboxId}-option-${activeIndex}`
                : undefined
            }
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            onClick={() => (isOpen ? close() : open())}
            onKeyDown={handleTriggerKeyDown}
            className={[
              "flex min-w-0 flex-1 items-center gap-2 px-3.5 py-2.5 text-left",
              "text-sm",
              /*
               * No ring here. The wrapper border turning ink is this field's
               * focus indicator, exactly as in `Input`; a second outline would
               * draw a box inside the box.
               */
              "outline-none",
              "disabled:cursor-not-allowed",
              "rounded-sm",
            ].join(" ")}
          >
            <span
              className={[
                "min-w-0 flex-1 truncate",
                selectedOption ? "text-ink" : "text-ink-subtle",
              ].join(" ")}
            >
              {selectedOption?.label ?? placeholder}
            </span>

            <ChevronDown
              aria-hidden="true"
              className={[
                "size-4 shrink-0 text-ink-subtle",
                "transition-transform duration-150 ease-out motion-reduce:transition-none",
                isOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>

          {showClear ? (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={() => {
                if (!isControlled) {
                  setInternalValue(undefined);
                }

                onChange?.("");
                triggerRef.current?.focus();
              }}
              className="mr-1.5 shrink-0 cursor-pointer rounded-xs p-1 text-ink-subtle transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {isOpen ? (
          <div
            ref={panelRef}
            className={[
              "absolute z-50 w-full overflow-hidden rounded-sm border border-line bg-surface shadow-[0_12px_32px_-16px_rgba(25,25,25,0.35)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white",
              shouldFlip ? "bottom-full mb-1.5" : "top-full mt-1.5",
            ].join(" ")}
          >
            <ul
              id={listboxId}
              role="listbox"
              aria-label={label}
              className="relative max-h-72 overflow-y-auto py-1"
            >
              {options.length === 0 ? (
                <li className="px-3 py-6 text-center text-[13px] text-ink-subtle">
                  {emptyMessage}
                </li>
              ) : (
                options.map((option, index) => {
                  const isSelected = index === selectedIndex;
                  const isActive = index === activeIndex;

                  return (
                    <li
                      key={option.value}
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      onMouseEnter={() => {
                        if (!option.disabled) {
                          setActiveIndex(index);
                        }
                      }}
                      onClick={() => commit(index)}
                      className={[
                        "relative flex items-start gap-2.5 px-3 py-2",
                        "text-[13px] transition-colors duration-150",
                        option.disabled
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer",
                        isActive && !option.disabled
                          ? "bg-surface-subtle text-ink"
                          : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
                      ].join(" ")}
                    >
                      {/*
                       * The active row is marked by a rail as well as a
                       * background tint, so the keyboard cursor is visible
                       * without relying on a subtle colour difference.
                       */}
                      {isActive && !option.disabled ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-0.5 bg-ink"
                        />
                      ) : null}

                      <span
                        aria-hidden="true"
                        className={[
                          "mt-0.5 flex size-3.5 shrink-0 items-center justify-center",
                          isSelected ? "text-ink" : "text-transparent",
                        ].join(" ")}
                      >
                        <Check className="size-3.5" strokeWidth={2.5} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={[
                            "block truncate",
                            isSelected ? "font-medium text-ink" : "",
                          ].join(" ")}
                        >
                          {option.label}
                        </span>

                        {option.description ? (
                          <span className="mt-0.5 block truncate text-[12px] text-ink-subtle">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>

            {/*
             * Fade hint while more options sit below. Decorative only — the
             * listbox scrolls and announces its own extent.
             */}
            {willScroll && !shouldFlip ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-surface to-transparent"
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {name ? (
        <input type="hidden" name={name} value={currentValue ?? ""} />
      ) : null}

      {error ? (
        <FieldError id={errorId}>{error}</FieldError>
      ) : hint ? (
        <FieldHint id={hintId}>{hint}</FieldHint>
      ) : null}
    </div>
  );
};

export default Select;