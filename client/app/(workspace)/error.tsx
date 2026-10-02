"use client";

import { useEffect } from "react";

interface WorkspaceErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary for the workspace.
 *
 * Reports what went wrong and offers a retry, without guessing at a cause or
 * prescribing a next step. `error` is deliberately not rendered: these messages
 * are developer-facing and can contain internals.
 */
export default function WorkspaceError({ error, reset }: WorkspaceErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-6 py-16 lg:px-10">
      <div className="max-w-md">
        <h1 className="font-display text-[24px] font-light text-ink">
          Something went wrong
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          This screen could not be loaded. Trying again often resolves it. If it
          keeps happening, the details in the browser console will help us track
          it down.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-10 cursor-pointer items-center justify-center rounded-sm border border-transparent bg-ink px-5 text-[13px] font-medium text-ink-inverse transition-colors duration-150 hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
        >
          Try again
        </button>
      </div>
    </div>
  );
}