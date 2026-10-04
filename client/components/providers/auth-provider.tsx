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
      console.log("[AuthProvider] bootstrap skipped — already initialized");
      return;
    }

    initialized.current = true;

    async function bootstrap() {
      console.log("[AuthProvider] bootstrap: START");

      setLoading();

      try {
        const user = await authService.getCurrentUser();

        console.log("[AuthProvider] bootstrap: SUCCESS", user);

        console.log(
          "[AuthProvider] store after success:",
          useAuthStore.getState(),
        );
      } catch (error) {
        console.error("[AuthProvider] bootstrap: FAILED", error);

        setUnauthenticated();

        console.log(
          "[AuthProvider] store after failure:",
          useAuthStore.getState(),
        );
      }
    }

    void bootstrap();
  }, [setLoading, setUnauthenticated]);

  return children;
}
