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

  setTenants: (tenants: TenantSummary[]) => void;
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
    set((state) => ({
      tenants,
      activeTenantId:
        state.activeTenantId &&
        tenants.some((tenant) => tenant.id === state.activeTenantId)
          ? state.activeTenantId
          : ((tenants.find((tenant) => tenant.isDefault) ?? tenants[0])?.id ??
            null),
    }));
  },

  setActiveTenant: (tenantId) => {
    set({
      activeTenantId: tenantId,
    });
  },
}));

export default useAuthStore;
