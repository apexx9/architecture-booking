"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { sanitizeNextPath } from "@/lib/auth/redirect";

interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  const redirecting = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || redirecting.current) {
      return;
    }

    redirecting.current = true;

    const next = new URLSearchParams(window.location.search).get("next");
    const destination = sanitizeNextPath(next);

    router.replace(destination);
  }, [isLoading, isAuthenticated, router]);

  /*
   * A confirmed session means the redirect above is already under way, so the
   * form is blanked to avoid flashing sign-in at someone who is on their way
   * back to the workspace.
   */
  if (isAuthenticated) {
    return <div className="min-h-dvh bg-background" aria-hidden="true" />;
  }

  /*
   * These routes are public, so they render while the session check is still
   * running. Holding every visitor — including the vast majority who are simply
   * not signed in — on a full-screen session check before they can even see the
   * form is the worse trade, and the check that follows is what decides whether
   * a redirect is needed at all.
   */
  return children;
}