"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Trash2 } from "lucide-react";

import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Select from "@/components/ui/select";
import Skeleton from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import DataView from "@/components/workspace/data-view";
import { ErrorState, InlineError } from "@/components/workspace/error-state";
import PageHeader from "@/components/workspace/page-header";
import { Section, SectionHeader } from "@/components/workspace/section";
import ClientFormDialog from "@/components/client/client-form-dialog";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  formatAmount,
  formatDate,
  formatDateRange,
  pluralise,
} from "@/lib/format";
import { toStatusOptions } from "@/lib/domain/status";
import {
  CLIENT_STATUSES,
  clientsService,
  type Client,
  type ClientStatus,
} from "@/services/clients.service";
import { projectsService, type Project } from "@/services/projects.service";
import { useCrumbStore } from "@/store/use-crumb-store";

const CLIENT_STATUS_OPTIONS = toStatusOptions(CLIENT_STATUSES);

interface ClientDetailProps {
  clientId: string;
}

/**
 * One client: who they are, and everything being delivered for them.
 *
 * Built only from endpoints that already exist — `GET /clients/:id` for the
 * record and the full project list, filtered here because `GET /projects` takes
 * no `?clientId`. A failure to load the projects leaves the client itself
 * readable rather than failing the whole page, because the record is the reason
 * for the page and the project list is context.
 */
export function ClientDetail({ clientId }: ClientDetailProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsFailed, setProjectsFailed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [statusBusy, setStatusBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const setTrail = useCrumbStore((state) => state.setTrail);
  const clearTrail = useCrumbStore((state) => state.clearTrail);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setClient(await clientsService.getOne(clientId));
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await load();
    };

    void run();

    // Projects are context, not the reason for this page, so a failure is
    // recorded rather than thrown.
    void projectsService
      .list()
      .then((data) => {
        if (!cancelled) {
          setProjects(data.filter((project) => project.clientId === clientId));
        }
      })
      .catch(() => {
        if (!cancelled) setProjectsFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, load]);

  /**
   * The context bar cannot know this client's name, so the page publishes its
   * trail and clears it on the way out — including when loading fails and there
   * is no name to show.
   */
  useEffect(() => {
    if (!client) return;

    setTrail([{ label: "Clients", href: "/clients" }, { label: client.name }]);

    return clearTrail;
  }, [client, setTrail, clearTrail]);

  const updateStatus = async (status: ClientStatus) => {
    if (!client) return;

    const previous = client;

    setActionError(null);
    setClient({ ...client, status });

    try {
      setStatusBusy(true);

      setClient(await clientsService.update(client.id, { status }));
    } catch (error) {
      setClient(previous);

      const description = getApiErrorMessage(error);

      setActionError(description);
      toast({ tone: "error", title: "Could not change status", description });
    } finally {
      setStatusBusy(false);
    }
  };

  const remove = async () => {
    if (!client) return;

    setActionError(null);

    try {
      setRemoving(true);

      await clientsService.delete(client.id);

      toast({
        tone: "success",
        title: "Client deleted",
        description: client.name,
      });

      // The record no longer exists, so staying here would show a client the
      // API cannot return again.
      router.push("/clients");
    } catch (error) {
      const description = getApiErrorMessage(error);

      setActionError(description);
      setRemoveOpen(false);
      toast({ tone: "error", title: "Could not delete client", description });
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10"
        aria-busy="true"
      >
        <span className="sr-only">Loading client…</span>

        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-9 w-64" />
        <Skeleton className="mt-4 h-4 w-96 max-w-full" />
        <Skeleton className="mt-10 h-64 w-full" />
      </div>
    );
  }

  if (loadError || !client) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <ErrorState
          title="Couldn't load this client"
          description="We couldn't retrieve this client record."
          detail={loadError ?? undefined}
          onRetry={load}
          backHref="/clients"
          backLabel="Back to clients"
          className="border-t border-line"
        />
      </div>
    );
  }

  const contact = [client.email, client.phone].filter(Boolean);

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <PageHeader
          backHref="/clients"
          backLabel="Clients"
          title={client.name}
          description={
            projects.length > 0
              ? `${pluralise(projects.length, "project")} delivered for this client.`
              : "No projects are linked to this client yet."
          }
          meta={[
            { label: "Status", value: <StatusBadge status={client.status} /> },
            ...(client.company
              ? [{ label: "Company", value: client.company }]
              : []),
            ...(contact.length > 0
              ? [{ label: "Contact", value: contact.join(" · ") }]
              : []),
            {
              label: "Client since",
              value: formatDate(client.createdAt) ?? "—",
            },
          ]}
          actions={
            <>
              <Select
                aria-label={`Status for ${client.name}`}
                options={CLIENT_STATUS_OPTIONS}
                value={client.status}
                size="sm"
                fullWidth={false}
                disabled={statusBusy}
                onChange={(value) => updateStatus(value as ClientStatus)}
                className="w-[112px]"
              />

              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </Button>

              <Button
                variant="tertiary"
                onClick={() => setRemoveOpen(true)}
                aria-label={`Delete ${client.name}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </>
          }
        />

        {actionError && (
          <InlineError
            title="Action failed"
            detail={actionError}
            className="mt-5"
          />
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-12">
          <Section divided>
            <SectionHeader title="Record" />

            <dl className="mt-5 divide-y divide-line">
              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0">
                <dt className="text-[13px] text-ink-subtle">Status</dt>
                <dd>
                  <StatusBadge status={client.status} />
                </dd>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <dt className="text-[13px] text-ink-subtle">Company</dt>
                <dd className="text-[14px] text-ink">
                  {client.company ?? "—"}
                </dd>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <dt className="text-[13px] text-ink-subtle">Email</dt>
                <dd className="text-[14px] text-ink">
                  {client.email ? (
                    <a
                      href={`mailto:${client.email}`}
                      className="rounded-sm underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {client.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <dt className="text-[13px] text-ink-subtle">Phone</dt>
                <dd className="text-[14px] text-ink tabular-nums">
                  {client.phone ?? "—"}
                </dd>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <dt className="text-[13px] text-ink-subtle">Address</dt>
                <dd className="max-w-[16rem] text-right text-[14px] text-ink">
                  {client.address ?? "—"}
                </dd>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <dt className="text-[13px] text-ink-subtle">Website</dt>
                <dd className="text-[14px] text-ink">
                  {client.website ? (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="rounded-sm underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    >
                      {client.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 last:pb-0">
                <dt className="text-[13px] text-ink-subtle">Last updated</dt>
                <dd className="text-[14px] text-ink tabular-nums">
                  {formatDate(client.updatedAt) ?? "—"}
                </dd>
              </div>
            </dl>
          </Section>

          <Section divided>
            <SectionHeader
              title="Notes"
              description={
                client.notes
                  ? undefined
                  : "Nothing recorded yet. Use Edit to keep preferences and context here."
              }
            />

            {client.notes && (
              <p className="mt-5 text-[14px] leading-relaxed whitespace-pre-line text-ink-muted">
                {client.notes}
              </p>
            )}
          </Section>
        </div>

        <Section divided className="mt-10">
          <SectionHeader
            title="Projects"
            description="Work being delivered for this client."
          />

          <div className="mt-5">
            {projectsFailed ? (
              <InlineError
                title="Could not load this client's projects."
                detail="The rest of the record is unaffected."
                onRetry={() => {
                  setProjectsFailed(false);
                  void projectsService
                    .list()
                    .then((data) =>
                      setProjects(
                        data.filter((project) => project.clientId === clientId),
                      ),
                    )
                    .catch(() => setProjectsFailed(true));
                }}
              />
            ) : (
              <DataView<Project>
                label="Projects for this client"
                rows={projects}
                rowKey={(project) => project.id}
                rowHref={(project) => `/projects/${project.id}`}
                primary={(project) => project.name}
                secondary={() =>
                  "Open the project for its tasks, deliverables and files"
                }
                meta={(project) => (
                  <>
                    <StatusBadge status={project.status} />

                    {formatDateRange(project.startDate, project.endDate) && (
                      <span className="text-[12px] text-ink-subtle tabular-nums">
                        {formatDateRange(project.startDate, project.endDate)}
                      </span>
                    )}

                    {formatAmount(project.budget) && (
                      <span className="text-[12px] text-ink-subtle tabular-nums">
                        GH₵{formatAmount(project.budget)}
                      </span>
                    )}
                  </>
                )}
                empty={
                  <EmptyState
                    icon={<Building2 className="size-4" aria-hidden="true" />}
                    title="No projects for this client"
                    description="A project is how work is scoped, budgeted and delivered. Create one and link it to this client."
                    size="sm"
                    action={
                      <Link
                        href="/projects"
                        className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[13px] text-ink transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        Go to projects
                      </Link>
                    }
                  />
                }
                columns={[
                  {
                    key: "name",
                    header: "Project",
                    cell: (project) => project.name,
                  },
                  {
                    key: "status",
                    header: "Status",
                    width: "w-28",
                    cell: (project) => <StatusBadge status={project.status} />,
                  },
                  {
                    key: "dates",
                    header: "Dates",
                    numeric: true,
                    hideBelowLg: true,
                    cell: (project) =>
                      formatDateRange(project.startDate, project.endDate) ??
                      "—",
                  },
                  {
                    key: "budget",
                    header: "Budget",
                    align: "right",
                    numeric: true,
                    hideBelowMd: true,
                    cell: (project) =>
                      formatAmount(project.budget)
                        ? `GH₵${formatAmount(project.budget)}`
                        : "—",
                  },
                ]}
              />
            )}
          </div>
        </Section>
      </div>

      <ClientFormDialog
        open={editOpen}
        client={client}
        onClose={() => setEditOpen(false)}
        onSaved={(saved) => {
          setClient(saved);
          toast({
            tone: "success",
            title: "Client updated",
            description: saved.name,
          });
        }}
      />

      <Dialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        label="Delete client"
        title="Delete this client?"
        hideClose
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRemoveOpen(false)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button variant="destructive" loading={removing} onClick={remove}>
              Delete client
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px] leading-relaxed text-ink-muted">
          <p>
            <span className="font-medium text-ink">{client.name}</span> will be
            permanently deleted. This cannot be undone.
          </p>

          {/* Deleting a client does not delete its projects — the foreign key
              nulls out. Saying so is the difference between a user expecting a
              cascade and a user discovering it later. */}
          {projects.length > 0 && (
            <p>
              {pluralise(projects.length, "project")} currently reference this
              client. They will be kept, but will no longer be linked to anyone.
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}

export default ClientDetail;
