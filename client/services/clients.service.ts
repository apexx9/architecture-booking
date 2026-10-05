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

/**
 * Mirrors the server's `UpdateClientDto`.
 *
 * `null` is accepted deliberately: the DTO validates with `@IsOptional()`, which
 * skips `null`, and every optional column is nullable. It is how a field is
 * cleared — `PATCH /clients/:id` writes only the keys it receives, so omitting
 * one leaves the stored value in place while the UI would otherwise report the
 * clear as having succeeded.
 *
 * There is deliberately no `isArchived` here: the column exists and the list
 * endpoint filters on it, but the update DTO does not accept it, so archiving is
 * not something the API can currently do. Adding it to `UpdateClientDto` is the
 * server-side prerequisite for an archive action.
 */
export type UpdateClientInput = {
  [K in keyof CreateClientInput]?: CreateClientInput[K] | null;
};

/** Statuses the UI offers, in the order a client moves through them. */
export const CLIENT_STATUSES: ClientStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];

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

  async update(id: string, input: UpdateClientInput): Promise<Client> {
    const response = await api.patch<Client>(`/clients/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<Client> {
    const response = await api.delete<Client>(`/clients/${id}`);
    return response.data;
  },
};
