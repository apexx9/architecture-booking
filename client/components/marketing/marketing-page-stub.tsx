import type { Metadata } from "next";

interface MarketingPageStubProps {
  title: string;
  description?: string;
  eyebrow?: string;
}

/**
 * Placeholder for public marketing pages that are linked but not yet designed.
 *
 * Exists so the public site never links to a 404. It deliberately renders
 * almost nothing: the visual design and the actual copy of every one of these
 * pages is a product decision owned by Aaron, and placeholder prose would be
 * invented content presented as real.
 */
export function MarketingPageStub({
  title,
  description,
  eyebrow,
}: MarketingPageStubProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-10 lg:py-28">
      {/*
        One block reveal rather than a cascade: these pages are a single column of
        prose, so `motion-design` gives no hierarchy for a stagger to express.
        The heading keeps its own masked-line treatment because it is display type.
      */}
      <div className="scroll-reveal">
        {eyebrow ? (
          <p className="text-xs font-bold tracking-[0.15em] text-ink-subtle uppercase">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-3 text-pretty text-[40px] leading-[1.05] font-medium text-ink sm:text-[56px]">
          <span className="scroll-line-mask">
            <span>{title}</span>
          </span>
        </h1>

        {description ? (
          <p className="mt-5 max-w-2xl text-pretty text-[17px] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}

        <p className="mt-8 inline-flex items-center border border-line bg-surface-subtle px-3 py-2 text-[13px] text-ink-muted">
          This page has not been written yet.
        </p>
      </div>
    </section>
  );
}

export function createMarketingMetadata(title: string): Metadata {
  return { title };
}

export default MarketingPageStub;
