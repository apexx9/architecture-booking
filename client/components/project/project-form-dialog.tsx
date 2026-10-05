"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import DateInput from "@/components/ui/date-input";
import Dialog from "@/components/ui/dialog";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/errors";
import { toStatusOptions } from "@/lib/domain/status";
import {
  PROJECT_STATUSES,
  projectsService,
  type CreateProjectInput,
  type Project,
  type ProjectStatus,
  type UpdateProjectInput,
} from "@/services/projects.service";
import type { Client } from "@/services/clients.service";

const PROJECT_STATUS_OPTIONS = toStatusOptions(PROJECT_STATUSES);

const emptyForm = {
  name: "",
  description: "",
  clientId: "",
  status: "PLANNING" as ProjectStatus,
  startDate: "",
  endDate: "",
  budget: "",
};

export type ProjectFormState = typeof emptyForm;

/** Exported so callers can reset their state to a known-empty value. */
export const EMPTY_PROJECT_FORM = emptyForm;

export const projectToForm = (project: Project): ProjectFormState => ({
  name: project.name,
  description: project.description ?? "",
  clientId: project.clientId ?? "",
  status: project.status,
  startDate: project.startDate?.slice(0, 10) ?? "",
  endDate: project.endDate?.slice(0, 10) ?? "",
  budget: project.budget ?? "",
});

const createPayload = (state: ProjectFormState): CreateProjectInput => {
  const payload: CreateProjectInput = {
    name: state.name.trim(),
    status: state.status,
  };

  if (state.description.trim()) payload.description = state.description.trim();
  if (state.clientId) payload.clientId = state.clientId;
  if (state.startDate) payload.startDate = new Date(state.startDate).toISOString();
  if (state.endDate) payload.endDate = new Date(state.endDate).toISOString();
  if (state.budget.trim()) payload.budget = state.budget.trim();

  return payload;
};

/**
 * Empty optional fields become `null` rather than being dropped. `PATCH
 * /projects/:id` spreads the DTO into the update, so an omitted key is left
 * alone and the row would close as edited with the old value still stored.
 */
const editPayload = (state: ProjectFormState): UpdateProjectInput => ({
  name: state.name.trim(),
  status: state.status,
  description: state.description.trim() || null,
  clientId: state.clientId || null,
  startDate: state.startDate ? new Date(state.startDate).toISOString() : null,
  endDate: state.endDate ? new Date(state.endDate).toISOString() : null,
  budget: state.budget.trim() || null,
});

interface ProjectFormDialogProps {
  open: boolean;
  /** When set the dialog edits this project; otherwise it creates a new one. */
  project?: Project | null;
  /** Client options for the picker. An empty list leaves it as "None". */
  clients: Client[];
  onClose: () => void;
  onCreated?: (project: Project) => void;
  onUpdated?: (project: Project) => void;
  onError?: (message: string) => void;
}

/**
 * Create and edit a project.
 *
 * Shared by the projects list and the project detail page so the two cannot
 * drift — the form used to live inline in the list, which meant a detail page
 * would have had to duplicate it wholesale.
 */
const ProjectFormDialog = ({
  open,
  project,
  clients,
  onClose,
  onCreated,
  onUpdated,
  onError,
}: ProjectFormDialogProps) => {
  const editing = project ?? null;
  const [form, setForm] = useState<ProjectFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /*
   * The form is seeded when the dialog opens rather than on every render of the
   * parent, and re-seeded whenever the target project changes. Keying the dialog
   * on the project id is the simpler way to say the same thing: a new instance
   * mounts with clean state each time a different project is opened.
   */
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const seedKey = editing ? editing.id : "new";

  if (open && seededFor !== seedKey) {
    setSeededFor(seedKey);
    setForm(editing ? projectToForm(editing) : emptyForm);
    setFormError(null);
  }

  const close = () => {
    if (submitting) return;

    setSeededFor(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Enter a project name.");

      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setFormError("The end date cannot be before the start date.");

      return;
    }

    try {
      setSubmitting(true);

      if (editing) {
        const updated = await projectsService.update(editing.id, editPayload(form));

        onUpdated?.(updated);
      } else {
        const created = await projectsService.create(createPayload(form));

        onCreated?.(created);
      }

      setSeededFor(null);
      onClose();
    } catch (error) {
      const description = getApiErrorMessage(error);

      setFormError(description);
      onError?.(description);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      label={editing ? "Edit project" : "New project"}
      title={editing ? `Edit ${editing.name}` : "New project"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="project-form"
            variant="primary"
            loading={submitting}
            disabled={submitting || !form.name.trim()}
          >
            {editing ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="project-name"
          name="name"
          label="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          data-autofocus
          required
        />

        <Textarea
          id="project-description"
          name="description"
          label="Description"
          rows={3}
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="project-client"
            label="Client"
            description="Optional — the project can stand alone."
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

        <Input
          id="project-budget"
          name="budget"
          label="Budget"
          inputMode="decimal"
          hint="Figures only — no currency symbol. Stored as a decimal amount."
          placeholder="e.g. 250000"
          value={form.budget}
          onChange={(event) => setForm({ ...form, budget: event.target.value })}
        />

        {formError && (
          <p role="alert" className="text-[13px] text-danger">
            {formError}
          </p>
        )}
      </form>
    </Dialog>
  );
};

export default ProjectFormDialog;