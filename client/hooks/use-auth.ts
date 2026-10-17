"use client";

import useAuthStore from "@/store/use-auth-store";

import { authService } from "@/services/auth.service";

export function useAuth() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const sessionNotice = useAuthStore((state) => state.sessionNotice);

  return {
    status,
    user,
    sessionNotice,

    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",

    login: authService.login,
    register: authService.register,
    logout: authService.logout,
    logoutAll: authService.logoutAll,
    forgotPassword: authService.forgotPassword,
    resetPassword: authService.resetPassword,
  };
}
