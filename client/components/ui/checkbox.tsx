"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /**
   * The mixed state. React has no `indeterminate` prop, so this is written to the
   * DOM property directly. Use it for "select all" boxes: activating a mixed
   * checkbox reports `true`.
   */
  indeterminate?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  name?: string;
  value?: string;
  id?: string;
  className?: string;
}

/**
 * A real `<input type="checkbox">` with the native box drawn by CSS.
 *
 * Deliberately one semantic element rather than a button plus a hidden input:
 * two elements carrying the checkbox role means screen readers announce it twice,
 * and Space activation comes free. Keeping the native element also keeps it in the
 * form payload when checked.
 */
const Checkbox = ({
  checked,
  onCheckedChange,
  indeterminate = false,
  label,
  description,
  disabled = false,
  name,
  value,
  id,
  className,
}: CheckboxProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const hasLabel = label !== undefined || description !== undefined;

  return (
    <div className={`flex items-start gap-2.5 ${className ?? ""}`}>
      <span className="relative flex size-4 shrink-0 items-center">
        <input
          ref={inputRef}
          type="checkbox"
          id={inputId}
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          aria-describedby={description ? descriptionId : undefined}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className={[
            "peer size-4 appearance-none rounded-[3px] border bg-surface",
            "transition-colors duration-150 motion-reduce:transition-none",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
            disabled
              ? "cursor-not-allowed border-line bg-surface-sunken"
              : "cursor-pointer",
            disabled
              ? ""
              : indeterminate || checked
                ? "border-ink bg-ink"
                : "border-line-strong hover:border-ink",
          ].join(" ")}
        />

        {/* Drawn over the input, driven by its checked/mixed state. */}
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className={[
            "pointer-events-none absolute inset-0 m-auto size-3 text-ink-inverse",
            indeterminate ? "opacity-0" : "opacity-0 peer-checked:opacity-100",
          ].join(" ")}
        />
        <Minus
          aria-hidden="true"
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto size-3 text-ink-inverse opacity-0 peer-indeterminate:opacity-100"
        />
      </span>

      {hasLabel ? (
        <span className="min-w-0">
          {label !== undefined ? (
            <label
              htmlFor={inputId}
              className={[
                "block text-[13px] leading-[18px]",
                disabled ? "text-ink-subtle" : "cursor-pointer text-ink",
              ].join(" ")}
            >
              {label}
            </label>
          ) : null}
          {description ? (
            <span
              id={descriptionId}
              className="mt-0.5 block text-[12px] leading-[17px] text-ink-muted"
            >
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
};

export default Checkbox;
