import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

const NotFound = () => {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start justify-center gap-6 px-6 sm:px-10"
    >
      <p className="text-[11px] tracking-[0.15em] text-ink-subtle uppercase">
        404
      </p>

      <h1 className="text-pretty text-[40px] leading-[1.05] font-medium text-ink sm:text-[56px]">
        <span className="scroll-line-mask">
          <span>This page does not exist</span>
        </span>
      </h1>

      <p className="max-w-md text-pretty text-[16px] leading-relaxed text-ink-muted">
        The link may be out of date, or the page may have moved.
      </p>

      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-sm border border-transparent bg-ink px-6 text-[13px] font-medium text-ink-inverse transition-colors duration-150 hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
      >
        Back to home
      </Link>
    </main>
  );
};

export default NotFound;
