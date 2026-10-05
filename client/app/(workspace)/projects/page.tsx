"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import DateInput from "@/components/ui/date-input";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  PROJECT_STATUSES,
  projectsService,
  type CreateProjectInput,
  type Project,
  type ProjectStatus,
} from "@/services/projects.service";
import { clientsService, type Client } from "@/services/clients.service";

const STATUS_TONE = {
  PLANNING: "neutral",
  ACTIVE: "info",
  ON_HOLD: "warning",
  COMPLETED: "positive",
  CANCELLED: "danger",
} as const satisfies Record<ProjectStatus, "neutral" | "info" | "warning" | "positive" | "danger">;

const humanise = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const PROJECT_STATUS_OPTIONS = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: humanise(status),
}));

const emptyForm = {
  name: "",
  description: "",
  clientId: "",
  status: "PLANNING" as ProjectStatus,
  startDate: "",
  endDate: "",
  budget: "",
};

type FormState = typeof emptyForm;

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // A project can reference a client, so the picker needs the client list.
    // Its failure must not stop the project list from rendering.
    Promise.all([projectsService.list(), clientsService.getAll().catch(() => [])])
      .then(([projectData, clientData]) => {
        if (cancelled) {
          return;
        }

        setProjects(projectData);
        setClients(clientData);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const clientName = (clientId?: string | null) =>
    clients.find((client) => client.id === clientId)?.name ?? null;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setForm({
      name: project.name,
      description: project.description ?? "",
      clientId: project.clientId ?? "",
      status: project.status,
      startDate: project.startDate?.slice(0, 10) ?? "",
      endDate: project.endDate?.slice(0, 10) ?? "",
      budget: project.budget ?? "",
    });
    setFormError(null);
    setOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    const payload: CreateProjectInput = {
      name: form.name.trim(),
      status: form.status,
    };

    if (form.description.trim()) {
      payload.description = form.description.trim();
    }

    if (form.clientId) {
      payload.clientId = form.clientId;
    }

    if (form.startDate) {
      payload.startDate = new Date(form.startDate).toISOString();
    }

    if (form.endDate) {
      payload.endDate = new Date(form.endDate).toISOString();
    }

    if (form.budget.trim()) {
      payload.budget = form.budget.trim();
    }

    try {
      setSubmitting(true);

      if (editing) {
        const updated = await projectsService.update(editing.id, payload);

        setProjects((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        const created = await projectsService.create(payload);

        setProjects((prev) => [created, ...prev]);
      }

      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (project: Project, status: ProjectStatus) => {
    const previous = project;

    setActionError(null);
    setProjects((prev) =>
      prev.map((item) => (item.id === project.id ? { ...item, status } : item)),
    );

    try {
      setBusyId(project.id);

      const updated = await projectsService.update(project.id, { status });

      setProjects((prev) =>
        prev.map((item) => (item.id === project.id ? updated : item)),
      );
    } catch (error) {
      setProjects((prev) =>
        prev.map((item) => (item.id === project.id ? previous : item)),
      );
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
      <header className="motion-enter flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-light text-ink">
            Projects
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
            Commissions currently in flight.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          New Project
        </Button>
      </header>

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
        >
          {actionError}
        </p>
      )}

      <Card className="mt-6 motion-enter">
        <CardHeader
          title="All Projects"
          description={`${projects.length} projects`}
        />
        <CardBody>
          {loading ? (
            <div className="py-8 text-center text-[14px] text-ink-subtle">
              Loading...
            </div>
          ) : loadError && projects.length === 0 ? (
            <EmptyState
              title="Could not load projects"
              description={loadError}
              tone="error"
              size="sm"
            />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={<FolderPlus className="size-4" aria-hidden="true" />}
              title="No projects yet"
              description="Create your first project to get started."
              action={
                <Button onClick={openCreate} size="sm">
                  <Plus className="size-4" aria-hidden="true" />
                  New Project
                </Button>
              }
              size="sm"
            />
          ) : (
            <ul className="space-y-2">
              {projects.map((project) => {
                const isBusy = busyId === project.id;
                const client = clientName(project.clientId);

                return (
                  <li
                    key={project.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line p-3"
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(project)}
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-medium text-ink">
                          {project.name}
                        </span>
                        <Badge tone={STATUS_TONE[project.status]} dot>
                          {humanise(project.status)}
                        </Badge>
                      </span>

                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle">
                        {client && <span>{client}</span>}
                        {project.description && (
                          <span className="line-clamp-1">
                            {project.description}
                          </span>
                        )}
                      </span>
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      <Select
                        aria-label={`Status for ${project.name}`}
                        options={PROJECT_STATUS_OPTIONS}
                        value={project.status}
                        size="sm"
                        fullWidth={false}
                        disabled={isBusy}
                        onChange={(value) =>
                          updateStatus(project, value as ProjectStatus)
                        }
                        className="w-[148px]"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label={editing ? "Edit Project" : "New Project"}
        title={editing ? `Edit ${editing.name}` : "New Project"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="project-name"
            >
              Name
            </label>
            <Input
              id="project-name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="project-description"
            >
              Description
            </label>
            <Input
              id="project-description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="project-client"
              label="Client"
              placeholder="None"
              options={clients.map((client) => ({
                value: client.id,
                label: client.name,
              }))}
              value={form.clientId}
              onChange={(value) => setForm({ ...form, clientId: value })}
            />

            <Select
              id="project-status"
              label="Status"
              options={PROJECT_STATUS_OPTIONS}
              value={form.status}
              onChange={(value) =>
                setForm({ ...form, status: value as ProjectStatus })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DateInput
              id="project-start"
              label="Start date"
              value={form.startDate}
              onChange={(value) => setForm({ ...form, startDate: value })}
            />

            <DateInput
              id="project-end"
              label="End date"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={(value) => setForm({ ...form, endDate: value })}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="project-budget"
            >
              Budget
            </label>
            <Input
              id="project-budget"
              value={form.budget}
              onChange={(event) =>
                setForm({ ...form, budget: event.target.value })
              }
              placeholder="e.g. 250000"
            />
          </div>

          {formError && (
            <p role="alert" className="text-[13px] text-danger">
              {formError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting || !form.name.trim()}
            >
              {editing ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;