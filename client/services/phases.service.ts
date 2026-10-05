import { api } from "@/lib/api/client";

export type ProjectPhase = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  order: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPhaseInput = {
  name: string;
  description?: string;
  order?: number;
  isDefault?: boolean;
  isArchived?: boolean;
};

/**
 * Mirrors the server's `UpdateProjectPhaseDto`.
 *
 * `null` clears an optional field: the DTO's `@IsOptional()` accepts it and the
 * service spreads the DTO into the update. Omitting a key means "leave alone",
 * so a field the user emptied must be sent as `null` rather than dropped.
 */
export type UpdateProjectPhaseInput = {
  [K in keyof CreateProjectPhaseInput]?: CreateProjectPhaseInput[K] | null;
};

/**
 * Phases are tenant-wide templates ("Concept Design", "Documentation"), not
 * per-project rows — there is no projectId on the type. Projects reference one
 * via tasks and deliverables.
 */
export const phasesService = {
  async list(): Promise<ProjectPhase[]> {
    const { data } = await api.get<ProjectPhase[]>("/project-phases");

    return data;
  },

  async getOne(id: string): Promise<ProjectPhase> {
    const { data } = await api.get<ProjectPhase>(`/project-phases/${id}`);

    return data;
  },

  async create(payload: CreateProjectPhaseInput): Promise<ProjectPhase> {
    const { data } = await api.post<ProjectPhase>(
      "/project-phases",
      payload,
    );

    return data;
  },

  async update(
    id: string,
    payload: UpdateProjectPhaseInput,
  ): Promise<ProjectPhase> {
    const { data } = await api.patch<ProjectPhase>(
      `/project-phases/${id}`,
      payload,
    );

    return data;
  },

  /**
   * `DELETE /project-phases/:id` does not delete; it sets `isArchived = true`,
   * which drops the phase out of the list endpoint. So the action is an archive,
   * and it is presented as one.
   */
  async archive(id: string): Promise<void> {
    await api.delete(`/project-phases/${id}`);
  },
};