import { create } from "zustand";
import type { AuthUser, TenantSummary } from "@/actions/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  tenants: TenantSummary[];
  activeTenantId: string | null;

  setLoading: () => void;
  setAuthenticated: (user: AuthUser) => void;
  setUnauthenticated: () => void;
  clearAuth: () => void;

  /** Replaces the whole list. Also accepts an updater, for adding or removing one. */
  setTenants: (tenants: TenantSummary[] | ((previous: TenantSummary[]) => TenantSummary[])) => void;
  setActiveTenant: (tenantId: string) => void;
}

const EMPTY_TENANTS: TenantSummary[] = [];

const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  tenants: EMPTY_TENANTS,
  activeTenantId: null,

  setLoading: () => {
    set({
      status: "loading",
    });
  },

  setAuthenticated: (user) => {
    set({
      status: "authenticated",
      user,
    });
  },

  setUnauthenticated: () => {
    set({
      status: "unauthenticated",
      user: null,
      tenants: EMPTY_TENANTS,
      activeTenantId: null,
    });
  },

  clearAuth: () => {
    set({
      status: "unauthenticated",
      user: null,
      tenants: EMPTY_TENANTS,
      activeTenantId: null,
    });
  },

setTenants: (tenants) => {
      set((state) => {
        const next =
          typeof tenants === "function" ? tenants(state.tenants) : tenants;

        return {
          tenants: next,
          // Keeps the active practice only if it still exists in the new list,
          // so removing a membership cannot leave the workspace pointing at a
          // tenant the API will now reject every query for.
          activeTenantId:
            state.activeTenantId &&
            next.some((tenant) => tenant.id === state.activeTenantId)
              ? state.activeTenantId
              : ((next.find((tenant) => tenant.isDefault) ?? next[0])?.id ??
                null),
        };
      });
    },

  setActiveTenant: (tenantId) => {
    set({
      activeTenantId: tenantId,
    });
  },
}));

export default useAuthStore;
