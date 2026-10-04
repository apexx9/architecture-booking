"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { sanitizeNextPath } from "@/lib/auth/redirect";

import AuthPending from "@/components/auth/auth-pending";

interface GuestRouteProps {
  children: ReactNode;
}

/**
 * Keeps signed-in users out of authentication screens.
 *
 * Authentication is established by the global AuthProvider. Once the provider
 * knows the user is authenticated, this route redirects them to the requested
 * destination or the dashboard.
 */
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

    console.log("[GuestRoute] redirecting authenticated user", {
      next,
      destination,
    });

    router.replace(destination);
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <AuthPending />;
  }

  if (isAuthenticated) {
    return <AuthPending />;
  }

  return children;
}
