import Skeleton from "@/components/ui/skeleton";

/**
 * Suspense fallback for the auth routes.
 *
 * Self-contained rather than reusing `AuthShell`: the shell takes a hero image
 * and marketing copy that belong to a specific screen, and a generic fallback
 * cannot know which screen it is standing in for. Reusing it would either
 * render the wrong photograph or invent one.
 *
 * What it does mirror is the shell's geometry — the split panel, its radii and
 * its padding — so the transition does not reflow.
 */
export default function AuthLoading() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="w-full min-h-dvh overflow-hidden bg-surface p-3 sm:p-4 lg:h-dvh lg:p-4.75"
    >
      <div
        aria-busy="true"
        className="flex h-full w-full flex-col items-stretch gap-0 rounded-3xl lg:flex-row lg:justify-between lg:gap-8 lg:rounded-4xl"
      >
        <span className="sr-only">Loading…</span>

        {/* Desktop hero panel */}
        <div
          aria-hidden="true"
          className="hidden w-1/2 rounded-4xl bg-surface-sunken lg:block"
        />

        {/* Form column */}
        <div className="flex w-full flex-col items-center justify-center rounded-3xl px-6 py-10 sm:px-12 lg:rounded-4xl lg:px-16">
          <div className="w-full max-w-md">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-3/4" />

            <div className="mt-8 space-y-5">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-11 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>

            <Skeleton className="mt-8 h-11 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}