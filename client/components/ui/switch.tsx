"use client";

import { useId, type ReactNode } from "react";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  name?: string;
  value?: string;
  id?: string;
  className?: string;
}

/**
 * Immediate-effect toggle: the state changes on click, with no submit step.
 *
 * A real `<button role="switch">` rather than a checkbox, because a switch means
 * "this is now on", not "include this value". Native buttons keep Space and Enter
 * activation and focus for free; the hidden input keeps it in the form payload.
 */
const Switch = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  name,
  value,
  id,
  className,
}: SwitchProps) => {
  const generatedId = useId();
  const labelId = id ?? generatedId;
  const descriptionId = `${labelId}-description`;
  const hasLabel = label !== undefined;
  const hasDescription = description !== undefined;

  return (
    <div className={`flex items-start justify-between gap-4 ${className ?? ""}`}>
      {hasLabel || hasDescription ? (
        <span className="min-w-0">
          {hasLabel ? (
            <span
              id={labelId}
              className={[
                "block text-[13px] leading-[18px] font-medium",
                disabled ? "text-ink-subtle" : "text-ink",
              ].join(" ")}
            >
              {label}
            </span>
          ) : null}
          {hasDescription ? (
            <span
              id={descriptionId}
              className="mt-0.5 block text-[12px] leading-[17px] text-ink-muted"
            >
              {description}
            </span>
          ) : null}
        </span>
      ) : null}

      <span className="relative flex shrink-0 items-center">
        {name ? (
          <input
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            readOnly
            className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        ) : null}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={hasLabel ? labelId : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          aria-label={hasLabel || hasDescription ? undefined : "Toggle"}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={[
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border",
            "transition-colors duration-150 motion-reduce:transition-none",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
            disabled
              ? "cursor-not-allowed border-line bg-surface-sunken"
              : "cursor-pointer",
            disabled ? "" : checked ? "border-ink bg-ink" : "border-line-strong bg-surface",
          ].join(" ")}
        >
          {/*
           * The state is announced by `aria-checked`, so this knob is decorative.
           * Left/right position plus fill colour give sighted users a second cue.
           */}
          <span
            aria-hidden="true"
            className={[
              "pointer-events-none block size-3.5 rounded-full",
              "transition-transform duration-150 motion-reduce:transition-none",
              disabled
                ? "bg-ink-subtle"
                : checked
                  ? "translate-x-4 bg-ink-inverse"
                  : "translate-x-0.5 bg-ink-subtle",
            ].join(" ")}
          />
        </button>
      </span>
    </div>
  );
};

export default Switch;
