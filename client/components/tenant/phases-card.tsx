"use client";

import { useEffect, useState } from "react";
import { Archive, ListOrdered, Pencil, Plus } from "lucide-react";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Section, SectionHeader } from "@/components/workspace/section";
import { getApiErrorMessage } from "@/lib/api/errors";
import { pluralise } from "@/lib/format";
import {
  phasesService,
  type CreateProjectPhaseInput,
  type ProjectPhase,
  type UpdateProjectPhaseInput,
} from "@/services/phases.service";

const emptyForm = {
  name: "",
  description: "",
  order: "",
};

type FormState = typeof emptyForm;

const toForm = (phase: ProjectPhase): FormState => ({
  name: phase.name,
  description: phase.description ?? "",
  order: String(phase.order),
});

/**
 * The practice's project phases.
 *
 * Phases are tenant-wide templates — "Concept Design", "Documentation" — not
 * per-project rows; tasks and deliverables reference one by id. The API has had
 * full create/update/archive support for them all along and nothing in the UI
 * called any of it, so the vocabulary was invisible.
 *
 * Order is the server's field and is editable here. There is no reorder endpoint,
 * so the list is not presented as drag-to-sort: an ordering control the API
 * cannot persist would be a lie.
 */
export default function PhasesCard() {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<ProjectPhase | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<ProjectPhase | null>(null);

  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setPhases(await phasesService.list());
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await load();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const archiving = archiveTarget !== null;

  const openCreate = () => {
    setEditing(null);
    // New phases append to the end rather than defaulting to 0, which would
    // put them above the existing sequence.
    setForm({
      name: "",
      description: "",
      order: String(phases.length + 1),
    });
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  const openEdit = (phase: ProjectPhase) => {
    setEditing(phase);
    setForm(toForm(phase));
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  const parseOrder = (value: string) => {
    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const createPayload = (state: FormState): CreateProjectPhaseInput => {
    const payload: CreateProjectPhaseInput = { name: state.name.trim() };

    if (state.description.trim())
      payload.description = state.description.trim();

    const order = parseOrder(state.order);

    if (order !== undefined) payload.order = order;

    return payload;
  };

  /**
   * `PATCH /project-phases/:id` writes only the keys it receives, so an emptied
   * optional is sent as `null` rather than dropped — otherwise the dialog would
   * close as edited while the old value stayed stored.
   */
  const editPayload = (state: FormState): UpdateProjectPhaseInput => {
    const payload: UpdateProjectPhaseInput = {
      name: state.name.trim(),
      description: state.description.trim() || null,
    };

    const order = parseOrder(state.order);

    payload.order = order ?? null;

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Enter a phase name.");

      return;
    }

    try {
      setSubmitting(true);

      if (editing) {
        const updated = await phasesService.update(
          editing.id,
          editPayload(form),
        );

        setPhases((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
        toast({
          tone: "success",
          title: "Phase updated",
          description: updated.name,
        });
      } else {
        const created = await phasesService.create(createPayload(form));

        setPhases((prev) => [...prev, created]);
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
        toast({
          tone: "success",
          title: "Phase created",
          description: created.name,
        });
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const archive = async (phase: ProjectPhase) => {
    setActionError(null);

    try {
      await phasesService.archive(phase.id);

      setPhases((prev) => prev.filter((item) => item.id !== phase.id));
      setArchiveTarget(null);
      toast({
        tone: "success",
        title: "Phase archived",
        description: phase.name,
      });
    } catch (error) {
      const description = getApiErrorMessage(error);

      setActionError(description);
      setArchiveTarget(null);
      toast({ tone: "error", title: "Could not archive phase", description });
    }
  };

  const ordered = [...phases].sort((a, b) => a.order - b.order);

  return (
    <>
      <Section className="motion-enter">
        <SectionHeader
          title="Phases"
          description={
            loading
              ? "Loading…"
              : `${pluralise(ordered.length, "phase")} in your practice`
          }
          actions={
            <Button size="sm" variant="secondary" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              New phase
            </Button>
          }
        />

        <div className="mt-5">
          {loading ? (
            <div
              role="status"
              className="py-8 text-center text-[14px] text-ink-subtle"
            >
              Loading…
            </div>
          ) : loadError && ordered.length === 0 ? (
            <EmptyState
              title="Could not load phases"
              description={loadError}
              tone="error"
              size="sm"
              action={
                <Button variant="secondary" onClick={load}>
                  Try again
                </Button>
              }
            />
          ) : ordered.length === 0 ? (
            <EmptyState
              icon={<ListOrdered className="size-4" aria-hidden="true" />}
              title="No phases yet"
              description="Phases are the stages every project moves through, such as Concept Design or Documentation. Tasks and deliverables can be assigned to them."
              size="sm"
              action={
                <Button variant="primary" onClick={openCreate} size="sm">
                  <Plus className="size-4" aria-hidden="true" />
                  New phase
                </Button>
              }
            />
          ) : (
            <>
              <p className="mb-3 text-[13px] leading-relaxed text-ink-muted">
                These apply to every project in the practice. Phases are ordered
                as shown.
              </p>

              <ul className="space-y-2">
                {ordered.map((phase) => (
                  <li
                    key={phase.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] text-ink-subtle tabular-nums">
                          {phase.order}
                        </span>

                        <span className="truncate text-[14px] font-medium text-ink">
                          {phase.name}
                        </span>

                        {phase.isDefault && (
                          <Badge tone="info" dot>
                            Default
                          </Badge>
                        )}
                      </div>

                      {phase.description && (
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-subtle">
                          {phase.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => openEdit(phase)}
                        aria-label={`Edit ${phase.name}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>

                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => setArchiveTarget(phase)}
                        aria-label={`Archive ${phase.name}`}
                      >
                        <Archive className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {actionError && (
            <p
              role="alert"
              className="mt-4 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
            >
              {actionError}
            </p>
          )}
        </div>
      </Section>

      <Dialog
        open={open}
        onClose={() => {
          if (submitting) return;

          setOpen(false);
        }}
        label={editing ? "Edit phase" : "New phase"}
        title={editing ? `Edit ${editing.name}` : "New phase"}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="phase-form"
              variant="primary"
              loading={submitting}
              disabled={submitting || !form.name.trim()}
            >
              {editing ? "Save changes" : "Create phase"}
            </Button>
          </>
        }
      >
        <form
          id="phase-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <Input
            id="phase-name"
            name="name"
            label="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            data-autofocus
            required
          />

          <Textarea
            id="phase-description"
            name="description"
            label="Description"
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />

          <Input
            id="phase-order"
            name="order"
            label="Order"
            type="number"
            inputMode="numeric"
            min={1}
            hint="Lower numbers come first. There is no drag-to-reorder, so this is the control."
            value={form.order}
            onChange={(event) =>
              setForm({ ...form, order: event.target.value })
            }
          />

          {formError && (
            <p role="alert" className="text-[13px] text-danger">
              {formError}
            </p>
          )}
        </form>
      </Dialog>

      <Dialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        label="Archive phase"
        title="Archive this phase?"
        hideClose
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setArchiveTarget(null)}
              disabled={archiving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={archiving}
              onClick={() => archiveTarget && archive(archiveTarget)}
            >
              Archive phase
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px] leading-relaxed text-ink-muted">
          <p>
            <span className="font-medium text-ink">{archiveTarget?.name}</span>{" "}
            will no longer be offered when creating a task or deliverable.
          </p>

          {/* Archiving the row does not touch the tasks and deliverables that
              already reference it, and nothing here counts them — the claim
              would be unverifiable, so the honest thing is to not make it. */}
          <p>Tasks and deliverables already assigned to it are not changed.</p>
        </div>
      </Dialog>
    </>
  );
}
