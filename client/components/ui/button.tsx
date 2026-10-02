import React from "react";

/**
 * Button system.
 *
 * Hierarchy per DESIGN.md: primary, secondary, tertiary and destructive. Not
 * every action is filled, so `tertiary` is the default for in-page actions and
 * `primary` is reserved for the single main commitment on a screen.
 *
 * Geometry is square-to-subtle (never a pill), labels are sentence case (no
 * uppercase), and every variant carries a visible focus ring plus a disabled
 * state. Size is a separate axis from hierarchy.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-ink-inverse border border-ink hover:bg-ink/90 active:bg-ink",
  secondary:
    "bg-surface text-ink border border-line-strong hover:bg-surface-subtle hover:border-ink/40 active:bg-surface-sunken",
  tertiary:
    "bg-transparent text-ink-muted border border-transparent hover:bg-surface-subtle hover:text-ink active:bg-surface-sunken",
  destructive:
    "bg-transparent text-danger border border-danger/35 hover:bg-danger/5 hover:border-danger active:bg-danger/10",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

const BASE_STYLES = [
  "inline-flex items-center justify-center",
  "rounded-sm font-medium",
  "transition-colors duration-150 ease-out",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and blocks interaction. Set while a request is in flight. */
  loading?: boolean;
}

const Spinner = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2.5"
      opacity="0.25"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const Button = ({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`${BASE_STYLES} ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className ?? ""}`}
    {...props}
  >
    {loading ? <Spinner /> : null}
    {children}
  </button>
);

export default Button;
