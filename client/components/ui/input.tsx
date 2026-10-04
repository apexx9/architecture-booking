// components/ui/input.tsx
import React, { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /**
   * Optional text rendered above the field, e.g. "New password". Used where a
   * group of related fields needs a shared description.
   */
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      description,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = "",
      id,
      name,
      type = "text",
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();

    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const inputId = id ?? name ?? generatedId;

    // Errors and hints are wired to the field so assistive technology announces
    // them with the input rather than leaving them as orphaned text.
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
            flex w-full items-center gap-2 rounded-sm border bg-surface
            px-3.5 py-2.5
            transition-colors duration-150 ease-out relative has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-0 has-[:focus-visible]:outline-none
            ${
              disabled
                ? "cursor-not-allowed border-line bg-surface-sunken opacity-60"
                : error
                  ? "border-danger focus-within:border-danger"
                  : "border-line hover:border-line-strong focus-within:border-ink"
            }
          `}
        >
          {leftIcon ? (
            <span className="shrink-0 text-ink-subtle [&>svg]:size-4">
              {leftIcon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={inputType}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`
              flex-1 bg-transparent text-sm text-ink outline-none w-full
              placeholder:text-ink-subtle
              disabled:cursor-not-allowed
              [appearance:textfield]
              [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              ${className}
            `}
            {...props}
          />

          {isPassword ? (
            /*
             * Stays in the tab order: revealing a mistyped password is a real
             * task for keyboard and screen-reader users, not a nicety.
             */
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="
                shrink-0 cursor-pointer rounded-xs p-1 text-ink-subtle
                transition-colors duration-150
                hover:text-ink
                focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-ink
              "
            >
              {showPassword ? (
                <EyeOff className="size-4" strokeWidth={2} />
              ) : (
                <Eye className="size-4" strokeWidth={2} />
              )}
            </button>
          ) : null}

          {rightIcon && !isPassword ? (
            <span className="shrink-0 text-ink-subtle [&>svg]:size-4">
              {rightIcon}
            </span>
          ) : null}
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-ink-subtle">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
