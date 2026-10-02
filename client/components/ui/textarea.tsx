"use client";

import { forwardRef, useId } from "react";

import { FieldError, FieldHint } from "@/components/ui/field-error";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Text above the field, e.g. a shared description for a group of fields. */
  description?: string;
  fullWidth?: boolean;
  /**
   * Shows a live "used / max" counter. Only rendered when the caller also sets
   * `maxLength`, since a counter without a limit is noise.
   */
  showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      description,
      fullWidth = true,
      showCount = false,
      className,
      id,
      name,
      disabled,
      maxLength,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? name ?? generatedId;

    const descriptionId = `${textareaId}-description`;
    const hintId = `${textareaId}-hint`;
    const errorId = `${textareaId}-error`;
    const countId = `${textareaId}-count`;

    const describedBy =
      [
        description ? descriptionId : null,
        error ? errorId : hint ? hintId : null,
        showCount && maxLength ? countId : null,
      ]
        .filter(Boolean)
        .join(" ") || undefined;

    /*
     * The counter reads from whichever mode the caller is in. When the field is
     * uncontrolled we cannot know the length without state, so the counter is
     * only rendered for controlled fields — a stale counter is worse than none.
     */
    const isControlled = value !== undefined;
    const used = typeof value === "string" ? value.length : null;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label ? (
          <label
            htmlFor={textareaId}
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
          className={[
            "flex w-full rounded-sm border bg-surface",
            "px-3.5 py-2.5",
            "transition-colors duration-150 ease-out",
            disabled
              ? "cursor-not-allowed border-line bg-surface-sunken opacity-60"
              : error
                ? "border-danger focus-within:border-danger"
                : "border-line hover:border-line-strong focus-within:border-ink",
          ].join(" ")}
        >
          <textarea
            ref={ref}
            id={textareaId}
            name={name}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={[
              "min-h-24 w-full resize-y bg-transparent text-sm leading-relaxed text-ink outline-none",
              "placeholder:text-ink-subtle",
              "disabled:cursor-not-allowed disabled:resize-none",
              className ?? "",
            ].join(" ")}
            {...props}
          />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {error ? (
              <FieldError id={errorId}>{error}</FieldError>
            ) : hint ? (
              <FieldHint id={hintId}>{hint}</FieldHint>
            ) : null}
          </div>

          {showCount && maxLength && isControlled && used !== null ? (
            /*
             * `aria-describedby` already associates this with the field, so it
             * is announced on focus rather than on every keystroke.
             */
            <p
              id={countId}
              aria-live="polite"
              className={[
                "shrink-0 text-[12px] tabular-nums",
                used >= maxLength ? "text-danger" : "text-ink-subtle",
              ].join(" ")}
            >
              {used}/{maxLength}
            </p>
          ) : null}
        </div>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
