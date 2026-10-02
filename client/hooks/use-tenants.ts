"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { tenancyApi, type TenantSummary } from "@/actions/tenancy";
import useAuthStore from "@/store/use-auth-store";

interface TenantsState {
  tenants: TenantSummary[];
  activeTenantId: string | null;

  isLoading: boolean;
  error: string | null;

  switchTenant: (tenantId: string) => Promise<void>;
  isSwitching: boolean;
  switchError: string | null;
}

/**
 * Practice (tenant) list for the workspace switcher.
 *
 * Login seeds the store with the list the API already returned, so this hook
 * only fetches when the store is empty — which is the case for a session
 * restored by `GET /auth/me`, since that endpoint returns no tenant data.
 *
 * Switching is a server round-trip: the API changes the active tenant, and every
 * scoped query afterwards depends on it. The caller reloads so the workspace
 * re-renders against the new context rather than trusting a client-side swap.
 */
export function useTenants(): TenantsState {
  const storedTenants = useAuthStore((state) => state.tenants);
  const storedActiveId = useAuthStore((state) => state.activeTenantId);
  const setTenants = useAuthStore((state) => state.setTenants);
  const setActiveTenant = useAuthStore((state) => state.setActiveTenant);

  const [isLoading, setIsLoading] = useState(storedTenants.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    // Already seeded (login carried the list) — nothing to fetch.
    if (storedTenants.length > 0) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const tenants = await tenancyApi.listTenants();

        if (!cancelled) {
          setTenants(tenants);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(getApiErrorMessage(caught));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [storedTenants.length, setTenants]);

  const switchTenant = useCallback(
    async (tenantId: string) => {
      if (tenantId === storedActiveId) {
        return;
      }

      setIsSwitching(true);
      setSwitchError(null);

      try {
        await tenancyApi.switchTenant(tenantId);

        setActiveTenant(tenantId);
      } catch (caught) {
        setSwitchError(getApiErrorMessage(caught));

        throw caught;
      } finally {
        setIsSwitching(false);
      }
    },
    [storedActiveId, setActiveTenant],
  );

  return {
    tenants: storedTenants,
    activeTenantId: storedActiveId,
    isLoading,
    error,
    switchTenant,
    isSwitching,
    switchError,
  };
}
