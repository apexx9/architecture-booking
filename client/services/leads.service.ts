import { api } from "@/lib/api/client";
import type { Client } from "@/services/clients.service";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "WON"
  | "LOST";

export type Lead = {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  projectType: string | null;
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
  source?: string;
  projectType?: string;
  estimatedBudget?: string;
  location?: string;
  notes?: string;
  status?: LeadStatus;
};

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

  async update(id: string, input: Partial<CreateLeadInput>): Promise<Lead> {
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
