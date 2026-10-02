"use client";

import { type ReactNode, useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { sanitizeNextPath } from "@/lib/auth/redirect";

import AuthPending from "@/components/auth/auth-pending";

interface GuestRouteProps {
  children: ReactNode;
}

/**
 * Keeps signed-in users out of the auth screens, returning them to the page
 * that sent them there (`?next=`), or the dashboard by default.
 */
export function GuestRoute({ children }: GuestRouteProps) {
  const router = useRouter();

  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const next = new URLSearchParams(window.location.search).get("next");

      router.replace(sanitizeNextPath(next));
    }
  }, [isLoading, isAuthenticated, router]);

  /*
   * Both branches render the same pending state: one is "we don't know yet",
   * the other is "we know, and a redirect is in flight". Rendering `null` in
   * either case produced a blank flash.
   */
  if (isLoading) {
    return <AuthPending />;
  }

  if (isAuthenticated) {
    return <AuthPending />;
  }

  return children;
}
