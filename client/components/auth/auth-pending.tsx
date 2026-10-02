import Skeleton from "@/components/ui/skeleton";

/**
 * Full-viewport pending state for the session gate.
 *
 * `ProtectedRoute` and `GuestRoute` sit above the shells, so they cannot use a
 * route-level `loading.tsx`. Without this, a page refresh inside the workspace
 * rendered `null` — a blank white flash with no indication anything was
 * happening.
 *
 * Intentionally sparse: at this point we know the session is being checked and
 * nothing else, so there is no practice name, no navigation and nothing to read.
 */
const AuthPending = () => (
  <div
    aria-busy="true"
    className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-background px-6"
  >
    <span className="sr-only">Checking your session…</span>

    <Skeleton className="h-6 w-28" />

    <div className="w-full max-w-xs space-y-2.5">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  </div>
);

export default AuthPending;