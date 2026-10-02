import Link from "next/link";

/**
 * Shown when a workspace URL resolves to nothing. Links back into the workspace
 * rather than to marketing, because the visitor is signed in.
 */
export default function WorkspaceNotFound() {
  return (
    <div className="px-6 py-16 lg:px-10">
      <div className="max-w-md">
        <p className="text-[11px] tracking-[0.14em] text-ink-subtle uppercase">
          404
        </p>

        <h1 className="mt-3 font-display text-[24px] font-light text-ink">
          This page does not exist
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          The address you followed is not part of the workspace. It may have
          moved, or the link may have been mistyped.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-sm border border-transparent bg-ink px-5 text-[13px] font-medium text-ink-inverse transition-colors duration-150 hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}