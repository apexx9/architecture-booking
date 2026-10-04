"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { date, APP_NAME } from "@/utils/utils";
import { ChevronRight } from "lucide-react";

/* ---------- Helpers ---------- */
export const buildBackground = (src: string, opacity = 0.3) => `
  linear-gradient(rgba(0, 0, 0, ${opacity}), rgba(0, 0, 0, ${opacity})),
  url(${src}) center center / cover no-repeat
`;

/*
 * Entrance animation, opted into only when the visitor has not asked for
 * reduced motion. The media query lives in CSS rather than in a JS matchMedia
 * hook so there is no flash of moving content and no hydration mismatch.
 */
export const fadeUp = (delay = 0): React.CSSProperties => ({
  animation: `fadeUp 600ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
});

export const AuthKeyframes = () => (
  <style>{`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .auth-fade-up {
        animation: none !important;
      }
    }
  `}</style>
);

/* ---------- Social icons ---------- */
export const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

export const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#7FBA00" d="M13 1h10v10H13z" />
    <path fill="#00A4EF" d="M1 13h10v10H1z" />
    <path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
);

/* ---------- Social button ---------- */
/**
 * Renders as a link when `href` is supplied, since the OAuth handshake is a
 * full-page navigation to the provider. Without `href` it stays a button so
 * providers we have not wired server side remain visibly inert rather than
 * looking functional.
 */
export const SocialButton = ({
  label,
  href,
  disabled = false,
  children,
}: {
  label: string;
  href?: string;
  disabled?: boolean;
  children: ReactNode;
}) => {
  const className = `
      flex h-11 w-full items-center justify-center
      rounded-sm border border-line bg-surface
      transition-colors duration-150 ease-out
      ${
        disabled
          ? "cursor-not-allowed opacity-50 grayscale"
          : "cursor-pointer hover:border-line-strong hover:bg-surface-subtle"
      }
    `;

  if (disabled || !href) {
    return (
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        title={disabled ? "Coming soon" : undefined}
        className={className}
      >
        {children}
      </button>
    );
  }

  return (
    <a href={href} aria-label={label} title={label} className={className}>
      {children}
    </a>
  );
};

/* ---------- Language ---------- */
/**
 * Renove ships in English only. This used to be a dropdown offering French that
 * silently did nothing — a control that looks live but is not. It is now plain,
 * non-interactive text: no affordance, nothing to break, no false promise.
 *
 * If a second language is ever approved, this becomes a real menu with
 * keyboard support and an `aria-label` of "Language".
 */
export const LanguageLabel = () => (
  <span className="select-none px-1 text-[13px] text-ink-subtle">English</span>
);

/* ---------- Checkbox ---------- */
interface CheckboxProps {
  label: ReactNode;
  id: string;
  name?: string;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean;
}

export const Checkbox = ({
  label,
  id,
  name,
  checked,
  onChange,
  required,
  disabled,
}: CheckboxProps) => (
  <label
    htmlFor={id}
    className="flex cursor-pointer items-start gap-2 text-[12px] leading-relaxed text-ink-muted select-none has-disabled:cursor-not-allowed has-disabled:opacity-60"
  >
    <input
      id={id}
      name={name}
      type="checkbox"
      required={required}
      disabled={disabled}
      checked={checked}
      onChange={onChange}
      className="peer sr-only"
    />
    <span
      className="
        mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center
        rounded-xs border border-line-strong bg-surface
        transition-colors duration-150
        peer-checked:border-ink peer-checked:bg-ink
        peer-checked:[&>svg]:opacity-100
        peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink
      "
    >
      <svg
        className="size-2.5 text-ink-inverse opacity-0 transition-opacity duration-150"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
    <span>{label}</span>
  </label>
);

/* ---------- Shell ---------- */
interface AuthShellProps {
  heroImage: string;
  /**
   * Marketing line shown on the desktop hero panel. It is deliberately *not* an
   * `h1`: every auth screen supplies its own heading for the form, and two `h1`
   * landmarks on one page breaks the document outline. `aria-hidden` keeps it
   * out of the accessibility tree so screen readers hear the form's heading.
   */
  heroTitle: string;
  heroSubtitle: string;
  promoImage?: string;
  children: ReactNode;
}

export const AuthShell = ({
  heroImage,
  heroTitle,
  heroSubtitle,
  promoImage,
  children,
}: AuthShellProps) => {
  const heroBackground = buildBackground(heroImage);
  const promoBackground = buildBackground(promoImage ?? heroImage);

  return (
    <main
      id="main"
      tabIndex={-1}
      className="w-full min-h-dvh overflow-hidden bg-surface p-3 sm:p-4 lg:h-dvh lg:p-4.75"
    >
      <AuthKeyframes />

      <div
        className="h-full w-full flex flex-col lg:flex-row lg:justify-between items-stretch gap-0 lg:gap-8 rounded-3xl lg:rounded-4xl"
        style={{ background: heroBackground }}
      >
        {/* ---------- Hero (desktop only) ---------- */}
        <div
          aria-hidden="true"
          className="
            hidden lg:flex flex-col items-start justify-between gap-4
            max-w-[500px]
            lg:ml-16 xl:ml-36
            lg:my-16 xl:my-22.5
            lg:mr-8
            lg:h-[calc(100%-8rem)] xl:h-[calc(100%-11.25rem)]
          "
        >
          <div className="auth-fade-up" style={fadeUp(100)}>
            <Logo variant="light" />
          </div>

          <div className="flex flex-col gap-1.25">
            <p
              className="auth-fade-up font-medium text-[42px] leading-tight text-white xl:text-[48px]"
              style={fadeUp(200)}
            >
              {heroTitle}
            </p>
            <p
              className="auth-fade-up text-[16px] text-ink-inverse-muted xl:text-[18px]"
              style={fadeUp(300)}
            >
              {heroSubtitle}
            </p>
          </div>

          <p
            className="auth-fade-up text-[10px] text-ink-inverse-muted"
            style={fadeUp(400)}
          >
            &copy; {APP_NAME} {date}. All rights reserved.
          </p>
        </div>

        {/* ---------- Card ---------- */}
        <div
          className="
            auth-fade-up flex w-full max-w-[540px] flex-1 flex-col
            overflow-y-auto overscroll-contain rounded-3xl bg-white
            px-5 py-6 sm:px-7 sm:py-7 lg:mx-0 lg:my-5.5 lg:mr-5.5 lg:max-w-[500px]
            lg:flex-none lg:rounded-4xl lg:px-8 lg:pt-6 lg:pb-8
            [&::-webkit-scrollbar]:hidden
            [-ms-overflow-style:none]
            [scrollbar-width:none]
          "
          style={fadeUp(150)}
        >
          {/* Top bar — mobile logo (left) + language (right) */}
          <div className="flex items-center shrink-0">
            <div className="lg:hidden">
              <Logo variant="dark" />
            </div>
            <div className="ml-auto">
              <LanguageLabel />
            </div>
          </div>

          {children}

          {/* ---------- Bottom block ---------- */}
          <div className="flex flex-col gap-3 sm:gap-4 mt-auto pt-6 lg:pt-8 w-full">
            {promoImage !== undefined && (
              <div
                className="
                  group flex w-full flex-col justify-between overflow-hidden
                  h-36 rounded-sm p-5 sm:h-40 sm:p-6 lg:h-42.5
                  transition-colors duration-200 ease-out
                "
                style={{ background: promoBackground }}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-[15px] font-medium text-ink-inverse sm:text-[16px]">
                    New to {APP_NAME}?
                  </p>
                  <p className="text-[12px] text-ink-inverse-muted sm:text-[13px]">
                    See plans for solo architects and growing studios.
                  </p>
                </div>

                <div>
                  <Link
                    href="/pricing"
                    className="
                      inline-flex h-9 items-center gap-1.5 rounded-xs
                      border border-line-inverse px-4
                      text-[13px] font-medium text-ink-inverse
                      transition-colors duration-150 ease-out
                      hover:border-ink-inverse hover:bg-white/10
                      focus-visible:outline-2 focus-visible:outline-offset-2
                      focus-visible:outline-ink-inverse
                    "
                  >
                    See pricing
                    <ChevronRight className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                  </Link>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-6 text-xs text-ink-subtle sm:justify-end sm:gap-10">
              <Link
                href="/legal/terms"
                className="underline-offset-2 transition-colors duration-150 hover:text-ink hover:underline"
              >
                Terms of Service
              </Link>
              <Link
                href="/legal/privacy"
                className="underline-offset-2 transition-colors duration-150 hover:text-ink hover:underline"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AuthShell;
