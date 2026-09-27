"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { buildAuthHref } from "@/lib/auth/redirect";

interface AuthWallProps {
  children: ReactNode;

  /** Rendered instead of the gated content while logged out. */
  fallback?: ReactNode;

  title?: string;
  description?: string;
}

/**
 * Inline auth wall for content that lives on a public page but must not be
 * readable or actionable without an account. Logged-out visitors see a teaser
 * plus a sign-up prompt; once authenticated the real content renders.
 *
 * The session is bootstrapped client-side, so on the first paint the status is
 * still "loading". This deliberately treats that as logged *out* and renders the
 * teaser, rather than rendering nothing: the wall is a presentation device, not
 * a security boundary, and the vast majority of visitors are anonymous. The real
 * gate is `ProtectedRoute`, which hard-blocks until `/auth/me` resolves.
 *
 * TODO(aaron): teaser design.
 */
export function AuthWall({
  children,
  fallback,
  title = "Create a free account to continue",
  description = "Sign up to see the full picture, then come straight back to this page.",
}: AuthWallProps) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (isAuthenticated) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-black/5 bg-gray-50 px-6 py-14 text-center">
      <h2 className="text-[22px] font-medium text-black">{title}</h2>

      <p className="max-w-sm text-[14px] text-black/60">{description}</p>

      <Link href={buildAuthHref("/sign-up", pathname)}>
        <span className="inline-flex h-11 items-center rounded-full bg-[#191919] px-6 text-[13px] font-medium text-white transition-colors duration-200 hover:bg-[#191919]/90">
          Sign up to continue
        </span>
      </Link>

      <p className="text-[13px] text-black/50">
        Already have an account?{" "}
        <Link
          href={buildAuthHref("/login", pathname)}
          className="underline underline-offset-2 transition-colors duration-200 hover:text-black"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export default AuthWall;
