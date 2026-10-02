import Skeleton from "@/components/ui/skeleton";

/**
 * Placeholder shown while a workspace route's data resolves.
 *
 * Nested inside the shell, so it fills the content area only — no sidebar, no
 * topbar, no second `<main>`. It mirrors the settled screen's geometry so the
 * transition does not reflow, and it is entirely inert: no fake values, nothing
 * that could be mistaken for live data.
 */
export default function WorkspaceLoading() {
  return (
    <div aria-busy="true" className="px-6 py-8 lg:px-10">
      <span className="sr-only">Loading…</span>

      <Skeleton className="h-7 w-48" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="rounded-md border border-line bg-surface p-5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-6 w-32" />
            <Skeleton className="mt-3 h-3 w-full" />
          </div>
        ))}
      </div>

      <div className="mt-10 max-w-2xl space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-9/12" />
      </div>
    </div>
  );
}