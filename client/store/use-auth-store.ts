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
    console.log("[AuthStore] setLoading");

    set({
      status: "loading",
    });
  },

  setAuthenticated: (user) => {
    console.log("[AuthStore] setAuthenticated", user);

    set({
      status: "authenticated",
      user,
    });

    console.log(
      "[AuthStore] state after setAuthenticated:",
      useAuthStore.getState(),
    );
  },

  setUnauthenticated: () => {
    console.log("[AuthStore] setUnauthenticated");

    set({
      status: "unauthenticated",
      user: null,
      tenants: EMPTY_TENANTS,
      activeTenantId: null,
    });

    console.log(
      "[AuthStore] state after setUnauthenticated:",
      useAuthStore.getState(),
    );
  },

  clearAuth: () => {
    console.log("[AuthStore] clearAuth");

    set({
      status: "unauthenticated",
      user: null,
      tenants: EMPTY_TENANTS,
      activeTenantId: null,
    });

    console.log("[AuthStore] state after clearAuth:", useAuthStore.getState());
  },

  setTenants: (tenants) => {
    console.log("[AuthStore] setTenants", tenants);

    set((state) => ({
      tenants,
      activeTenantId:
        state.activeTenantId &&
        tenants.some((tenant) => tenant.id === state.activeTenantId)
          ? state.activeTenantId
          : ((tenants.find((tenant) => tenant.isDefault) ?? tenants[0])?.id ??
            null),
    }));

    console.log("[AuthStore] state after setTenants:", useAuthStore.getState());
  },

  setActiveTenant: (tenantId) => {
    console.log("[AuthStore] setActiveTenant", tenantId);

    set({
      activeTenantId: tenantId,
    });
  },
}));

export default useAuthStore;
