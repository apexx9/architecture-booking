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

export type UpdateProjectPhaseInput = Partial<CreateProjectPhaseInput>;

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

  async remove(id: string): Promise<void> {
    await api.delete(`/project-phases/${id}`);
  },
};