"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, FileCheck2, Pencil, Plus, Upload, X } from "lucide-react";

import Link from "next/link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import DateInput from "@/components/ui/date-input";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import SearchField from "@/components/ui/search-field";
import Select from "@/components/ui/select";
import Skeleton from "@/components/ui/skeleton";
import Textarea from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import DataView from "@/components/workspace/data-view";
import { ErrorState, InlineError } from "@/components/workspace/error-state";
import { FilterChips } from "@/components/workspace/filter-chips";
import PageHeader from "@/components/workspace/page-header";
import PageToolbar from "@/components/workspace/page-toolbar";
import { compareBy, useTableSort } from "@/hooks/use-table-sort";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatBytes, formatDate, pluralise } from "@/lib/format";
import { toStatusOptions } from "@/lib/domain/status";
import {
  DELIVERABLE_STATUS_ORDER,
  deliverablesService,
  type CreateDeliverableInput,
  type Deliverable,
  type DeliverableStatus,
  type UpdateDeliverableInput,
} from "@/services/deliverables.service";
import { filesService, type FileRecord } from "@/services/files.service";
import { projectsService, type Project } from "@/services/projects.service";
import { tasksService, type Task } from "@/services/tasks.service";
import { phasesService, type ProjectPhase } from "@/services/phases.service";

const STATUS_OPTIONS = toStatusOptions(DELIVERABLE_STATUS_ORDER);

/** Statuses that mean the deliverable has landed with the client. */
const SETTLED_STATUSES: DeliverableStatus[] = ["APPROVED", "FINALIZED"];

const emptyForm = {
  projectId: "",
  taskId: "",
  phaseId: "",
  name: "",
  description: "",
  status: "IN_PROGRESS" as DeliverableStatus,
  dueDate: "",
};

type FormState = typeof emptyForm;

const DeliverablesPage = () => {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  /** Picker options only; its failure should not affect the list. */
  const [phases, setPhases] = useState<ProjectPhase[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliverableStatus | "all">(
    "all",
  );
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Deliverable | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Failures from an action on a page that still has data. Kept apart from
   *  `loadError` so a failed status change does not read as "the list failed". */
  const [actionError, setActionError] = useState<string | null>(null);

  const [uploadTarget, setUploadTarget] = useState<Deliverable | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<Deliverable | null>(null);
  const [removeFileTarget, setRemoveFileTarget] = useState<FileRecord | null>(
    null,
  );

  const [now, setNow] = useState(0);

  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [deliverableData, projectData, taskData, fileData] =
        await Promise.all([
          deliverablesService.list(),
          projectsService.list(),
          tasksService.list(),
          filesService.list(),
        ]);

      setDeliverables(deliverableData);
      setProjects(projectData);
      setTasks(taskData);
      setFiles(fileData);
      setNow(Date.now());
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }

    void phasesService
      .list()
      .then(setPhases)
      .catch(() => undefined);
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

  /** Tasks are scoped to the selected project, matching the API's own filter. */
  const formTasks = form.projectId
    ? tasks.filter((task) => task.projectId === form.projectId)
    : [];

  const projectName = (projectId: string) =>
    projects.find((project) => project.id === projectId)?.name ?? null;

  const phaseName = (phaseId?: string | null) =>
    phases.find((phase) => phase.id === phaseId)?.name ?? null;

  const attachedFiles = (deliverableId: string) =>
    files.filter((file) => file.deliverableId === deliverableId);

  /** Purely a comparison against the clock; the row already states the date. */
  const isOverdue = (deliverable: Deliverable) =>
    now > 0 &&
    Boolean(deliverable.dueDate) &&
    !SETTLED_STATUSES.includes(deliverable.status) &&
    new Date(deliverable.dueDate ?? now).getTime() < now;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  const openEdit = (deliverable: Deliverable) => {
    setEditing(deliverable);
    setForm({
      projectId: deliverable.projectId,
      taskId: deliverable.taskId ?? "",
      phaseId: deliverable.phaseId ?? "",
      name: deliverable.name,
      description: deliverable.description ?? "",
      status: deliverable.status,
      dueDate: deliverable.dueDate?.slice(0, 10) ?? "",
    });
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  const createPayload = (state: FormState): CreateDeliverableInput => {
    const payload: CreateDeliverableInput = {
      projectId: state.projectId,
      name: state.name.trim(),
      status: state.status,
    };

    if (state.description.trim())
      payload.description = state.description.trim();
    if (state.taskId) payload.taskId = state.taskId;
    if (state.phaseId) payload.phaseId = state.phaseId;
    if (state.dueDate) payload.dueDate = new Date(state.dueDate).toISOString();

    return payload;
  };

  /**
   * A deliverable cannot change project, so `projectId` is left out and every
   * emptied optional becomes an explicit `null`, since `PATCH /deliverables/:id`
   * writes only the keys it receives and would otherwise keep the old value.
   *
   * `version` is not sent: the API has no "next version" or upload-a-new-
   * revision endpoint, so a number typed here would be a value the UI cannot
   * make true.
   */
  const editPayload = (state: FormState): UpdateDeliverableInput => ({
    name: state.name.trim(),
    status: state.status,
    description: state.description.trim() || null,
    taskId: state.taskId || null,
    phaseId: state.phaseId || null,
    dueDate: state.dueDate ? new Date(state.dueDate).toISOString() : null,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    /*
     * The native `<select required>` used to block submission in the browser.
     * A custom listbox cannot carry constraint validation, so the same check
     * happens here and reports through the form's existing error line.
     */
    if (!editing && !form.projectId) {
      setFormError("Select a project.");

      return;
    }

    if (!form.name.trim()) {
      setFormError("Enter a deliverable name.");

      return;
    }

    try {
      setSubmitting(true);

      if (editing) {
        const updated = await deliverablesService.update(
          editing.id,
          editPayload(form),
        );

        setDeliverables((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
        toast({
          tone: "success",
          title: "Deliverable updated",
          description: updated.name,
        });
      } else {
        const created = await deliverablesService.create(createPayload(form));

        setDeliverables((prev) => [created, ...prev]);
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
        toast({
          tone: "success",
          title: "Deliverable created",
          description: created.name,
        });
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const advanceStatus = async (
    deliverable: Deliverable,
    status: DeliverableStatus,
  ) => {
    const previous = deliverable;

    setActionError(null);
    setDeliverables((prev) =>
      prev.map((item) =>
        item.id === deliverable.id ? { ...item, status } : item,
      ),
    );

    try {
      const updated = await deliverablesService.update(deliverable.id, {
        status,
      });

      setDeliverables((prev) =>
        prev.map((item) => (item.id === deliverable.id ? updated : item)),
      );
    } catch (error) {
      setDeliverables((prev) =>
        prev.map((item) => (item.id === deliverable.id ? previous : item)),
      );

      const description = getApiErrorMessage(error);

      setActionError(description);
      toast({ tone: "error", title: "Could not change status", description });
    }
  };

  const handleUpload = async (file: File) => {
    if (!uploadTarget) {
      return;
    }

    setUploadError(null);

    try {
      setUploading(true);

      /*
       * Both ids are sent deliberately: the DTO accepts them, and a file that
       * belongs to a deliverable also belongs to that deliverable's project.
       */
      const uploaded = await filesService.upload({
        file,
        deliverableId: uploadTarget.id,
        projectId: uploadTarget.projectId,
      });

      setFiles((prev) => [uploaded, ...prev]);
      setUploadTarget(null);
      toast({
        tone: "success",
        title: "File attached",
        description: uploaded.originalName,
      });
    } catch (error) {
      setUploadError(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (file: FileRecord) => {
    const previous = files;

    setFiles((prev) => prev.filter((item) => item.id !== file.id));

    try {
      await filesService.remove(file.id);

      setRemoveFileTarget(null);
      toast({
        tone: "success",
        title: "File removed",
        description: file.originalName,
      });
    } catch (error) {
      setFiles(previous);

      const description = getApiErrorMessage(error);

      setActionError(description);
      setRemoveFileTarget(null);
      toast({ tone: "error", title: "Could not remove file", description });
    }
  };

  const archive = async (deliverable: Deliverable) => {
    setActionError(null);

    try {
      await deliverablesService.archive(deliverable.id);

      setDeliverables((prev) =>
        prev.filter((item) => item.id !== deliverable.id),
      );
      setArchiveTarget(null);
      toast({
        tone: "success",
        title: "Deliverable archived",
        description: deliverable.name,
      });
    } catch (error) {
      const description = getApiErrorMessage(error);

      setActionError(description);
      setArchiveTarget(null);
      toast({
        tone: "error",
        title: "Could not archive deliverable",
        description,
      });
    } finally {
      setUploading(false);
    }
  };

  /*
   * Filtering runs over the list the page has already loaded. There is no search
   * endpoint, so this narrows what is on screen rather than querying the server.
   */
  const needle = query.trim().toLowerCase();

  const visible = deliverables.filter((deliverable) => {
    if (statusFilter !== "all" && deliverable.status !== statusFilter)
      return false;
    if (projectFilter !== "all" && deliverable.projectId !== projectFilter)
      return false;
    if (!needle) return true;

    return [
      deliverable.name,
      deliverable.description,
      projectName(deliverable.projectId),
      phaseName(deliverable.phaseId),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  /*
   * Due date and name are the two columns a user sorts by. The comparator reads
   * the lookup tables directly so its dependencies are the data it uses, and a
   * missing due date always sorts last — a deliverable without a date is not the
   * most urgent thing on the list.
   */
  const compareDeliverables = useCallback(
    (key: string | null, a: Deliverable, b: Deliverable) => {
      if (key === "project") {
        return compareBy<Deliverable>(
          (deliverable) =>
            projects.find((project) => project.id === deliverable.projectId)
              ?.name,
        )(a, b);
      }

      if (key === "phase") {
        return compareBy<Deliverable>(
          (deliverable) =>
            phases.find((phase) => phase.id === deliverable.phaseId)?.name,
        )(a, b);
      }

      if (key === "version") return a.version - b.version;

      if (key === "name") return compareBy<Deliverable>((d) => d.name)(a, b);

      return compareBy<Deliverable>((d) => d.dueDate)(a, b);
    },
    [projects, phases],
  );

  const { sort, onSortChange, sorted } = useTableSort(
    visible,
    compareDeliverables,
  );

  const canCreate = projects.length > 0;

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <PageHeader
          title="Deliverables"
          description="Drawings, reports and issued documents, and where each one stands with the client."
          actions={
            canCreate ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" aria-hidden="true" />
                New deliverable
              </Button>
            ) : undefined
          }
        />

        {actionError && (
          <InlineError
            title="Action failed"
            detail={actionError}
            className="mt-5"
          />
        )}

        {loading ? (
          <DeliverablesSkeleton />
        ) : loadError && deliverables.length === 0 ? (
          <ErrorState
            title="Couldn't load deliverables"
            description="We couldn't retrieve your issued documents right now."
            detail={loadError}
            onRetry={load}
            className="border-t border-line"
          />
        ) : deliverables.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<FileCheck2 className="size-4" aria-hidden="true" />}
              title="No deliverables yet"
              description={
                canCreate
                  ? "Create a deliverable to start tracking issued documents."
                  : "Create a project first — every deliverable belongs to one."
              }
              action={
                canCreate ? (
                  <Button onClick={openCreate}>
                    <Plus className="size-4" aria-hidden="true" />
                    New deliverable
                  </Button>
                ) : (
                  <Link
                    href="/projects"
                    className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Go to projects
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            <PageToolbar
              className="mt-6"
              count={
                needle || statusFilter !== "all" || projectFilter !== "all"
                  ? `${sorted.length} of ${deliverables.length}`
                  : pluralise(deliverables.length, "deliverable")
              }
              filters={
                <>
                  <FilterChips
                    label="Filter by status"
                    allLabel="All statuses"
                    options={STATUS_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                      count: deliverables.filter(
                        (deliverable) => deliverable.status === option.value,
                      ).length,
                    }))}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />

                  <FilterChips
                    label="Filter by project"
                    allLabel="All projects"
                    options={projects.map((project) => ({
                      value: project.id,
                      label: project.name,
                      count: deliverables.filter(
                        (deliverable) => deliverable.projectId === project.id,
                      ).length,
                    }))}
                    value={projectFilter}
                    onChange={setProjectFilter}
                  />
                </>
              }
            >
              <SearchField
                label="Search deliverables"
                placeholder="Name, project or phase"
                value={query}
                onChange={setQuery}
              />
            </PageToolbar>

            <div className="mt-6">
              {sorted.length === 0 ? (
                <EmptyState
                  title="Nothing matches"
                  description="No deliverable matches the current search and filters."
                  size="sm"
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("all");
                        setProjectFilter("all");
                      }}
                    >
                      Clear search and filters
                    </Button>
                  }
                />
              ) : (
                <DataView<Deliverable>
                  label="Deliverables"
                  rows={sorted}
                  rowKey={(deliverable) => deliverable.id}
                  sort={sort}
                  onSortChange={onSortChange}
                  primary={(deliverable) => deliverable.name}
                  secondary={(deliverable) =>
                    [
                      projectName(deliverable.projectId),
                      phaseName(deliverable.phaseId),
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No project or phase"
                  }
                  meta={(deliverable) => (
                    <>
                      <StatusBadge status={deliverable.status} />

                      {/* Version is server-assigned and only ever moves forward,
                          so it is read-only everywhere. */}
                      <Badge tone="neutral" dot={false}>
                        v{deliverable.version}
                      </Badge>

                      {deliverable.dueDate && (
                        <span
                          className={[
                            "text-[12px] tabular-nums",
                            isOverdue(deliverable)
                              ? "text-danger"
                              : "text-ink-subtle",
                          ].join(" ")}
                        >
                          {isOverdue(deliverable) ? "Overdue · " : "Due "}
                          {formatDate(deliverable.dueDate)}
                        </span>
                      )}
                    </>
                  )}
                  actions={(deliverable) => (
                    <>
                      <Select
                        aria-label={`Status for ${deliverable.name}`}
                        options={STATUS_OPTIONS}
                        value={deliverable.status}
                        size="sm"
                        fullWidth={false}
                        onChange={(value) =>
                          advanceStatus(deliverable, value as DeliverableStatus)
                        }
                        className="w-[150px]"
                      />

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setUploadError(null);
                          setUploadTarget(deliverable);
                        }}
                      >
                        <Upload className="size-4" aria-hidden="true" />
                        Files
                      </Button>

                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => openEdit(deliverable)}
                        aria-label={`Edit ${deliverable.name}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>

                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => setArchiveTarget(deliverable)}
                        aria-label={`Archive ${deliverable.name}`}
                      >
                        <Archive className="size-4" aria-hidden="true" />
                      </Button>
                    </>
                  )}
                  columns={[
                    {
                      key: "name",
                      header: "Deliverable",
                      sortable: true,
                      cell: (deliverable) => deliverable.name,
                    },
                    {
                      key: "status",
                      header: "Status",
                      width: "w-32",
                      cell: (deliverable) => (
                        <StatusBadge status={deliverable.status} />
                      ),
                    },
                    {
                      key: "version",
                      header: "Version",
                      width: "w-20",
                      numeric: true,
                      sortable: true,
                      cell: (deliverable) => `v${deliverable.version}`,
                    },
                    {
                      key: "project",
                      header: "Project",
                      sortable: true,
                      hideBelowLg: true,
                      cell: (deliverable) =>
                        projectName(deliverable.projectId) ?? "—",
                    },
                    {
                      key: "phase",
                      header: "Phase",
                      sortable: true,
                      hideBelowLg: true,
                      cell: (deliverable) =>
                        phaseName(deliverable.phaseId) ?? "—",
                    },
                    {
                      key: "files",
                      header: "Files",
                      align: "right",
                      numeric: true,
                      width: "w-20",
                      hideBelowMd: true,
                      cell: (deliverable) =>
                        attachedFiles(deliverable.id).length,
                    },
                    {
                      key: "due",
                      header: "Due",
                      numeric: true,
                      sortable: true,
                      width: "w-36",
                      cell: (deliverable) =>
                        deliverable.dueDate ? (
                          <span
                            className={
                              isOverdue(deliverable) ? "text-danger" : undefined
                            }
                          >
                            {formatDate(deliverable.dueDate)}
                          </span>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        ),
                    },
                  ]}
                />
              )}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={open}
        onClose={() => {
          if (submitting) return;

          setOpen(false);
        }}
        label={editing ? "Edit deliverable" : "New deliverable"}
        title={editing ? `Edit ${editing.name}` : "New deliverable"}
        size="lg"
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
              form="deliverable-form"
              variant="primary"
              loading={submitting}
              disabled={
                submitting || !form.name.trim() || (!editing && !form.projectId)
              }
            >
              {editing ? "Save changes" : "Create deliverable"}
            </Button>
          </>
        }
      >
        <form
          id="deliverable-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          {/* A deliverable cannot change project, so the picker is hidden while
              editing rather than disabled — a permanently greyed-out field
              reads as a fault. */}
          {editing ? (
            <p className="text-[13px] text-ink-muted">
              Project:{" "}
              <span className="text-ink">
                {projectName(editing.projectId) ?? "Unknown project"}
              </span>
            </p>
          ) : (
            <Select
              id="deliverable-project"
              label="Project"
              placeholder="Select a project"
              required
              options={projects.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
              value={form.projectId}
              onChange={(value) =>
                setForm({ ...form, projectId: value, taskId: "" })
              }
            />
          )}

          <Input
            id="deliverable-name"
            name="name"
            label="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            data-autofocus={editing ? true : undefined}
            required
          />

          <Textarea
            id="deliverable-description"
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
              id="deliverable-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(value) =>
                setForm({ ...form, status: value as DeliverableStatus })
              }
            />

            <DateInput
              id="deliverable-due"
              label="Due date"
              value={form.dueDate}
              onChange={(value) => setForm({ ...form, dueDate: value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="deliverable-phase"
              label="Phase"
              placeholder="None"
              description={
                phases.length === 0 ? "No phases set up yet." : undefined
              }
              options={phases.map((phase) => ({
                value: phase.id,
                label: phase.name,
              }))}
              value={form.phaseId}
              onChange={(value) => setForm({ ...form, phaseId: value })}
            />

            <Select
              id="deliverable-task"
              label="Linked task"
              placeholder="None"
              disabled={!form.projectId}
              hint={form.projectId ? undefined : "Select a project first"}
              options={formTasks.map((task) => ({
                value: task.id,
                label: task.title,
              }))}
              value={form.taskId}
              onChange={(value) => setForm({ ...form, taskId: value })}
            />
          </div>

          {formError && (
            <p role="alert" className="text-[13px] text-danger">
              {formError}
            </p>
          )}
        </form>
      </Dialog>

      <Dialog
        open={uploadTarget !== null}
        onClose={() => {
          if (uploading) return;

          setUploadTarget(null);
        }}
        label="Attach a file"
        title={
          uploadTarget ? `Attach to ${uploadTarget.name}` : "Attach a file"
        }
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUploadTarget(null)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="deliverable-upload-form"
              variant="primary"
              loading={uploading}
              disabled={uploading}
            >
              Upload
            </Button>
          </>
        }
      >
        <form
          id="deliverable-upload-form"
          onSubmit={(event) => {
            event.preventDefault();

            const input = event.currentTarget.elements.namedItem(
              "attachment",
            ) as HTMLInputElement | null;

            const file = input?.files?.[0];

            if (file) {
              handleUpload(file);
            }
          }}
          className="space-y-4"
        >
          {/* The row shows a file count; this is where the files themselves are
              listed, so a deliverable still has exactly one place to review and
              change what has been issued against it. */}
          {uploadTarget && attachedFiles(uploadTarget.id).length > 0 && (
            <div>
              <p className="text-[13px] text-ink-subtle">Already attached</p>

              <ul className="mt-2 divide-y divide-line border-y border-line">
                {attachedFiles(uploadTarget.id).map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0 truncate text-[13px] text-ink">
                      {file.originalName}
                    </span>

                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-[12px] text-ink-subtle tabular-nums">
                        {formatBytes(file.size)}
                      </span>

                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => setRemoveFileTarget(file)}
                        aria-label={`Remove ${file.originalName}`}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="deliverable-attachment"
            >
              File
            </label>
            <input
              id="deliverable-attachment"
              name="attachment"
              type="file"
              data-autofocus
              className="block w-full text-[13px] text-ink-muted file:mr-3 file:rounded-sm file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-[13px] file:text-ink"
            />
            <p className="mt-1 text-[12px] text-ink-subtle">
              The file is also linked to the deliverable&apos;s project.
            </p>
          </div>

          {uploadError && (
            <p role="alert" className="text-[13px] text-danger">
              {uploadError}
            </p>
          )}
        </form>
      </Dialog>

      <Dialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        label="Archive deliverable"
        title="Archive this deliverable?"
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
              Archive deliverable
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px] leading-relaxed text-ink-muted">
          <p>
            <span className="font-medium text-ink">{archiveTarget?.name}</span>{" "}
            will be removed from this list. Archiving keeps the deliverable, its
            version history and its files, so it can be restored later.
          </p>

          {archiveTarget && attachedFiles(archiveTarget.id).length > 0 && (
            <p>
              {pluralise(
                attachedFiles(archiveTarget.id).length,
                "attached file",
              )}{" "}
              will stay attached to it.
            </p>
          )}
        </div>
      </Dialog>

      <Dialog
        open={removeFileTarget !== null}
        onClose={() => setRemoveFileTarget(null)}
        label="Remove file"
        title="Remove this file?"
        hideClose
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRemoveFileTarget(null)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={uploading}
              onClick={() => removeFileTarget && removeFile(removeFileTarget)}
            >
              Remove file
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">
            {removeFileTarget?.originalName}
          </span>{" "}
          will no longer be listed against this deliverable. The stored file is
          kept on the server.
        </p>
      </Dialog>
    </>
  );
};

/**
 * Mirrors the settled page — toolbar rule, then a table — so the transition
 * does not reflow.
 */
const DeliverablesSkeleton = () => (
  <div className="mt-6" aria-busy="true">
    <span className="sr-only">Loading deliverables…</span>

    <Skeleton className="h-14 w-full" />
    <Skeleton className="mt-6 h-72 w-full" />
  </div>
);

export default DeliverablesPage;
