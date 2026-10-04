"use client";

import React, { forwardRef, useId, useState } from "react";
import { Calendar } from "lucide-react";

import { FieldError, FieldHint } from "@/components/ui/field-error";

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
  description?: string;
  fullWidth?: boolean;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      error,
      hint,
      description,
      fullWidth = true,
      className = "",
      id,
      name,
      disabled,
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
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
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label ? (
          <label
            htmlFor={inputId}
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

        <div
          className={`
            group relative flex w-full items-center gap-2 rounded-sm border bg-surface
            px-3.5 py-2.5
            transition-colors duration-150 ease-out
            ${
              disabled
                ? "cursor-not-allowed border-line bg-surface-sunken opacity-60"
                : error
                  ? "border-danger focus-within:border-danger"
                  : "border-line hover:border-line-strong focus-within:border-ink"
            }
          `}
        >
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="date"
            disabled={disabled}
            value={value}
            onChange={onChange}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`
              flex-1 bg-transparent text-sm text-ink outline-none w-full
              placeholder:text-ink-subtle
              disabled:cursor-not-allowed
              appearance-none
              [&::-webkit-calendar-picker-indicator]:opacity-0
              [&::-webkit-calendar-picker-indicator]:absolute
              [&::-webkit-calendar-picker-indicator]:inset-0
              [&::-webkit-calendar-picker-indicator]:cursor-pointer
              [&::-webkit-calendar-picker-indicator]:w-full
              [&::-webkit-calendar-picker-indicator]:h-full
              ${className}
            `}
            {...props}
          />
          <Calendar
            className="pointer-events-none absolute right-3.5 size-4 shrink-0 text-ink-subtle transition-colors group-hover:text-ink group-focus-within:text-ink"
            aria-hidden="true"
          />
        </div>

        {error ? (
          <FieldError id={errorId}>{error}</FieldError>
        ) : hint ? (
          <FieldHint id={hintId}>{hint}</FieldHint>
        ) : null}
      </div>
    );
  },
);

DateInput.displayName = "DateInput";

export default DateInput;
