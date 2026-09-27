"use client";

import { type ReactNode, useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { currentLocationPath } from "@/lib/auth/redirect";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Real session gate for signed-in routes. Verifies against GET /auth/me via
 * AuthProvider's bootstrap, and sends anonymous visitors to the auth wall
 * carrying where they were headed.
 */
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

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
