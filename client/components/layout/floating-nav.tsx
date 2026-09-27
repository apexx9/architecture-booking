"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/components/ui/logo";
import { EngageCta } from "@/components/auth/engage-cta";

export type PublicNavLink = {
  name: string;
  href: string;
};

type FloatingNavProps = {
  links: PublicNavLink[];
};

const FloatingNav = ({ links }: FloatingNavProps) => {
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Link
        href="/"
        aria-label="Renove home"
        className="transition-transform duration-300 hover:scale-105"
      >
        <Logo variant="dark" />
      </Link>

      <nav
        aria-label="Primary"
        className="hidden items-center gap-5 rounded-full bg-[#191919]/95 px-6 py-3 backdrop-blur-md border border-white/10 shadow-xl shadow-black/20 md:flex"
      >
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "text-[14px] font-medium text-white transition-colors"
                  : "text-[14px] text-white/60 transition-colors duration-200 hover:text-white"
              }
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <EngageCta variant="floating" />
      </div>
    </div>
  );
};

export default FloatingNav;
