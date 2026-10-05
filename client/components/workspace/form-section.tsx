import type { ReactNode } from "react";

/**
 * Form composition: named groups of fields.
 *
 * The problem this solves is a form that reads as one undifferentiated vertical
 * list. `FormSection` introduces a boundary the eye can land on — a small label,
 * a hairline, then fields — so a nine-field form reads as three short forms
 * rather than one long one.
 *
 * There is deliberately no `FormField` here. `Input`, `Select`, `Textarea` and
 * `DateInput` already share one field contract (`label`, `description`, `hint`,
 * `error`, with `aria-describedby` and `aria-invalid` wired), so a wrapper would
 * be a second way to label a field rather than a better one. This only adds the
 * grouping the controls are missing.
 *
 * The horizontal padding is negative by default because a section belongs inside
 * something that already has padding. A dialog does, so `FormSection` pulls back
 * to the dialog's own edges and re-applies its own — otherwise every section
 * would be a box inside a box.
 */

export function FormSection({
  title,
  description,
  children,
  className,
  as: Heading = "h3",
  /** Removes the pull-back for forms that are not inside a padded container. */
  flush = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
  flush?: boolean;
}) {
  if (!title) {
    return <div className={className}>{children}</div>;
  }

  return (
    <section
      className={[
        flush ? "border-t border-line pt-5 first:border-t-0 first:pt-0" : "",
        !flush ? "-mx-5 border-t border-line px-5 py-5 first:border-t-0 first:pt-0" : "",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      <Heading className="text-[13px] font-medium text-ink">{title}</Heading>

      {description && (
        <p className="mt-1 text-[13px] leading-relaxed text-ink-subtle">
          {description}
        </p>
      )}

      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default FormSection;