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

  if (isLoading) {
    return <AuthPending />;
  }

  if (!isAuthenticated) {
    return <AuthPending />;
  }

  return children;
}
