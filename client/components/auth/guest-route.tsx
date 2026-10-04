"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import AuthPending from "@/components/auth/auth-pending";

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

  if (isLoading) {
    return <AuthPending />;
  }

  if (isAuthenticated) {
    return <AuthPending />;
  }

  return children;
}
