import { create } from "zustand";

import type { AuthUser } from "@/actions/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;

  setLoading: () => void;
  setAuthenticated: (user: AuthUser) => void;
  setUnauthenticated: () => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,

  setLoading: () =>
    set({
      status: "loading",
    }),

  setAuthenticated: (user) =>
    set({
      status: "authenticated",
      user,
    }),

  setUnauthenticated: () =>
    set({
      status: "unauthenticated",
      user: null,
    }),

  clearAuth: () =>
    set({
      status: "unauthenticated",
      user: null,
    }),
}));

export default useAuthStore;
