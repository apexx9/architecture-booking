import { api } from "@/lib/api/client";

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type Project = {
  id: string;
  tenantId: string;
  clientId?: string | null;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  budget?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  clientId?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budget?: string;
  isArchived?: boolean;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

/** Statuses the UI offers, in the order a project moves through them. */
export const PROJECT_STATUSES: ProjectStatus[] = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];

export const projectsService = {
  async list(): Promise<Project[]> {
    const { data } = await api.get<Project[]>("/projects");

    return data;
  },

  async get(id: string): Promise<Project> {
    const { data } = await api.get<Project>(`/projects/${id}`);

    return data;
  },

  async create(payload: CreateProjectInput): Promise<Project> {
    const { data } = await api.post<Project>("/projects", payload);

    return data;
  },

  async update(id: string, payload: UpdateProjectInput): Promise<Project> {
    const { data } = await api.patch<Project>(`/projects/${id}`, payload);

    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};