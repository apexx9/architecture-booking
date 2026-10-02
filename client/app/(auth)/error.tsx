"use client";

import { useEffect } from "react";

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary for the auth screens.
 *
 * The most likely cause is a failed `GET /auth/me` during session bootstrap, or
 * an unreachable API. Neither is the visitor's fault, so the copy says so and
 * offers a retry rather than a dead end. `error` is deliberately not rendered:
 * these messages are developer-facing and can carry internals.
 */
export default function AuthError({ error, reset }: AuthErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6"
    >
      <h1 className="text-pretty text-[28px] leading-[1.1] font-medium text-ink">
        We could not reach Renove
      </h1>

      <p className="mt-3 text-pretty text-[15px] leading-relaxed text-ink-muted">
        Something failed on our side, not yours. Check your connection and try
        again — if it keeps happening, the details in the browser console will
        help us track it down.
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex h-11 w-fit cursor-pointer items-center justify-center rounded-sm border border-transparent bg-ink px-6 text-[13px] font-medium text-ink-inverse transition-colors duration-150 hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
      >
        Try again
      </button>
    </main>
  );
}