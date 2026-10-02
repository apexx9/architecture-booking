"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export interface DialogProps {
  /**
   * Controls visibility. Keep the dialog mounted and toggle this — unmounting it
   * would skip the native open/close transition and the focus restore.
   */
  open: boolean;
  onClose: () => void;
  /** Accessible name. Ignored when `title` is present, which names it instead. */
  label: string;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Actions. Rendered in a footer with its own edge, so dialogs read as forms. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Hides the close button. Use for decisions that must be answered explicitly. */
  hideClose?: boolean;
  className?: string;
}

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

/**
 * Modal dialog on the native `<dialog>` element.
 *
 * `showModal()` puts the dialog in the top layer, marks the rest of the document
 * inert and moves focus in — all handled by the platform, so there is no hand-rolled
 * focus trap here. What remains is restoring focus on the way out, which `<dialog>`
 * deliberately does not do.
 *
 * The backdrop styling and its fade live in `app/globals.css` so there is one copy
 * of the keyframes and they inherit the global reduced-motion guard.
 */
const Dialog = ({
  open,
  onClose,
  label,
  title,
  description,
  children,
  footer,
  size = "md",
  hideClose = false,
  className,
}: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      // Capture where focus came from before it moves into the dialog.
      restoreFocusRef.current = document.activeElement as HTMLElement | null;

      if (!dialog.open) dialog.showModal();

      /*
       * Native autofocus picks the first autofocusable element, but a dialog
       * opened with a form should start at the form, not the close button. With
       * nothing autofocusable, the dialog itself takes focus so Escape works.
       */
      const target = dialog.querySelector<HTMLElement>("[data-autofocus]");
      (target ?? dialog).focus();

      return;
    }

    if (dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : label}
      aria-describedby={description ? descriptionId : undefined}
      /*
       * `close` fires for every exit — Escape, the close button, and our own
       * `close()` — so focus restoration and the parent callback live here once.
       */
      onClose={() => {
        const restoreTo = restoreFocusRef.current;
        restoreFocusRef.current = null;
        onClose();
        // After paint, so it does not race the dialog tearing down.
        requestAnimationFrame(() => restoreTo?.focus?.());
      }}
      className={[
        "w-[calc(100vw-2rem)] max-h-[calc(100dvh-4rem)] p-0 m-auto",
        "rounded-sm border border-line bg-surface text-ink",
        "shadow-[0_8px_32px_-10px_rgba(25,25,25,0.20)]",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
        SIZES[size],
        className ?? "",
      ].join(" ")}
    >
      {title || description || !hideClose ? (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="text-[15px] leading-6 font-medium text-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descriptionId} className="mt-1 text-[13px] leading-5 text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>

          {hideClose ? null : (
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors duration-150 hover:bg-surface-subtle hover:text-ink motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : null}

      <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto px-5 py-4">{children}</div>

      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-sm border-t border-line bg-surface-subtle px-5 py-3">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
};

export default Dialog;
