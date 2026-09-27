"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { date, APP_NAME } from "@/utils/utils";
import { ChevronRight } from "lucide-react";

/* ---------- Helpers ---------- */
export const buildBackground = (src: string, opacity = 0.3) => `
  linear-gradient(rgba(0, 0, 0, ${opacity}), rgba(0, 0, 0, ${opacity})),
  url(${src}) center center / cover no-repeat
`;

export const fadeUp = (delay = 0): React.CSSProperties => ({
  animation: `fadeUp 600ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
});

export const AuthKeyframes = () => (
  <style>{`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-6px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
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
 * Social sign-in is not implemented server-side yet, so these render disabled
 * with an explanatory tooltip rather than pretending to work.
 */
export const SocialButton = ({
  label,
  disabled = false,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    title={disabled ? "Coming soon" : undefined}
    className={`
      flex items-center justify-center h-11 w-full
      bg-white border border-gray-200 rounded-2xl
      transition-all duration-200 ease-out
      ${
        disabled
          ? "cursor-not-allowed opacity-50 grayscale"
          : "cursor-pointer hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md hover:shadow-black/5 active:translate-y-0 active:shadow-sm"
      }
    `}
  >
    {children}
  </button>
);

/* ---------- Language select ---------- */
const languages = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
] as const;

type Language = (typeof languages)[number];

export const LanguageSelect = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Language>(languages[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
      >
        <span>{selected.label}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          style={{
            animation: "dropdownIn 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
          className="absolute right-0 mt-1.5 w-32 bg-white border border-gray-200 rounded-lg shadow-lg shadow-black/5 overflow-hidden z-20 py-1 origin-top-right"
        >
          {languages.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={selected.code === lang.code}
                onClick={() => {
                  setSelected(lang);
                  setOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 text-sm text-left transition-colors duration-150 cursor-pointer ${
                  selected.code === lang.code
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{lang.label}</span>
                {selected.code === lang.code && (
                  <svg
                    className="w-3.5 h-3.5 ml-auto text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

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
    className="flex items-start gap-2 text-[12px] text-gray-600 cursor-pointer select-none leading-relaxed"
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
        mt-[1px] shrink-0
        w-4 h-4 rounded-[5px] bg-white
        border border-gray-300
        flex items-center justify-center
        transition-all duration-200
        peer-checked:bg-gray-900 peer-checked:border-gray-900
        peer-checked:[&>svg]:opacity-100
        peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900/20
      "
    >
      <svg
        className="w-2.5 h-2.5 text-white opacity-0 transition-opacity duration-150"
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
    <main className="overflow-hidden w-full h-screen bg-white p-3 sm:p-4 lg:p-4.75">
      <AuthKeyframes />

      <div
        className="h-full w-full flex flex-col lg:flex-row lg:justify-between items-stretch gap-0 lg:gap-8 rounded-3xl lg:rounded-4xl"
        style={{ background: heroBackground }}
      >
        {/* ---------- Hero (desktop only) ---------- */}
        <div
          className="
            hidden lg:flex flex-col items-start justify-between gap-4
            max-w-[500px]
            lg:ml-16 xl:ml-36
            lg:my-16 xl:my-22.5
            lg:mr-8
            lg:h-[calc(100%-8rem)] xl:h-[calc(100%-11.25rem)]
          "
        >
          <div style={fadeUp(100)}>
            <Logo variant="light" />
          </div>

          <div className="flex flex-col gap-1.25">
            <h1
              style={fadeUp(200)}
              className="font-medium text-[42px] xl:text-[48px] text-white leading-tight"
            >
              {heroTitle}
            </h1>
            <p
              style={fadeUp(300)}
              className="text-[16px] xl:text-[18px] text-white/90"
            >
              {heroSubtitle}
            </p>
          </div>

          <p style={fadeUp(400)} className="text-[10px] text-white/70">
            &copy; {APP_NAME} {date}. All rights reserved.
          </p>
        </div>

        {/* ---------- Card ---------- */}
        <div
          style={fadeUp(150)}
          className="
            bg-white flex flex-col
            w-full max-w-[540px] mx-auto
            lg:mx-0 lg:mr-5.5 lg:my-5.5 lg:max-w-[500px]
            flex-1 lg:flex-none
            rounded-3xl lg:rounded-4xl
            px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:pt-6 lg:pb-8
            shadow-lg shadow-black/5
            overflow-y-auto overscroll-contain
            [&::-webkit-scrollbar]:hidden
            [-ms-overflow-style:none]
            [scrollbar-width:none]
          "
        >
          {/* Top bar — mobile logo (left) + language (right) */}
          <div className="flex items-center shrink-0">
            <div className="lg:hidden">
              <Logo variant="dark" />
            </div>
            <div className="ml-auto">
              <LanguageSelect />
            </div>
          </div>

          {children}

          {/* ---------- Bottom block ---------- */}
          <div className="flex flex-col gap-3 sm:gap-4 mt-auto pt-6 lg:pt-8 w-full">
            {promoImage !== undefined && (
              <div
                className="
                  group flex flex-col justify-between w-full
                  h-36 sm:h-40 lg:h-42.5
                  rounded-[20px] p-5 sm:p-6 overflow-hidden
                  transition-all duration-300 ease-out
                  hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20
                "
                style={{ background: promoBackground }}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-[15px] sm:text-[16px] font-bold text-white">
                    New to {APP_NAME}?
                  </p>
                  <p className="text-[12px] sm:text-[13px] text-white/80">
                    See plans for solo architects and growing studios.
                  </p>
                </div>

                <div>
                  <Link
                    href="/pricing"
                    className="
                      inline-flex items-center gap-1.5
                      px-4 h-9
                      rounded-full
                      border border-white/60
                      bg-white/0 hover:bg-white/15
                      backdrop-blur-sm
                      text-[13px] font-medium text-white
                      transition-all duration-200 ease-out
                      hover:border-white hover:shadow-md hover:shadow-black/20
                      active:scale-[0.97]
                    "
                  >
                    See pricing
                    <ChevronRight className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            )}

            <div className="flex justify-center sm:justify-end gap-6 sm:gap-10 text-xs text-gray-400">
              <Link
                href="/legal/terms"
                className="hover:text-gray-600 hover:underline underline-offset-2 transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                href="/legal/privacy"
                className="hover:text-gray-600 hover:underline underline-offset-2 transition-colors duration-200"
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
