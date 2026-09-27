"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { buildAuthHref } from "@/lib/auth/redirect";

interface EngageCtaProps {
  /** Path the visitor was trying to reach, returned to after auth. */
  next?: string;
  label?: string;
  /** Controls styling context (default vs floating navbar) */
  variant?: "default" | "floating";
}

/**
 * The conversion point of the auth wall: logged-out visitors are sent to
 * sign-up (or login) with the current location in `next`, authenticated
 * visitors are sent straight into the app.
 */
export function EngageCta({
  next,
  label = "Start free",
  variant = "default",
}: EngageCtaProps) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  const target = next ?? pathname;

  const ctaClasses = [
    // Structure — identical in both variants so nothing snaps.
    "inline-flex h-10 items-center justify-center rounded-full px-5",
    "text-[13px] font-medium text-white",
    // Border is always present; only its color differs between variants.
    // border-style cannot interpolate, so it must never change.
    "border",
    "transition-[background-color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",

    // Colors only
    variant === "floating"
      ? "bg-[#191919]/95 border-white/10 shadow-xl shadow-black/20 hover:bg-[#191919]/90 hover:scale-[1.02]"
      : "bg-[#191919] border-transparent shadow-xl shadow-black/0 hover:bg-[#191919]/90",
  ].join(" ");

  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className={ctaClasses}>
        Open dashboard
      </Link>
    );
  }

  return (
    <Link href={buildAuthHref("/sign-up", target)} className={ctaClasses}>
      {label}
    </Link>
  );
}

export default EngageCta;
