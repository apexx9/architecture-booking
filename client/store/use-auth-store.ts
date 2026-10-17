import { create } from "zustand";
import type { AuthUser, TenantSummary } from "@/actions/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Why the app dropped a session it previously held, so the sign-in screen can
 * explain the interruption instead of looking like a stray redirect. Set only by
 * a session that was lost while in use — never by a user who simply never signed
 * in — and cleared by a successful sign-in.
 */
export type SessionNotice = "session-expired";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  tenants: TenantSummary[];
  activeTenantId: string | null;
  sessionNotice: SessionNotice | null;

  setLoading: () => void;
  setAuthenticated: (user: AuthUser) => void;
  setUnauthenticated: () => void;
  /** Drops the session, optionally recording why so sign-in can mention it. */
  clearAuth: (notice?: SessionNotice) => void;
  clearSessionNotice: () => void;

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
  sessionNotice: null,

  setLoading: () => {
    set({
      status: "loading",
    });
  },

  setAuthenticated: (user) => {
    set({
      status: "authenticated",
      user,
      sessionNotice: null,
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

  clearAuth: (notice) => {
    set({
      status: "unauthenticated",
      user: null,
      tenants: EMPTY_TENANTS,
      activeTenantId: null,
      sessionNotice: notice ?? null,
    });
  },

  clearSessionNotice: () => {
    set({
      sessionNotice: null,
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
