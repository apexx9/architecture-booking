import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

/**
 * Field-level message primitives.
 *
 * The API returns validation failures as message arrays (`ApiErrorResponse` in
 * `lib/api/errors.ts`), so a field's error can be several sentences. These
 * components render that in the one place a form needs it, and carry the `id`
 * that the control wires up via `aria-describedby`.
 *
 * They render nothing when there is nothing to say — a caller can place them
 * unconditionally and let the control own the empty case.
 */

interface FieldMessageProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

/** A validation or request failure attached to a single control. */
export function FieldError({ id, children, className }: FieldMessageProps) {
  return (
    <p
      id={id}
      className={[
        "flex items-start gap-1.5 text-[12px] leading-relaxed text-danger",
        className ?? "",
      ].join(" ")}
    >
      {/*
       * The icon is decorative — the text already says it is an error, and
       * `role="alert"` on a wrapping element would announce it twice.
       */}
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Non-error guidance shown under a control when there is no error. */
export function FieldHint({ id, children, className }: FieldMessageProps) {
  return (
    <p
      id={id}
      className={[
        "text-[12px] leading-relaxed text-ink-subtle",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

export default FieldError;
