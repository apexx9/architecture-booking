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
  console.log("🔥 [ProtectedRoute] COMPONENT EXECUTED");

  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  console.log("🔥 [ProtectedRoute] AUTH STATE", {
    isLoading,
    isAuthenticated,
  });

  useEffect(() => {
    console.log("🔥 [ProtectedRoute] EFFECT", {
      isLoading,
      isAuthenticated,
    });

    if (!isLoading && !isAuthenticated) {
      const { pathname, search } = window.location;
      const next = currentLocationPath(pathname, search);

      console.log("🔥 [ProtectedRoute] REDIRECT", {
        next,
      });

      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    console.log("🔥 [ProtectedRoute] → LOADING");

    return <AuthPending />;
  }

  if (!isAuthenticated) {
    console.log("🔥 [ProtectedRoute] → UNAUTHENTICATED");

    return <AuthPending />;
  }

  console.log("🔥 [ProtectedRoute] → AUTHENTICATED / CHILDREN");

  return children;
}
