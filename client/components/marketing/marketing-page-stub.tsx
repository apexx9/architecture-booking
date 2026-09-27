import type { Metadata } from "next";

interface MarketingPageStubProps {
  title: string;
  description?: string;
  eyebrow?: string;
}

/**
 * Placeholder for public marketing pages. Structure and routing only — the
 * visual design of every page is owned by Aaron.
 */
export function MarketingPageStub({
  title,
  description,
  eyebrow,
}: MarketingPageStubProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-10 lg:py-28">
      {eyebrow ? (
        <p className="text-xs font-bold tracking-[0.15em] text-black/40 uppercase">
          {eyebrow}
        </p>
      ) : null}

      <h1 className="mt-3 text-[40px] leading-[1.05] font-medium text-black sm:text-[56px]">
        {title}
      </h1>

      {description ? (
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-black/60">
          {description}
        </p>
      ) : null}

      {/* TODO(aaron): page content + design */}
    </section>
  );
}

export function createMarketingMetadata(title: string): Metadata {
  return { title };
}

export default MarketingPageStub;
