import React from "react";
import Link from "next/link";

import Logo from "@/components/ui/logo";
import { APP_NAME, SUPPORT_EMAIL, SUPPORT_PHONE, date } from "@/utils/utils";

interface FooterLink {
  name: string;
  href: string;
}

interface FooterSection {
  id: string;
  title: string;
  links: FooterLink[];
}

/**
 * Links must resolve to real routes. The workflow column is gone for now: those
 * destinations become real pages inside the workspace, and linking to the app
 * from the marketing footer is what the auth wall already handles per action.
 *
 * TODO(aaron): restore workflow links when the workspace pages exist.
 */
const FOOTER_SECTIONS: FooterSection[] = [
  {
    id: "product",
    title: "Product",
    links: [
      { name: "Overview", href: "/" },
      { name: "Pricing", href: "/pricing" },
      { name: "Templates", href: "/templates" },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    links: [
      { name: "Blog", href: "/blog" },
      { name: "Guides", href: "/guides" },
      { name: "Help centre", href: "/help" },
      { name: "API documentation", href: "/developers" },
      { name: "System status", href: "/status" },
    ],
  },
  {
    id: "company",
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "Changelog", href: "/changelog" },
    ],
  },
];

const LEGAL_LINKS: FooterLink[] = [
  { name: "Terms of service", href: "/legal/terms" },
  { name: "Privacy policy", href: "/legal/privacy" },
  { name: "Cookie policy", href: "/legal/cookies" },
  { name: "Security", href: "/legal/security" },
  { name: "Data processing", href: "/legal/data-processing" },
];

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    path: "M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8C2.4 4 4 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2Zm0 5.1a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.9-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z",
  },
  {
    label: "X",
    href: "https://x.com",
    path: "M18.244 2H21.5l-7.11 8.13L22.75 22h-6.557l-5.13-6.72L5.18 22H1.922l7.603-8.69L1.5 2h6.723l4.637 6.127L18.244 2Zm-1.148 17.71h1.803L7.238 4.176H5.303L17.096 19.71Z",
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    path: "M14 8h3V4h-3c-3.31 0-5 1.69-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.67.33-1 1-1Z",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    path: "M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.2 8.5h3.6V21H3.2V8.5Zm5.9 0h3.45v1.7h.05c.48-.9 1.66-1.85 3.42-1.85 3.66 0 4.33 2.4 4.33 5.53V21h-3.6v-6.1c0-1.45-.03-3.32-2.03-3.32-2.03 0-2.34 1.58-2.34 3.21V21H9.1V8.5Z",
  },
];

const Footer = () => {
  return (
    <footer className="bg-[#191919] px-16 py-24 sm:px-10 lg:px-36 lg:py-40">
      <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
        {/* Brand + contact */}
        <div className="flex flex-col">
          <Logo variant="light" />

          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-white/60">
            From first lead to final invoice, one operating system for
            architecture and interior design practices.
          </p>

          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-6 text-[16px] font-medium text-white underline underline-offset-4 transition-opacity duration-200 hover:opacity-80 lg:text-[18px]"
          >
            {SUPPORT_EMAIL}
          </a>

          <a
            href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
            className="mt-2 mb-1 text-[16px] font-medium text-white underline underline-offset-4 transition-opacity duration-200 hover:opacity-80 lg:text-[18px]"
          >
            {SUPPORT_PHONE}
          </a>

          <p className="mt-2 text-[13px] text-white/50">Accra, Ghana</p>

          <ul className="mt-6 flex gap-3">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors duration-200 hover:bg-white/30"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation */}
        <nav className="grid grid-cols-2 justify-end gap-10 sm:grid-cols-3">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.id}>
              <h3 className="mb-6 text-xs font-bold tracking-[0.15em] text-white uppercase">
                {section.title}
              </h3>

              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-white/60 transition-colors duration-200 hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="mt-14 border-t border-white/10 pt-8 lg:mt-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[13px] text-white/50">
            &copy; {date} {APP_NAME}. All rights reserved.
          </p>

          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[13px] text-white/50 transition-colors duration-200 hover:text-white"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
