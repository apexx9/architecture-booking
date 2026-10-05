"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";

import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import SearchField from "@/components/ui/search-field";
import Select from "@/components/ui/select";
import Skeleton from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import DataView from "@/components/workspace/data-view";
import { ErrorState, InlineError } from "@/components/workspace/error-state";
import { FilterChips } from "@/components/workspace/filter-chips";
import PageHeader from "@/components/workspace/page-header";
import PageToolbar from "@/components/workspace/page-toolbar";
import ClientFormDialog from "@/components/client/client-form-dialog";
import { getApiErrorMessage } from "@/lib/api/errors";
import { pluralise } from "@/lib/format";
import { toStatusOptions } from "@/lib/domain/status";
import {
  CLIENT_STATUSES,
  clientsService,
  type Client,
  type ClientStatus,
} from "@/services/clients.service";
import { projectsService, type Project } from "@/services/projects.service";

const CLIENT_STATUS_OPTIONS = toStatusOptions(CLIENT_STATUSES);

type PendingAction = "status" | "remove";

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");

  const [open, setOpen] = useState(false);
  /** When set, the dialog edits this client instead of creating a new one. */
  const [editing, setEditing] = useState<Client | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    id: string;
    action: PendingAction;
  } | null>(null);

  const [removeTarget, setRemoveTarget] = useState<Client | null>(null);

  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [clientData, projectData] = await Promise.all([
        clientsService.getAll(),
        // Only used to count a client's projects. A failure here must not blank
        // the client list, so it degrades to "no projects" rather than an error.
        projectsService.list().catch(() => [] as Project[]),
      ]);

      setClients(clientData);
      setProjects(projectData);
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

  const removing = pending?.action === "remove";

  /** How many projects reference this client, so the delete warning can be specific. */
  const projectCount = (clientId: string) =>
    projects.filter((project) => project.clientId === clientId).length;

  /*
   * Filtering runs over the list the page has already loaded. There is no search
   * endpoint, so this narrows what is on screen rather than querying the server.
   */
  const needle = query.trim().toLowerCase();

  const visible = clients.filter((client) => {
    if (statusFilter !== "all" && client.status !== statusFilter) return false;
    if (!needle) return true;

    return [client.name, client.company, client.email, client.phone]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const openCreate = () => {
    setEditing(null);
    setActionError(null);
    setOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setActionError(null);
    setOpen(true);
  };

  const updateStatus = async (client: Client, status: ClientStatus) => {
    const previous = client;

    setActionError(null);
    setClients((prev) =>
      prev.map((item) => (item.id === client.id ? { ...item, status } : item)),
    );

    try {
      setPending({ id: client.id, action: "status" });

      const updated = await clientsService.update(client.id, { status });

      setClients((prev) =>
        prev.map((item) => (item.id === client.id ? updated : item)),
      );
    } catch (error) {
      setClients((prev) =>
        prev.map((item) => (item.id === client.id ? previous : item)),
      );

      const description = getApiErrorMessage(error);

      setActionError(description);
      toast({ tone: "error", title: "Could not change status", description });
    } finally {
      setPending(null);
    }
  };

  const remove = async (client: Client) => {
    setActionError(null);

    try {
      setPending({ id: client.id, action: "remove" });

      await clientsService.delete(client.id);

      setClients((prev) => prev.filter((item) => item.id !== client.id));
      setRemoveTarget(null);
      toast({
        tone: "success",
        title: "Client deleted",
        description: client.name,
      });
    } catch (error) {
      const description = getApiErrorMessage(error);

      setActionError(description);
      setRemoveTarget(null);
      toast({ tone: "error", title: "Could not delete client", description });
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <PageHeader
          title="Clients & Pipeline"
          description="Everyone you have an engagement with. Enquiries still working sit under Leads."
          actions={
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              New client
            </Button>
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
          <ClientsSkeleton />
        ) : loadError && clients.length === 0 ? (
          <ErrorState
            title="Couldn't load clients"
            description="We couldn't retrieve your clients right now."
            detail={loadError}
            onRetry={load}
            className="border-t border-line"
          />
        ) : clients.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Building2 className="size-4" aria-hidden="true" />}
              title="No clients yet"
              description="A client is someone you have an engagement with. Add one and you can attach projects to them, so the relationship stays visible instead of living in someone's inbox."
              action={
                <Button onClick={openCreate}>
                  <Plus className="size-4" aria-hidden="true" />
                  New client
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <PageToolbar
              className="mt-6"
              count={
                needle || statusFilter !== "all"
                  ? `${visible.length} of ${clients.length}`
                  : pluralise(clients.length, "client")
              }
              filters={
                <FilterChips
                  label="Filter by status"
                  allLabel="All statuses"
                  options={CLIENT_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                    count: clients.filter(
                      (client) => client.status === option.value,
                    ).length,
                  }))}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              }
            >
              <SearchField
                label="Search clients"
                placeholder="Name, company or contact"
                value={query}
                onChange={setQuery}
              />
            </PageToolbar>

            <div className="mt-6">
              {visible.length === 0 ? (
                <EmptyState
                  title="Nothing matches"
                  description="No client matches the current search and filter."
                  size="sm"
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear search and filter
                    </Button>
                  }
                />
              ) : (
                <DataView<Client>
                  label="Clients"
                  rowKey={(client) => client.id}
                  rowHref={(client) => `/clients/${client.id}`}
                  primary={(client) => client.name}
                  secondary={(client) =>
                    client.company ?? client.email ?? "No contact details"
                  }
                  meta={(client) => (
                    <>
                      <StatusBadge status={client.status} />

                      {/* The project count is the one row fact that says whether
                          the relationship is actually in use. */}
                      <span className="text-[12px] text-ink-subtle tabular-nums">
                        {pluralise(projectCount(client.id), "project")}
                      </span>
                    </>
                  )}
                  rows={visible}
                  actions={(client) => (
                    <>
                      <Select
                        aria-label={`Status for ${client.name}`}
                        options={CLIENT_STATUS_OPTIONS}
                        value={client.status}
                        size="sm"
                        fullWidth={false}
                        disabled={pending?.id === client.id}
                        onChange={(value) =>
                          updateStatus(client, value as ClientStatus)
                        }
                        className="w-[112px]"
                      />

                      <Button
                        size="sm"
                        variant="tertiary"
                        disabled={pending?.id === client.id}
                        onClick={() => openEdit(client)}
                        aria-label={`Edit ${client.name}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>

                      <Button
                        size="sm"
                        variant="tertiary"
                        disabled={pending?.id === client.id}
                        onClick={() => setRemoveTarget(client)}
                        aria-label={`Delete ${client.name}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </>
                  )}
                  columns={[
                    {
                      key: "name",
                      header: "Client",
                      cell: (client) => client.name,
                    },
                    {
                      key: "company",
                      header: "Company",
                      hideBelowLg: true,
                      cell: (client) => client.company ?? "—",
                    },
                    {
                      key: "contact",
                      header: "Contact",
                      hideBelowMd: true,
                      cell: (client) => (
                        <span className="block truncate">
                          {client.email ?? client.phone ?? "—"}
                        </span>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status",
                      cell: (client) => <StatusBadge status={client.status} />,
                    },
                    {
                      key: "projects",
                      header: "Projects",
                      align: "right",
                      numeric: true,
                      hideBelowLg: true,
                      cell: (client) => projectCount(client.id),
                    },
                  ]}
                />
              )}
            </div>
          </>
        )}
      </div>

      <ClientFormDialog
        open={open}
        client={editing}
        onClose={() => setOpen(false)}
        onSaved={(saved) => {
          setClients((prev) =>
            editing
              ? prev.map((item) => (item.id === saved.id ? saved : item))
              : [saved, ...prev],
          );
          toast({
            tone: "success",
            title: editing ? "Client updated" : "Client created",
            description: saved.name,
          });
        }}
      />

      <Dialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        label="Delete client"
        title="Delete this client?"
        hideClose
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRemoveTarget(null)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={removing}
              onClick={() => removeTarget && remove(removeTarget)}
            >
              Delete client
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px] leading-relaxed text-ink-muted">
          <p>
            <span className="font-medium text-ink">{removeTarget?.name}</span>{" "}
            will be permanently deleted. This cannot be undone.
          </p>

          {/* Deleting a client does not delete its projects — the foreign key
              nulls out. Saying so is the difference between a user expecting a
              cascade and a user discovering it later. */}
          {removeTarget && projectCount(removeTarget.id) > 0 && (
            <p>
              {pluralise(projectCount(removeTarget.id), "project")} currently
              reference this client. They will be kept, but will no longer be
              linked to anyone.
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
};

/**
 * Mirrors the settled page — toolbar rule, then a table — so the transition
 * does not reflow.
 */
const ClientsSkeleton = () => (
  <div className="mt-6" aria-busy="true">
    <span className="sr-only">Loading clients…</span>

    <Skeleton className="h-14 w-full" />
    <Skeleton className="mt-6 h-72 w-full" />
  </div>
);

export default ClientsPage;
