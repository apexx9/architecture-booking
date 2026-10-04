"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { authService } from "@/services/auth.service";
import useAuthStore from "@/store/use-auth-store";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialized = useRef(false);

  const setLoading = useAuthStore((state) => state.setLoading);

  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    async function bootstrap() {
      setLoading();

      try {
        await authService.getCurrentUser();
      } catch {
        setUnauthenticated();
      }
    }

    void bootstrap();
  }, [setLoading, setUnauthenticated]);

  return children;
}
