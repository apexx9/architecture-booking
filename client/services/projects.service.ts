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

/**
 * Mirrors the server's `UpdateProjectDto`.
 *
 * `null` clears an optional field. The DTO validates with `@IsOptional()`, which
 * accepts `null`, and the service spreads the DTO straight into the update, so a
 * `null` is written. Omitting a key means "leave alone", so a field the user
 * emptied in the UI must be sent as `null` rather than dropped.
 */
export type UpdateProjectInput = {
  [K in keyof CreateProjectInput]?: CreateProjectInput[K] | null;
};

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

  /**
   * `DELETE /projects/:id` does not delete. It sets `isArchived = true`, so the
   * row stays in the database and the project disappears from `GET /projects`,
   * which filters archived projects out.
   *
   * Two consequences the UI is responsible for:
   * - The action must not be labelled "delete"; nothing is destroyed.
   * - The project's tasks, deliverables and phases are untouched, so they stay
   *   visible on their own list pages while their project has vanished from
   *   this one. The confirmation says so rather than implying a cascade.
   */
  async archive(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};