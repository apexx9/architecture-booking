import { create } from "zustand";

import type { AuthUser, TenantSummary } from "@/actions/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;

  /**
   * Practices this user belongs to, as returned by `POST /auth/login`.
   *
   * Kept in the store so the workspace switcher has something to render on
   * first paint instead of issuing a second request for data the login response
   * already carried. Purely additive: it is only populated by a fresh login, so
   * an existing session restored via `GET /auth/me` leaves it empty and the
   * switcher falls back to fetching.
   */
  tenants: TenantSummary[];
  activeTenantId: string | null;

  setLoading: () => void;
  setAuthenticated: (user: AuthUser) => void;
  setUnauthenticated: () => void;
  clearAuth: () => void;

  setTenants: (tenants: TenantSummary[]) => void;
  setActiveTenant: (tenantId: string) => void;
}

const EMPTY_TENANTS: TenantSummary[] = [];

const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  tenants: EMPTY_TENANTS,
  activeTenantId: null,

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
      tenants: EMPTY_TENANTS,
      activeTenantId: null,
    }),

  clearAuth: () =>
    set({
      status: "unauthenticated",
      user: null,
      tenants: EMPTY_TENANTS,
      activeTenantId: null,
    }),

  setTenants: (tenants) =>
    set((state) => ({
      tenants,
      /*
       * Adopt the server's default when we have no opinion yet, and keep the
       * current selection when we do — re-fetching the list must not silently
       * move the user to a different practice.
       */
      activeTenantId:
        state.activeTenantId &&
        tenants.some((tenant) => tenant.id === state.activeTenantId)
          ? state.activeTenantId
          : (tenants.find((tenant) => tenant.isDefault) ?? tenants[0])?.id ??
            null,
    })),

  setActiveTenant: (tenantId) => set({ activeTenantId: tenantId }),
}));

export default useAuthStore;
