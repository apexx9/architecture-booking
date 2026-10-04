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

  console.log("[ProtectedRoute]", {
    isLoading,
    isAuthenticated,
  });

  useEffect(() => {
    console.log("[ProtectedRoute] effect", {
      isLoading,
      isAuthenticated,
    });

    if (!isLoading && !isAuthenticated) {
      const { pathname, search } = window.location;

      const next = currentLocationPath(pathname, search);

      console.log("[ProtectedRoute] redirecting to login", {
        pathname,
        search,
        next,
      });

      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    console.log("[ProtectedRoute] rendering AuthPending because loading");

    return <AuthPending />;
  }

  if (!isAuthenticated) {
    console.log(
      "[ProtectedRoute] rendering AuthPending because unauthenticated",
    );

    return <AuthPending />;
  }

  console.log("[ProtectedRoute] rendering protected children");

  return children;
}
