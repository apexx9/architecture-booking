"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import WorkspaceNav, {
  type NavGroup,
} from "@/components/workspace/workspace-nav";

const PANEL_ID = "workspace-mobile-nav";

interface WorkspaceMobileNavProps {
  groups: NavGroup[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Off-canvas navigation for small screens.
 *
 * Modelled on the drawer already used by the public header, so behaviour is
 * familiar: it is a labelled modal dialog, Escape closes it, focus moves into
 * it on open, is trapped while open, and returns to the trigger on close. The
 * background is inert to clicks and the page behind cannot scroll.
 */
const WorkspaceMobileNav = ({
  groups,
  isOpen,
  onClose,
}: WorkspaceMobileNavProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    closeButtonRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();

        onClose();

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();

        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();

        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 motion-reduce:transition-none"
      />

      <div
        ref={panelRef}
        id={PANEL_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Workspace menu"
        tabIndex={-1}
        className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-line bg-surface"
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line px-4">
          <span className="text-[11px] tracking-[0.14em] text-ink-subtle uppercase">
            Menu
          </span>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-1.5 flex size-9 cursor-pointer items-center justify-center rounded-sm text-ink-muted transition-colors duration-150 hover:bg-surface-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <WorkspaceNav groups={groups} onNavigate={onClose} />
        </div>

        <div className="shrink-0 border-t border-line px-4 py-4">
          <Link
            href="/"
            onClick={onClose}
            className="text-[13px] text-ink-subtle transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Renove home
          </Link>
        </div>
      </div>
    </>
  );
};

export default WorkspaceMobileNav;