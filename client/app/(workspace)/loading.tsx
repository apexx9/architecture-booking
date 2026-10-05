import Skeleton from "@/components/ui/skeleton";

/**
 * Shown while a workspace route's data resolves.
 *
 * Nested inside the shell, so it fills the content area only — no sidebar, no
 * context bar, no second `<main>`. It mirrors the geometry a settled workspace
 * page has: title, a toolbar rule, a table, then two columns beneath. It does
 * *not* skeleton a grid of cards, because no workspace page is laid out that way
 * any more, and a loading state that does not match the result is a visible jump.
 *
 * Entirely inert: no fake values, nothing that could be mistaken for live data.
 */
export default function WorkspaceLoading() {
  return (
    <div
      aria-busy="true"
      className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10"
    >
      <span className="sr-only">Loading…</span>

      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-3 h-4 w-80" />

      <Skeleton className="mt-8 h-14 w-full" />

      <div className="mt-10">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <Skeleton className="h-4 w-24" />

          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        </div>

        <div>
          <Skeleton className="h-4 w-24" />

          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}