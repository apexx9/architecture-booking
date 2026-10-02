import type { ReactNode } from "react";

import Footer from "@/components/layout/footer";
import PublicHeader from "@/components/layout/public-header";

interface MarketingLayoutProps {
  children: ReactNode;
}

/**
 * Public, browsable shell. No session required — the conversion point lives at
 * the action level (EngageCta), not around these routes.
 */
export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="relative flex min-h-full flex-col">
      {/* 24px-tall marker pinned to the top of the document, taken out of flow
          so it costs no layout. PublicHeader observes it to decide when to
          float, which keeps a scroll listener off the page entirely. The header
          floats once the top 24px have been scrolled past. */}
      <span
        aria-hidden="true"
        data-scroll-sentinel
        className="pointer-events-none absolute inset-x-0 top-0 h-6"
      />

      <PublicHeader />

      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}
