import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

const NotFound = () => {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-6 px-6 sm:px-10">
      <p className="text-xs font-bold tracking-[0.15em] text-black/40 uppercase">
        404
      </p>

      <h1 className="text-[40px] leading-[1.05] font-medium text-black sm:text-[56px]">
        This page does not exist
      </h1>

      <p className="max-w-md text-[16px] leading-relaxed text-black/60">
        The link may be out of date, or the page may have moved.
      </p>

      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-full bg-[#191919] px-6 text-[13px] font-medium text-white transition-colors duration-200 hover:bg-[#191919]/90"
      >
        Back to home
      </Link>
    </main>
  );
};

export default NotFound;
