import { api } from "@/lib/api/client";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "BLOCKED"
  | "DONE"
  | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Task = {
  id: string;
  tenantId: string;
  projectId: string;
  phaseId?: string | null;
  assigneeId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  projectId: string;
  phaseId?: string;
  assigneeId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  isArchived?: boolean;
};

/**
 * Mirrors the server's `UpdateTaskDto`, minus `projectId` which is required and
 * not reassignable from the task UI.
 *
 * `null` clears an optional field: the DTO's `@IsOptional()` accepts it and the
 * service spreads the DTO into the update. Omitting a key means "leave alone",
 * so a field the user emptied must be sent as `null` rather than dropped.
 *
 * The server sets `completedAt` itself when `status` becomes `DONE`, so the UI
 * never sends it.
 */
export type UpdateTaskInput = {
  [K in keyof Omit<CreateTaskInput, "projectId">]?: Omit<
    CreateTaskInput,
    "projectId"
  >[K] | null;
};

/** Statuses the UI offers, in the order a task moves through them. */
export const TASK_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "BLOCKED",
  "DONE",
  "CANCELLED",
];

export const TASK_PRIORITIES: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export const tasksService = {
  async list(): Promise<Task[]> {
    const { data } = await api.get<Task[]>("/tasks");

    return data;
  },

  async byProject(projectId: string): Promise<Task[]> {
    const { data } = await api.get<Task[]>(`/tasks/project/${projectId}`);

    return data;
  },

  async getOne(id: string): Promise<Task> {
    const { data } = await api.get<Task>(`/tasks/${id}`);

    return data;
  },

  async create(payload: CreateTaskInput): Promise<Task> {
    const { data } = await api.post<Task>("/tasks", payload);

    return data;
  },

  async update(id: string, payload: UpdateTaskInput): Promise<Task> {
    const { data } = await api.patch<Task>(`/tasks/${id}`, payload);

    return data;
  },

  /**
   * `DELETE /tasks/:id` does not delete; it sets `isArchived = true`, which drops
   * the task out of the list endpoints. So the action is an archive, and it is
   * presented as one.
   */
  async archive(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};