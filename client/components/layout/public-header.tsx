"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import Logo from "@/components/ui/logo";
import { EngageCta } from "@/components/auth/engage-cta";

const NAV_LINKS = [
  { name: "Overview", href: "/" },
  { name: "Pricing", href: "/pricing" },
  { name: "Templates", href: "/templates" },
  { name: "Resources", href: "/blog" },
  { name: "About", href: "/about" },
];

const PANEL_ID = "marketing-mobile-nav";

const PublicHeader = () => {
  const pathname = usePathname();
  const [isFloating, setIsFloating] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const closeNav = () => setIsNavOpen(false);
  const toggleNav = () => setIsNavOpen((prev) => !prev);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const activeHrefRef = useRef<string | null>(null);
  const wasOpen = useRef(false);

  const applyActiveHref = (href: string | null) => {
    activeHrefRef.current = href;

    for (const el of headerRef.current?.querySelectorAll<HTMLElement>(
      "a[data-nav-item]",
    ) ?? []) {
      const match = el.dataset.href === href;

      el.dataset.active = match ? "true" : "false";

      if (match) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    }
  };

  // High-performance scroll progress tracker for 100% iOS / Apple Safari compatibility
  useEffect(() => {
    let rafId: number | null = null;

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(progress);
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          updateScrollProgress();
          rafId = null;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollProgress(); // Initial check on mount

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Observe page sections for active navigation states
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-nav-link]");

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }

        if (best)
          applyActiveHref((best.target as HTMLElement).dataset.navLink ?? null);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const section of sections) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    applyActiveHref(activeHrefRef.current);
  }, [isFloating, pathname]);

  // Scroll sentinel observer for floating effect
  useEffect(() => {
    const sentinel = document.querySelector("[data-scroll-sentinel]");

    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsFloating(!entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  // Lock body scroll and handle focus when mobile nav is open
  useEffect(() => {
    if (!isNavOpen) {
      if (wasOpen.current) {
        wasOpen.current = false;
        toggleRef.current?.focus();
      }
      return;
    }

    wasOpen.current = true;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNav();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [isNavOpen]);

  return (
    <header
      ref={headerRef}
      data-floating={isFloating ? "true" : "false"}
      className="sticky top-0 z-40"
    >
      {/* Scroll progress bar (driven by JS requestAnimationFrame for complete iOS Safari support) */}
      <div
        aria-hidden="true"
        style={{ transform: `scaleX(${scrollProgress})` }}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-[#191919] pointer-events-none transition-transform duration-75 ease-out"
      />
      <div
        className={[
          "mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-6 sm:px-8 md:px-10",
          "transition-opacity duration-300 ease-out motion-reduce:transition-none",
          isNavOpen ? "pointer-events-none opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <Link
          href="/"
          aria-label="Renove home"
          className="flex min-h-11 items-center shrink-0 transition-transform duration-300 ease-out hover:scale-[1.03]"
        >
          <Logo variant="dark" />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary" className="relative hidden lg:block">
          <span
            aria-hidden="true"
            className={[
              "pointer-events-none absolute -inset-x-6 -inset-y-3 rounded-full",
              "border border-white/10 bg-[#191919]/95 shadow-xl shadow-black/20",
              "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              "motion-reduce:transition-none",
              isFloating ? "scale-100 opacity-100" : "scale-95 opacity-0",
            ].join(" ")}
          />

          <ul className="relative flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-nav-item
                    data-href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "nav-link text-[14px] transition-colors duration-500 ease-out",
                      isFloating
                        ? isActive
                          ? "font-medium text-white"
                          : "text-white/60 hover:text-white"
                        : isActive
                          ? "font-medium text-black"
                          : "text-black/70 hover:text-black",
                    ].join(" ")}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {/* Mobile Menu Toggle Button with max z-index and touch handlers */}
          <button
            ref={toggleRef}
            type="button"
            onClick={toggleNav}
            aria-expanded={isNavOpen}
            aria-controls={PANEL_ID}
            aria-label={isNavOpen ? "Close menu" : "Open menu"}
            className="relative z-[9999] flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-black/5 lg:hidden pointer-events-auto touch-manipulation cursor-pointer"
          >
            <span
              aria-hidden="true"
              className="relative block h-3.5 w-5 pointer-events-none"
            >
              <span
                className={[
                  "absolute top-0 left-0 h-[1.5px] w-5 rounded-full bg-current",
                  "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                  isNavOpen ? "translate-y-[6.5px] rotate-45" : "translate-y-0",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute bottom-0 left-0 h-[1.5px] w-5 rounded-full bg-current",
                  "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                  isNavOpen
                    ? "-translate-y-[6.5px] -rotate-45"
                    : "translate-y-0",
                ].join(" ")}
              />
            </span>
          </button>

          <EngageCta variant={isFloating ? "floating" : "default"} />
        </div>
      </div>

      {/* Scrim */}
      <div
        aria-hidden="true"
        onClick={closeNav}
        className={[
          "fixed inset-0 z-[998] bg-black/50 backdrop-blur-[2px]",
          "transition-opacity duration-300 ease-out motion-reduce:transition-none",
          isNavOpen
            ? "opacity-100 pointer-events-auto"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Left drawer */}
      <div
        id={PANEL_ID}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        className={[
          "fixed inset-y-0 left-0 z-[999] flex w-[300px] max-w-[85vw] flex-col",
          "bg-[#191919] text-white outline-none shadow-2xl",
          "transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          isNavOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-8">
          <Logo variant="light" />
          <button
            type="button"
            onClick={closeNav}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white touch-manipulation cursor-pointer"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6 pb-6">
          <ul className="flex flex-col">
            {NAV_LINKS.map((link, index) => {
              const isActive = pathname === link.href;

              return (
                <li
                  key={link.href}
                  className="border-t border-white/10 first:border-t-0"
                >
                  <Link
                    href={link.href}
                    onClick={closeNav}
                    data-nav-item
                    data-href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className="group flex items-baseline gap-4 py-4 transition-opacity duration-200 hover:opacity-70 motion-reduce:transition-none"
                  >
                    <span className="text-[11px] text-white/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="nav-link-panel text-[26px] leading-none font-medium sm:text-[30px]">
                      {link.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-6" onClick={closeNav}>
          <EngageCta next={pathname} label="Start free" variant="floating" />
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
