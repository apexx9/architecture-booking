import { api } from "@/lib/api/client";

import type {
  AddMemberInput,
  CreateTenantInput,
  UpdateMemberRoleInput,
  UpdateTenantInput,
} from "@/schema/tenancy.schema";
import type { TenantRole } from "@/actions/auth";

export type TenantSummary = {
  id: string;
  name: string;
  role: TenantRole;
  isDefault: boolean;
};

export type CurrentTenant = {
  id: string;
  name: string;
  role: TenantRole;
  isDefault: boolean;
};

export type TenantMember = {
  userId: string;
  /**
   * `GET /tenants/current/members` does not return a name today, so every
   * member currently shows as an email. Declared optional so that when the
   * endpoint starts sending one, existing consumers pick it up instead of
   * needing a change — `memberName` below is the single place that decides.
   */
  fullName?: string | null;
  email: string;
  role: TenantRole;
  joinedAt: string;
};

/** The best available human label for a member. */
export const memberName = (member: TenantMember): string =>
  member.fullName?.trim() || member.email;

export type SwitchTenantResponse = {
  tenant: {
    id: string;
    name: string;
  };
  role: TenantRole;
};

export const tenancyApi = {
  async listTenants() {
    const response = await api.get<TenantSummary[]>("/tenants");

    return response.data;
  },

  async createTenant(input: CreateTenantInput) {
    const response = await api.post<TenantSummary>("/tenants", {
      name: input.name,
    });

    return response.data;
  },

  async switchTenant(tenantId: string) {
    const response = await api.post<SwitchTenantResponse>("/tenants/switch", {
      tenantId,
    });

    return response.data;
  },

  async getCurrentTenant() {
    const response = await api.get<CurrentTenant>("/tenants/current");

    return response.data;
  },

  async renameTenant(input: UpdateTenantInput) {
    const response = await api.patch<{ id: string; name: string }>(
      "/tenants/current",
      { name: input.name },
    );

    return response.data;
  },

  async listMembers() {
    const response = await api.get<TenantMember[]>("/tenants/current/members");

    return response.data;
  },

  async addMember(input: AddMemberInput) {
    const response = await api.post<TenantMember>("/tenants/current/members", {
      email: input.email,
      role: input.role,
    });

    return response.data;
  },

  async updateMemberRole(input: UpdateMemberRoleInput) {
    const response = await api.patch<{ userId: string; role: TenantRole }>(
      `/tenants/current/members/${input.userId}`,
      { role: input.role },
    );

    return response.data;
  },

  async removeMember(userId: string) {
    const response = await api.delete<{ message: string }>(
      `/tenants/current/members/${userId}`,
    );

    return response.data;
  },
};