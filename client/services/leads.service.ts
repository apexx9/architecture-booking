import { api } from "@/lib/api/client";
import type { Client } from "@/services/clients.service";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "WON"
  | "LOST";

/** Mirrors the server's `lead_source` pgEnum. */
export type LeadSource =
  | "WEBSITE"
  | "REFERRAL"
  | "DIRECT"
  | "SOCIAL"
  | "ADVERTISING"
  | "EVENT"
  | "OTHER";

/** Mirrors the server's `project_type` pgEnum. */
export type ProjectType =
  | "RESIDENTIAL"
  | "COMMERCIAL"
  | "INTERIOR"
  | "LANDSCAPE"
  | "RENOVATION"
  | "OTHER";

export type Lead = {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: LeadSource | null;
  projectType: ProjectType | null;
  estimatedBudget: string | null;
  location: string | null;
  status: LeadStatus;
  notes: string | null;
  isArchived: boolean;
  convertedToClientId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConvertLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
};

export type ConvertLeadResult = {
  client: Client;
  lead: Lead;
};

export type CreateLeadInput = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: LeadSource;
  projectType?: ProjectType;
  estimatedBudget?: string;
  location?: string;
  notes?: string;
  status?: LeadStatus;
};

/**
 * Mirrors the server's `UpdateLeadDto`, with every field optional.
 *
 * `null` is accepted deliberately: the DTO validates with `@IsOptional()`, which
 * skips `null`, and the columns are nullable. It is how a field is cleared — the
 * server writes only the keys it receives, so omitting one leaves the stored
 * value untouched.
 *
 * Note there is no `convertedToClientId` and no `isArchived`: promotion to a
 * client is the dedicated convert endpoint's job, and the update DTO does not
 * accept either field.
 */
export type UpdateLeadInput = {
  [K in keyof CreateLeadInput]?: CreateLeadInput[K] | null;
};

/** Mirrors the server's `lead_source` pgEnum, in the order the UI offers them. */
export const LEAD_SOURCES: LeadSource[] = [
  "WEBSITE",
  "REFERRAL",
  "DIRECT",
  "SOCIAL",
  "ADVERTISING",
  "EVENT",
  "OTHER",
];

/** Mirrors the server's `project_type` pgEnum, in the order the UI offers them. */
export const PROJECT_TYPES: ProjectType[] = [
  "RESIDENTIAL",
  "COMMERCIAL",
  "INTERIOR",
  "LANDSCAPE",
  "RENOVATION",
  "OTHER",
];

/** Statuses the UI offers, in the order a lead moves through them. */
export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "WON",
  "LOST",
];

export const leadsService = {
  async getAll(): Promise<Lead[]> {
    const response = await api.get<Lead[]>("/leads");
    return response.data;
  },

  async getOne(id: string): Promise<Lead> {
    const response = await api.get<Lead>(`/leads/${id}`);
    return response.data;
  },

  async create(input: CreateLeadInput): Promise<Lead> {
    const response = await api.post<Lead>("/leads", input);
    return response.data;
  },

  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    const response = await api.patch<Lead>(`/leads/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<Lead> {
    const response = await api.delete<Lead>(`/leads/${id}`);
    return response.data;
  },

  /**
   * Promotes a lead to a client. The server creates the client record, stamps
   * `convertedToClientId` on the lead and moves it to WON in one transaction,
   * so it returns both sides and the caller can refresh from the lead.
   */
  async convertToClient(
    id: string,
    input: ConvertLeadInput = {},
  ): Promise<ConvertLeadResult> {
    const response = await api.post<ConvertLeadResult>(
      `/leads/${id}/convert`,
      input,
    );

    return response.data;
  },
};
