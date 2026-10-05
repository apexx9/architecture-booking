"use client";

import { useId } from "react";

import DatePicker, { type DateValue } from "@/components/ui/date-picker";
import { FieldError, FieldHint } from "@/components/ui/field-error";

export interface DateInputProps {
  label?: string;
  error?: string;
  hint?: string;
  description?: string;
  placeholder?: string;
  fullWidth?: boolean;

  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;

  /** `YYYY-MM-DD`, or an empty string for no date. */
  value?: DateValue;
  defaultValue?: DateValue;
  /** Receives the new `YYYY-MM-DD` value. */
  onChange?: (value: DateValue) => void;

  /** Earliest selectable date, `YYYY-MM-DD`. */
  min?: DateValue;
  /** Latest selectable date, `YYYY-MM-DD`. */
  max?: DateValue;
  isDateDisabled?: (date: Date) => boolean;

  /** Accessible name for fields with no visible label. */
  "aria-label"?: string;

  className?: string;
}

/**
 * Labelled date field.
 *
 * The calendar itself lives in `DatePicker`; this is the field wrapper — label,
 * description, hint and error — so it matches `Input` and `Select` and a form can
 * mix the three without three different label treatments.
 */
const DateInput = ({
  label,
  error,
  hint,
  description,
  placeholder,
  fullWidth = true,
  id,
  name,
  disabled,
  required,
  clearable,
  value,
  defaultValue,
  onChange,
  min,
  max,
  isDateDisabled,
  "aria-label": ariaLabel,
  className,
}: DateInputProps) => {
  const generatedId = useId();
  const inputId = id ?? name ?? generatedId;

  const descriptionId = `${inputId}-description`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedBy =
    [
      description ? descriptionId : null,
      error ? errorId : hint ? hintId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div
      className={[
        "flex flex-col gap-1.5",
        fullWidth ? "w-full" : "",
        className ?? "",
      ].join(" ")}
    >
      {label ? (
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink">
          {label}
        </label>
      ) : null}

      {description ? (
        <p id={descriptionId} className="text-[13px] text-ink-subtle">
          {description}
        </p>
      ) : null}

      <DatePicker
        id={inputId}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        clearable={clearable}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        min={min}
        max={max}
        isDateDisabled={isDateDisabled}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
      />

      {error ? (
        <FieldError id={errorId}>{error}</FieldError>
      ) : hint ? (
        <FieldHint id={hintId}>{hint}</FieldHint>
      ) : null}
    </div>
  );
};

export default DateInput;
