"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

/**
 * Viewport positioning for panels that have to escape their own layout.
 *
 * Every floating surface in this app — select, date field, menu — used to be an
 * absolutely positioned child of its trigger. That ties the panel to its parent:
 * any ancestor that scrolls or clips (`overflow-x-auto` on a table, a scrolling
 * sidebar, a `Section` with a max height) crops it, and because the panel counts
 * towards that ancestor's scrollable overflow, opening it can also add a
 * scrollbar or shift the layout — the parent visibly deforms around the dropdown.
 * `z-50` does not rescue it, because the panel is trapped in the parent's
 * stacking context no matter how high the index goes.
 *
 * So the panel is rendered into `document.body` and placed against the viewport
 * with fixed coordinates, measured after it mounts. The component keeps owning
 * the markup, the styling and the keyboard behaviour; only the coordinates move.
 *
 * What it deliberately does not do is watch the panel for collisions or animate.
 * Panels here are menus a few rows tall, anchored to a control that is on screen,
 * so the fit that matters is vertical — flip above the trigger when there is no
 * room below — plus keeping the panel inside the viewport horizontally.
 */

export type PanelPlacement = "top" | "bottom";

interface UseFloatingPanelOptions<TAnchor extends HTMLElement> {
  /**
   * Whether the panel is currently open. Positioning is meaningless while it is
   * closed — and, more importantly, the panel does not exist in the DOM to
   * measure while it is closed, so opening it has to schedule a fresh
   * measurement.
   */
  open: boolean;
  /**
   * The trigger to position against. Passed in rather than created here so each
   * component keeps one ref for its own trigger instead of holding two that have
   * to be kept in step.
   */
  anchorRef: RefObject<TAnchor | null>;
  /** Panel width follows the trigger's width. Menus and date fields need this. */
  matchAnchorWidth?: boolean;
  /** Which edge of the trigger the panel lines up with when it has its own width. */
  align?: "start" | "end";
  /** Space between the trigger and the panel, in px. */
  offset?: number;
  /** Narrowest the panel may become, in px. */
  minWidth?: number;
  /** Space kept between the panel and the viewport edge, in px. */
  viewportPadding?: number;
}

interface FloatingPanel {
  /** Attach to the panel element. */
  panelRef: RefObject<HTMLDivElement | null>;
  /** Fixed coordinates for the panel. Pass straight to its `style`. */
  panelStyle: CSSProperties;
  /** Whether the panel opened above the trigger. Drives direction-aware styling. */
  placement: PanelPlacement;
}

interface PanelPosition {
  top: number;
  left: number;
  width: number | null;
  maxWidth: number;
  maxHeight: number;
  placement: PanelPlacement;
}

const DEFAULT_OFFSET_PX = 6;
const DEFAULT_VIEWPORT_PADDING_PX = 8;

/**
 * The position used for the very first paint, before the panel has been measured.
 * The layout effect corrects it before the browser paints, so it is never seen.
 */
const UNPLACED: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
};

export function useFloatingPanel<TAnchor extends HTMLElement>({
  open,
  anchorRef,
  matchAnchorWidth = false,
  align = "start",
  offset = DEFAULT_OFFSET_PX,
  minWidth = 0,
  viewportPadding = DEFAULT_VIEWPORT_PADDING_PX,
}: UseFloatingPanelOptions<TAnchor>): FloatingPanel {
  const panelRef = useRef<HTMLDivElement | null>(null);

  /**
   * The panel's height, kept in a ref rather than state: it is read on every
   * scroll tick and re-measuring into state would render on each one.
   */
  const panelHeightRef = useRef(0);

  const [position, setPosition] = useState<PanelPosition | null>(null);

  const update = useCallback(() => {
    const anchor = anchorRef.current;

    if (!anchor) {
      return;
    }

    const panel = panelRef.current;

    if (panel) {
      const measured = panel.getBoundingClientRect().height;

      if (measured > 0) {
        panelHeightRef.current = measured;
      }
    }

    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const available = Math.max(0, viewportWidth - viewportPadding * 2);

    // A panel that takes the trigger's width still gets a floor, so a narrow
    // trigger cannot squeeze its options into an unreadable column.
    const requested = matchAnchorWidth
      ? Math.max(rect.width, minWidth)
      : minWidth;

    const width = matchAnchorWidth ? Math.min(requested, available) : null;

    // Panels with their own width align to an edge; panels matching the trigger
    // start where the trigger starts.
    let left = matchAnchorWidth || align === "start" ? rect.left : rect.right - requested;

    // Keep it on screen without letting a trigger near the edge push the panel
    // away from the control it belongs to.
    const measuredWidth = width ?? requested;

    left = Math.min(Math.max(left, viewportPadding), viewportPadding + Math.max(0, available - measuredWidth));

    const spaceBelow = viewportHeight - rect.bottom - offset;
    const spaceAbove = rect.top - offset;
    const height = panelHeightRef.current;

    /*
     * Prefer below, and only give it up when the panel genuinely does not fit
     * and there is more room above. Comparing the real measured height matters
     * here: a short panel flips less often than a fixed maximum would, so a
     * three-option menu near the bottom of the page stays put.
     */
    const fitsBelow = height === 0 || spaceBelow >= height;
    const placement: PanelPlacement =
      fitsBelow || spaceBelow >= spaceAbove ? "bottom" : "top";

    const desiredTop =
      placement === "bottom" ? rect.bottom + offset : rect.top - offset - height;

    /*
     * A trigger in a corner can leave a panel that fits on neither side. Rather
     * than let it hang off the screen, pin it inside the viewport and cap its
     * height so its own list scrolls — the cap is an upper bound, so a panel
     * that already limits itself is unaffected.
     */
    const maxHeight = Math.max(0, viewportHeight - viewportPadding * 2);
    const top = Math.min(
      Math.max(desiredTop, viewportPadding),
      Math.max(viewportPadding, viewportHeight - viewportPadding - height),
    );

    setPosition((previous) => {
      const next = { top, left, width, maxWidth: available, maxHeight, placement };

      // Scroll and resize fire far more often than anything actually moves.
      if (
        previous &&
        previous.top === next.top &&
        previous.left === next.left &&
        previous.width === next.width &&
        previous.maxWidth === next.maxWidth &&
        previous.maxHeight === next.maxHeight &&
        previous.placement === next.placement
      ) {
        return previous;
      }

      return next;
    });
  }, [align, anchorRef, matchAnchorWidth, minWidth, offset, viewportPadding]);

  /*
   * Measure and place before the browser paints, so the panel is never seen at
   * the top-left corner or in the wrong direction.
   *
   * This is keyed on `open` rather than run once on mount because the panel is
   * unmounted while it is closed: a measurement taken at mount has no panel to
   * measure, so the direction would be decided from a height of zero and left
   * stale for the rest of the page's life.
   */
  useLayoutEffect(() => {
    if (!open) {
      /*
       * Forget the closed panel's height so the next open measures the panel it
       * actually has — an options list can have grown since.
       *
       * The stored position is left alone deliberately: the panel is unmounted,
       * so nothing is showing it, and clearing it would only buy a render.
       */
      panelHeightRef.current = 0;

      return;
    }

    update();
  }, [open, anchorRef, update]);

  /*
   * A portalled panel cannot see its trigger's context, so it has to be told
   * when that context moves. Scroll does not bubble, but a capturing listener on
   * the window still receives it from any scrolling ancestor.
   */
  useEffect(() => {
    const anchor = anchorRef.current;

    if (!open || !anchor) {
      return;
    }

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    // Mobile browsers resize the visual viewport when the keyboard opens, which
    // does not always fire a window resize.
    window.visualViewport?.addEventListener("resize", update);

    const observer = new ResizeObserver(update);

    observer.observe(anchor);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [anchorRef, open, update]);

  const panelStyle: CSSProperties = position
    ? {
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width ?? undefined,
        maxWidth: position.maxWidth,
        maxHeight: position.maxHeight,
      }
    : UNPLACED;

  return {
    panelRef,
    panelStyle,
    placement: position?.placement ?? "bottom",
  };
}