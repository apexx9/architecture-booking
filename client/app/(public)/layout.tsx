"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import Footer from "@/components/layout/footer";
import PublicHeader from "@/components/layout/public-header";

interface MarketingLayoutProps {
  children: ReactNode;
}

/**
 * Public shell. The root route uses the Archion-inspired header/footer authored
 * as part of its full-page composition; other public routes keep the shared shell.
 */
export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="relative flex min-h-full flex-col">
      {!isHome && (
        <>
          <span
            aria-hidden="true"
            data-scroll-sentinel
            className="pointer-events-none absolute inset-x-0 top-0 h-6"
          />
          <PublicHeader />
        </>
      )}

      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>

      {!isHome && <Footer />}
    </div>
  );
}
