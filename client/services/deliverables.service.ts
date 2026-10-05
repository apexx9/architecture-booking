import { api } from "@/lib/api/client";

/**
 * Deliverable statuses.
 *
 * Transcribed from the server's `deliverable_status` pgEnum, which is the
 * contract — see `server/src/db/schema/deliverables.schema.ts`. Note this is
 * wider than `DELIVERABLE_STATUSES` in `lib/domain/status.ts`: the enum also
 * carries CLIENT_REVIEW, APPROVED, REJECTED and FINALIZED, which the copy in
 * `app-details.md` §12.1 predates.
 */
export type DeliverableStatus =
  | "IN_PROGRESS"
  | "INTERNAL_REVIEW"
  | "SENT_TO_CLIENT"
  | "CLIENT_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUESTED"
  | "FINALIZED"
  | "ARCHIVED";

export type Deliverable = {
  id: string;
  tenantId: string;
  projectId: string;
  phaseId?: string | null;
  taskId?: string | null;
  name: string;
  description?: string | null;
  status: DeliverableStatus;
  version: number;
  dueDate?: string | null;
  completedAt?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateDeliverableInput = {
  projectId: string;
  phaseId?: string;
  taskId?: string;
  name: string;
  description?: string;
  status?: DeliverableStatus;
  version?: number;
  dueDate?: string;
  isArchived?: boolean;
};

/**
 * Mirrors the server's `UpdateDeliverableDto`, minus `projectId`, which is
 * required and is not reassignable from the deliverable UI.
 *
 * `null` clears an optional field: the DTO's `@IsOptional()` accepts it and the
 * service spreads the DTO into the update. Omitting a key means "leave alone",
 * so a field the user emptied must be sent as `null` rather than dropped.
 */
export type UpdateDeliverableInput = {
  [K in keyof Omit<CreateDeliverableInput, "projectId">]?: Omit<
    CreateDeliverableInput,
    "projectId"
  >[K] | null;
};

export const DELIVERABLE_STATUS_ORDER: DeliverableStatus[] = [
  "IN_PROGRESS",
  "INTERNAL_REVIEW",
  "SENT_TO_CLIENT",
  "CLIENT_REVIEW",
  "APPROVED",
  "REJECTED",
  "REVISION_REQUESTED",
  "FINALIZED",
  "ARCHIVED",
];

export const deliverablesService = {
  async list(): Promise<Deliverable[]> {
    const { data } = await api.get<Deliverable[]>("/deliverables");

    return data;
  },

  async getOne(id: string): Promise<Deliverable> {
    const { data } = await api.get<Deliverable>(`/deliverables/${id}`);

    return data;
  },

  async create(payload: CreateDeliverableInput): Promise<Deliverable> {
    const { data } = await api.post<Deliverable>("/deliverables", payload);

    return data;
  },

  async update(
    id: string,
    payload: UpdateDeliverableInput,
  ): Promise<Deliverable> {
    const { data } = await api.patch<Deliverable>(
      `/deliverables/${id}`,
      payload,
    );

    return data;
  },

  /**
   * `DELETE /deliverables/:id` does not delete; it sets `isArchived = true`,
   * which drops the deliverable out of the list endpoints. So the action is an
   * archive, and it is presented as one. Attached files are untouched.
   */
  async archive(id: string): Promise<void> {
    await api.delete(`/deliverables/${id}`);
  },
};