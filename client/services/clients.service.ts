import { api } from "@/lib/api/client";

export type ClientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type Client = {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  status: ClientStatus;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateClientInput = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  website?: string;
  notes?: string;
  status?: ClientStatus;
};

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const response = await api.get<Client[]>("/clients");
    return response.data;
  },

  async getOne(id: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  async create(input: CreateClientInput): Promise<Client> {
    const response = await api.post<Client>("/clients", input);
    return response.data;
  },

  async update(id: string, input: Partial<CreateClientInput>): Promise<Client> {
    const response = await api.patch<Client>(`/clients/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<Client> {
    const response = await api.delete<Client>(`/clients/${id}`);
    return response.data;
  },
};
