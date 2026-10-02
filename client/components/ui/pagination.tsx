"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Button from "@/components/ui/button";

export interface PaginationProps {
  /**
   * From §22.1: `meta.hasNextPage`. When false the forward control is disabled
   * rather than hidden, so the control does not shift as the user reaches the end.
   */
  hasNextPage: boolean;
  onNext: () => void;
  /** True when a previously visited page is available. See `canGoBack`. */
  canGoBack?: boolean;
  onPrevious?: () => void;
  /** Disables both controls and shows a spinner while a page is in flight. */
  isLoading?: boolean;
  /**
   * What is being paginated, e.g. "projects". Used in the labels and the live
   * announcement — passed in rather than hard-coded because the noun is a product
   * decision per screen.
   */
  label: string;
  className?: string;
}

/**
 * Cursor pagination control.
 *
 * §22.1 only returns `nextCursor`, so the history of visited cursors is the
 * client's to keep — `lib/api/pagination.ts` has the pure helpers for that. This
 * component stays presentational: it renders what the query knows and reports what
 * the user asked for.
 */
const Pagination = ({
  hasNextPage,
  onNext,
  canGoBack = false,
  onPrevious,
  isLoading = false,
  label,
  className,
}: PaginationProps) => {
  const previous = canGoBack && onPrevious !== undefined;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 ${className ?? ""}`}
    >
      {/*
       * A pressed button that swaps to a spinner gives no announcement on its own,
       * so the in-flight state is mirrored into a live region.
       */}
      <p aria-live="polite" className="sr-only">
        {isLoading ? `Loading ${label}` : ""}
      </p>

      <Button
        variant="secondary"
        onClick={onPrevious}
        disabled={!previous || isLoading}
        aria-label={`Previous page of ${label}`}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Previous
      </Button>

      <Button
        variant="secondary"
        onClick={onNext}
        disabled={!hasNextPage || isLoading}
        aria-label={`Load more ${label}`}
      >
        {isLoading ? (
          <>
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Loading
          </>
        ) : (
          "Load more"
        )}
      </Button>
    </div>
  );
};

export default Pagination;
