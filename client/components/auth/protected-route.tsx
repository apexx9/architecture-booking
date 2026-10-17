"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { currentLocationPath } from "@/lib/auth/redirect";
import AuthPending from "@/components/auth/auth-pending";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const { pathname, search } = window.location;
      const next = currentLocationPath(pathname, search);

      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isLoading, isAuthenticated, router]);

  /*
   * The session is still being established, so the answer is genuinely unknown
   * and a quiet screen is honest about that.
   */
  if (isLoading) {
    return <AuthPending />;
  }

  /*
   * The answer is known and it is no — the redirect above is already on its way.
   * Showing the pending screen here would announce a session check that has
   * already finished, which reads as the app being stuck rather than as being
   * sent to sign in.
   *
   * The surface is kept, and the page background is preserved, so the handover
   * does not flash white before the sign-in page arrives.
   */
  if (!isAuthenticated) {
    return <div className="min-h-dvh bg-background" aria-hidden="true" />;
  }

  return children;
}