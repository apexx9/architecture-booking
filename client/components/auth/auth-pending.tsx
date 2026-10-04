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
    className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-6"
  >
    <div className="w-full max-w-xs rounded-md border border-line bg-surface p-5 shadow-[0_10px_30px_rgba(25,25,25,0.02)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-subtle">
        Secure access
      </p>
      <h1 className="mt-3 text-[22px] font-medium tracking-[-0.04em] text-ink">
        Checking your session…
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
        We’re verifying your account and redirecting you back to your workspace.
      </p>

      <div className="mt-6 space-y-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  </div>
);

export default AuthPending;
