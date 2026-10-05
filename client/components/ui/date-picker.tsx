"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export type DateValue = string;

export interface DatePickerProps {
  /** `YYYY-MM-DD`. Empty string means no date. */
  value?: DateValue;
  onChange?: (value: DateValue) => void;
  defaultValue?: DateValue;

  id?: string;
  /** Emits a hidden input so the value submits inside a native form. */
  name?: string;
  disabled?: boolean;
  required?: boolean;
  /** Earliest selectable date, `YYYY-MM-DD`. */
  min?: DateValue;
  /** Latest selectable date, `YYYY-MM-DD`. */
  max?: DateValue;
  isDateDisabled?: (date: Date) => boolean;

  placeholder?: string;
  /** Shows a control to return the field to its empty state. */
  clearable?: boolean;
  /** Accessible name for triggers with no visible label. */
  "aria-label"?: string;
  /** Ids of the description/hint/error text, announced with the trigger. */
  "aria-describedby"?: string;
  "aria-invalid"?: true;

  size?: "sm" | "md";
  className?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Monday-first, matching how practice schedules are read in Ghana and the UK. */
const WEEKDAY_NAMES = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

const WEEKDAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const DAYS_PER_WEEK = 7;
const GRID_CELLS = 42;
const PANEL_MAX_HEIGHT_PX = 340;

/*
 * Dates are built at local noon rather than midnight. A date-only field has no
 * timezone, and midnight is the one instant a DST transition can move: parsing
 * "2026-03-29" in a zone that springs forward lands on 01:00 the same day, which
 * is harmless, but `new Date("2026-03-29")` (UTC) can render as the 28th in
 * negative offsets. Noon keeps every arithmetic step on the intended calendar day.
 */
function fromKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    12,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function toKey(date: Date): DateValue {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    12,
  );
}

function sameDay(a: Date | null, b: Date | null): boolean {
  return (
    a !== null &&
    b !== null &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Full, unambiguous label for assistive technology: "Monday, 5 October 2026". */
function toAccessibleLabel(date: Date): string {
  return `${WEEKDAY_FULL[(date.getDay() + 6) % 7]}, ${date.getDate()} ${
    MONTH_NAMES[date.getMonth()]
  } ${date.getFullYear()}`;
}

/** Compact display label: "5 Oct 2026". */
function toDisplayLabel(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${
    date.getFullYear()
  }`;
}

/**
 * The six-week grid a month view is drawn from, always starting on the Monday on
 * or before the 1st. Fixed height on purpose: a month that needs five rows and a
 * month that needs six would otherwise make the panel jump in height as the user
 * pages through, which reads as the layout shifting under the pointer.
 */
function buildMonthGrid(viewDate: Date): Date[] {
  const firstOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
    12,
  );
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const start = addDays(firstOfMonth, -leadingBlanks);

  return Array.from({ length: GRID_CELLS }, (_, index) =>
    addDays(start, index),
  );
}

/**
 * Date picker.
 *
 * A drawn calendar rather than `<input type="date">`: the native control renders a
 * different popup on every platform, cannot be given the design system's cell
 * geometry, and shows a locale-formatted placeholder that disagrees with the rest
 * of the workspace. The visible field is a button; the value still reaches a
 * native form through a hidden input, and the value format stays `YYYY-MM-DD` so
 * callers keep the plain-date semantics they had with the native control.
 *
 * Keyboard: focus moves into the grid when the panel opens. Arrows move a day or
 * a week, PageUp/PageDown change month, Home/End jump to the ends of the week,
 * Enter commits and Escape cancels, both returning focus to the trigger. Typing a
 * date is deliberately not supported: the trigger is a button, not a text field,
 * so anything typed into it would go nowhere. Use the native form value, or the
 * month arrows, instead.
 */
const DatePicker = ({
  value,
  onChange,
  defaultValue,
  id,
  name,
  disabled = false,
  required = false,
  min,
  max,
  isDateDisabled,
  placeholder = "Select a date",
  clearable = true,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  size = "md",
  className,
}: DatePickerProps) => {
  const generatedId = useId();
  const baseId = id ?? name ?? generatedId;
  const isCompact = size === "sm";

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<DateValue | undefined>(
    defaultValue,
  );
  const currentValue = isControlled ? value : internalValue;

  const selectedDate = currentValue ? fromKey(currentValue) : null;
  const today = useMemo(() => new Date(), []);
  const minDate = min ? fromKey(min) : null;
  const maxDate = max ? fromKey(max) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(
    () => selectedDate ?? today,
  );
  const [activeDate, setActiveDate] = useState<Date>(
    () => selectedDate ?? today,
  );
  const [shouldFlip, setShouldFlip] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const panelId = `${baseId}-calendar`;
  const gridId = `${baseId}-grid`;

  const isOutOfRange = useCallback(
    (date: Date) => {
      if (minDate && date.getTime() < minDate.getTime()) {
        return true;
      }

      if (maxDate && date.getTime() > maxDate.getTime()) {
        return true;
      }

      return isDateDisabled?.(date) ?? false;
    },
    [minDate, maxDate, isDateDisabled],
  );

  const close = useCallback(
    ({ restoreFocus = true } = {}) => {
      setIsOpen(false);

      if (restoreFocus) {
        triggerRef.current?.focus();
      }
    },
    [],
  );

  const open = useCallback(() => {
    if (disabled) {
      return;
    }

    /*
     * Choose the opening month from the trigger's position, before the panel
     * mounts, so the first paint is already on the correct side and does not
     * flash downwards and then jump upwards.
     */
    const anchor = selectedDate ?? today;
    const rect = triggerRef.current?.getBoundingClientRect();

    setViewDate(anchor);
    setActiveDate(anchor);

    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setShouldFlip(spaceBelow < PANEL_MAX_HEIGHT_PX && spaceAbove > spaceBelow);
    }

    setIsOpen(true);
  }, [disabled, selectedDate, today]);

  const commit = useCallback(
    (date: Date) => {
      if (isOutOfRange(date)) {
        return;
      }

      const next = toKey(date);

      if (!isControlled) {
        setInternalValue(next);
      }

      onChange?.(next);
      close();
    },
    [isControlled, onChange, close, isOutOfRange],
  );

  const clear = useCallback(() => {
    if (!isControlled) {
      setInternalValue("");
    }

    onChange?.("");
    triggerRef.current?.focus();
  }, [isControlled, onChange]);

  // Focus belongs to the grid while the panel is open, so arrow keys reach the
  // calendar rather than scrolling the page behind it.
  useEffect(() => {
    if (isOpen) {
      gridRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (wrapperRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  /*
   * Every keyboard action ends here: move the cursor, and if that leaves the
   * month on screen, page the view to follow it. Skipping the follow-up is what
   * makes a calendar feel broken — the cursor vanishes off the bottom edge and
   * the user has to keep pressing to find it.
   */
  const moveActive = useCallback(
    (start: Date, step: number) => {
      /*
       * Land on the next selectable date rather than stopping on a disabled one:
       * a cursor that can rest where nothing can be chosen makes Enter feel
       * broken. Bounded so an entirely blocked range cannot spin forever.
       */
      let next = start;

      for (let i = 0; i < 366; i += 1) {
        if (!isOutOfRange(next)) {
          break;
        }

        next = addDays(next, step);
      }

      setActiveDate(next);
      setViewDate((current) =>
        next.getMonth() === current.getMonth() &&
        next.getFullYear() === current.getFullYear()
          ? current
          : new Date(next.getFullYear(), next.getMonth(), 1, 12),
      );
    },
    [isOutOfRange],
  );

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        moveActive(addDays(activeDate, -1), -1);
        break;

      case "ArrowRight":
        event.preventDefault();
        moveActive(addDays(activeDate, 1), 1);
        break;

      case "ArrowUp":
        event.preventDefault();
        moveActive(addDays(activeDate, -7), -1);
        break;

      case "ArrowDown":
        event.preventDefault();
        moveActive(addDays(activeDate, 7), 1);
        break;

      case "Home":
        event.preventDefault();
        moveActive(addDays(activeDate, -((activeDate.getDay() + 6) % 7)), -1);
        break;

      case "End":
        event.preventDefault();
        moveActive(addDays(activeDate, 6 - ((activeDate.getDay() + 6) % 7)), 1);
        break;

      case "PageUp":
        event.preventDefault();
        moveActive(shiftMonths(activeDate, -1), -1);
        break;

      case "PageDown":
        event.preventDefault();
        moveActive(shiftMonths(activeDate, 1), 1);
        break;

      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeDate);
        break;

      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close();
        break;

      case "Tab":
        // Let focus continue, but do not strand it inside a closed panel.
        close({ restoreFocus: false });
        break;

      default:
        break;
    }
  };

  const shiftMonth = (step: number) => {
    const next = shiftMonths(viewDate, step);

    setViewDate(next);
    // Keep the cursor inside the month being shown rather than on a date the
    // user can no longer see.
    setActiveDate((current) => shiftMonths(current, step));
  };

  const rows = useMemo(() => {
    const cells = buildMonthGrid(viewDate).map((date) => ({
      key: toKey(date),
      date,
    }));

    return Array.from({ length: GRID_CELLS / DAYS_PER_WEEK }, (_, index) =>
      cells.slice(index * DAYS_PER_WEEK, (index + 1) * DAYS_PER_WEEK),
    );
  }, [viewDate]);

  const showClear =
    clearable && !disabled && currentValue !== undefined && currentValue !== "";

  const triggerPadding = isCompact
    ? showClear
      ? "py-1.5 pl-3 pr-7"
      : "py-1.5 pl-3 pr-2.5"
    : showClear
      ? "py-2.5 pl-3.5 pr-9"
      : "py-2.5 pl-3.5 pr-3.5";

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ""}`}>
      <div
        className={[
          "relative flex w-full items-center rounded-sm border bg-surface",
          "transition-colors duration-150 ease-out",
          disabled
            ? "cursor-not-allowed border-line bg-surface-sunken opacity-60"
            : isOpen
              ? "border-ink"
              : "border-line hover:border-line-strong focus-within:border-ink",
        ].join(" ")}
        >
        <button
          ref={triggerRef}
          id={baseId}
          type="button"
          /*
           * `combobox` rather than `button`: this control holds a value that the
           * popup sets, and it is the only role that can carry `aria-required` and
           * `aria-invalid`. It also makes the field announce like the `Select`
           * beside it in the same form instead of reading as a plain button that
           * happens to open something.
           */
          role="combobox"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? panelId : undefined}
          aria-required={required || undefined}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          onClick={() => (isOpen ? close() : open())}
          className={[
            "flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left outline-none",
            "disabled:cursor-not-allowed",
            isCompact ? "text-[12px]" : "text-sm",
            triggerPadding,
          ].join(" ")}
        >
          <CalendarDays
            aria-hidden="true"
            className={[
              "shrink-0 text-ink-subtle",
              isCompact ? "size-3.5" : "size-4",
            ].join(" ")}
          />

          <span
            className={[
              "min-w-0 flex-1 truncate tabular-nums",
              selectedDate ? "text-ink" : "text-ink-subtle",
            ].join(" ")}
          >
            {selectedDate ? toDisplayLabel(selectedDate) : placeholder}
          </span>
        </button>

        {showClear ? (
          <button
            type="button"
            aria-label="Clear date"
            tabIndex={-1}
            onClick={clear}
            className={[
              "absolute top-1/2 -translate-y-1/2 cursor-pointer rounded-xs p-1",
              "text-ink-subtle transition-colors duration-150 ease-out hover:text-ink",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              "motion-reduce:transition-none",
              isCompact ? "right-2.5" : "right-3.5",
            ].join(" ")}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className={isCompact ? "size-3" : "size-3.5"}
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose a date"
          className={[
            "absolute z-50 w-[19.5rem] max-w-[calc(100vw-2rem)] rounded-sm border border-line bg-surface p-3",
            "shadow-[0_16px_40px_-24px_rgba(25,25,25,0.45)]",
            "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white",
            shouldFlip ? "bottom-full mb-1.5" : "top-full mt-1.5",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="flex size-7 cursor-pointer items-center justify-center rounded-xs text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-subtle hover:text-ink motion-reduce:transition-none"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>

            <p
              id={`${baseId}-month`}
              aria-live="polite"
              className="text-[13px] font-medium text-ink tabular-nums"
            >
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </p>

            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="flex size-7 cursor-pointer items-center justify-center rounded-xs text-ink-subtle transition-colors duration-150 ease-out hover:bg-surface-subtle hover:text-ink motion-reduce:transition-none"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-0.5">
            {WEEKDAY_NAMES.map((weekday) => (
              <div
                key={weekday}
                className="pb-1 text-center text-[11px] font-medium text-ink-subtle"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div
            ref={gridRef}
            id={gridId}
            role="grid"
            tabIndex={-1}
            aria-labelledby={`${baseId}-month`}
            aria-activedescendant={`${gridId}-${toKey(activeDate)}`}
            onKeyDown={handleGridKeyDown}
            /*
             * The cursor cell draws its own ring, so the grid container must not
             * add a second one around the whole calendar.
             */
            className="flex flex-col gap-0.5 outline-none"
          >
            {rows.map((week) => (
              <div key={week[0].key} role="row" className="grid grid-cols-7 gap-0.5">
                {week.map(({ key, date }) => {
                  const isSelected = sameDay(date, selectedDate);
                  const isActive = sameDay(date, activeDate);
                  const isToday = sameDay(date, today);
                  const isDisabled = isOutOfRange(date);
                  const isOutside = date.getMonth() !== viewDate.getMonth();

                  return (
                    <button
                      key={key}
                      id={`${gridId}-${key}`}
                      type="button"
                      role="gridcell"
                      tabIndex={-1}
                      aria-label={toAccessibleLabel(date)}
                      aria-selected={isSelected}
                      aria-disabled={isDisabled || undefined}
                      aria-current={isToday ? "date" : undefined}
                      disabled={isDisabled}
                      onClick={() => commit(date)}
                      onMouseEnter={() => {
                        if (!isDisabled) {
                          setActiveDate(date);
                        }
                      }}
                      className={[
                        "flex h-8 items-center justify-center rounded-xs text-[12px]",
                        "tabular-nums transition-colors duration-100 ease-out motion-reduce:transition-none",
                        isDisabled
                          ? "cursor-not-allowed text-ink-subtle opacity-35"
                          : "cursor-pointer",
                        isOutside ? "text-ink-subtle" : "text-ink-muted",
                        /*
                         * Selected is filled; the cursor is an outline. Filling both
                         * would leave the user unable to tell where the value is
                         * versus where the keyboard currently is.
                         */
                        isSelected
                          ? "bg-ink font-medium text-ink-inverse"
                          : "hover:bg-surface-subtle hover:text-ink",
                        isActive && !isDisabled
                          ? isSelected
                            ? "ring-2 ring-ink ring-offset-1"
                            : "ring-1 ring-line-strong"
                          : "",
                        isToday && !isSelected
                          ? "underline underline-offset-2"
                          : "",
                      ].join(" ")}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-line-muted pt-2">
            <button
              type="button"
              onClick={() => {
                setViewDate(new Date(today.getFullYear(), today.getMonth(), 1, 12));
                setActiveDate(today);
              }}
              className="cursor-pointer rounded-xs px-1.5 py-1 text-[12px] text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-subtle hover:text-ink motion-reduce:transition-none"
            >
              Today
            </button>

            {showClear ? (
              <button
                type="button"
                onClick={clear}
                className="cursor-pointer rounded-xs px-1.5 py-1 text-[12px] text-ink-muted transition-colors duration-150 ease-out hover:bg-surface-subtle hover:text-ink motion-reduce:transition-none"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {name ? <input type="hidden" name={name} value={currentValue ?? ""} /> : null}
    </div>
  );
};

/**
 * Moves a date by whole months, clamping the day to the target month. Without the
 * clamp, `31 January` plus one month silently becomes `3 March`, because the
 * constructor rolls an impossible day forward.
 */
function shiftMonths(date: Date, months: number): Date {
  const target = new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1,
    12,
  );
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
    12,
  ).getDate();

  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay),
    12,
  );
}

export default DatePicker;
