"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Phone, Plus, Trash2 } from "lucide-react";

import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import SearchField from "@/components/ui/search-field";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api/errors";
import { pluralise } from "@/lib/format";
import { toStatusOptions } from "@/lib/domain/status";
import {
  CLIENT_STATUSES,
  clientsService,
  type Client,
  type ClientStatus,
  type CreateClientInput,
  type UpdateClientInput,
} from "@/services/clients.service";
import { projectsService, type Project } from "@/services/projects.service";

const CLIENT_STATUS_OPTIONS = toStatusOptions(CLIENT_STATUSES);

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  website: "",
  notes: "",
  status: "ACTIVE" as ClientStatus,
};

type FormState = typeof emptyForm;

/** Free-text fields a create may omit and an edit may deliberately clear. */
const OPTIONAL_TEXT_FIELDS = [
  "email",
  "phone",
  "company",
  "address",
  "website",
  "notes",
] as const;

type PendingAction = "status" | "remove";

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  /** When set, the dialog edits this client instead of creating a new one. */
  const [editing, setEditing] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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

  const visible = needle
    ? clients.filter((client) =>
        [client.name, client.company, client.email, client.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : clients;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      company: client.company ?? "",
      address: client.address ?? "",
      website: client.website ?? "",
      notes: client.notes ?? "",
      status: client.status,
    });
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  /**
   * Blank optional fields are dropped rather than sent: the server's
   * `@IsOptional()` skips `null` and `undefined` but not `""`, so an empty
   * string would fail validation on a field the user simply left alone.
   */
  const createPayload = (state: FormState): CreateClientInput => {
    const payload: CreateClientInput = {
      name: state.name.trim(),
      status: state.status,
    };

    for (const key of OPTIONAL_TEXT_FIELDS) {
      const value = state[key].trim();

      if (value) {
        payload[key] = value;
      }
    }

    return payload;
  };

  /**
   * On edit, an emptied field is a deliberate clear. `PATCH /clients/:id` writes
   * only the keys it receives, so dropping the key would leave the stored value
   * in place while the dialog closed as though it had worked — a silent lie
   * about the user's own data. Every optional column is nullable and the DTO's
   * `@IsOptional()` accepts `null`, so that is what a clear sends.
   */
  const editPayload = (state: FormState): UpdateClientInput => {
    const payload: UpdateClientInput = {
      name: state.name.trim(),
      status: state.status,
    };

    for (const key of OPTIONAL_TEXT_FIELDS) {
      payload[key] = state[key].trim() || null;
    }

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Enter a name.");

      return;
    }

    try {
      setSubmitting(true);

      if (editing) {
        const updated = await clientsService.update(
          editing.id,
          editPayload(form),
        );

        setClients((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
        toast({
          tone: "success",
          title: "Client updated",
          description: updated.name,
        });
      } else {
        const created = await clientsService.create(createPayload(form));

        setClients((prev) => [created, ...prev]);
        setOpen(false);
        setEditing(null);
        setForm(emptyForm);
        toast({
          tone: "success",
          title: "Client created",
          description: created.name,
        });
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
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
      toast({ tone: "success", title: "Client deleted", description: client.name });
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
        <header className="motion-enter flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[28px] font-light text-ink">
              Clients
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
              Everyone you have worked with, and who is still active.
            </p>
          </div>

          <Button variant="primary" onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New client
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

        {!loading && clients.length > 0 && (
          <div className="mt-6 max-w-sm motion-enter">
            <SearchField
              label="Search clients"
              placeholder="Search by name, company or contact"
              value={query}
              onChange={setQuery}
            />
          </div>
        )}

        <Card className="mt-6 motion-enter">
          <CardHeader
            title="All clients"
            description={
              loading
                ? "Loading…"
                : `${pluralise(visible.length, "client")}${
                    needle && visible.length !== clients.length
                      ? ` of ${clients.length}`
                      : ""
                  }`
            }
          />

          <CardBody>
            {loading ? (
              <div
                role="status"
                className="py-8 text-center text-[14px] text-ink-subtle"
              >
                Loading…
              </div>
            ) : loadError && clients.length === 0 ? (
              <EmptyState
                title="Could not load clients"
                description={loadError}
                tone="error"
                size="sm"
                action={
                  <Button variant="secondary" onClick={load}>
                    Try again
                  </Button>
                }
              />
            ) : clients.length === 0 ? (
              <EmptyState
                icon={<Building2 className="size-4" aria-hidden="true" />}
                title="No clients yet"
                description="Add a client to start attaching projects and deliverables to them."
                size="sm"
                action={
                  <Button variant="primary" onClick={openCreate}>
                    <Plus className="size-4" aria-hidden="true" />
                    New client
                  </Button>
                }
              />
            ) : needle && visible.length === 0 ? (
              <EmptyState
                title="No matching clients"
                description={`Nothing matches “${query.trim()}”.`}
                size="sm"
                action={
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {visible.map((client) => {
                  const isPending = pending?.id === client.id;
                  const count = projectCount(client.id);

                  return (
                    <li
                      key={client.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-[14px] font-medium text-ink">
                            {client.name}
                          </span>

                          <StatusBadge status={client.status} />

                          {/* A count is the one thing on the row that says
                              whether this relationship is actually in use. */}
                          <span className="text-[13px] text-ink-subtle tabular-nums">
                            {pluralise(count, "project")}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle">
                          {client.company && (
                            <span className="truncate">{client.company}</span>
                          )}
                          {client.email && (
                            <span className="truncate">{client.email}</span>
                          )}
                          {client.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="size-3.5" aria-hidden="true" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Select
                          aria-label={`Status for ${client.name}`}
                          options={CLIENT_STATUS_OPTIONS}
                          value={client.status}
                          size="sm"
                          fullWidth={false}
                          disabled={isPending}
                          onChange={(value) =>
                            updateStatus(client, value as ClientStatus)
                          }
                          className="w-[124px]"
                        />

                        <Button
                          size="sm"
                          variant="tertiary"
                          disabled={isPending}
                          onClick={() => openEdit(client)}
                          aria-label={`Edit ${client.name}`}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>

                        <Button
                          size="sm"
                          variant="tertiary"
                          disabled={isPending}
                          onClick={() => setRemoveTarget(client)}
                          aria-label={`Delete ${client.name}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Dialog
        open={open}
        onClose={() => {
          if (submitting) return;

          setOpen(false);
        }}
        label={editing ? "Edit client" : "New client"}
        title={editing ? `Edit ${editing.name}` : "New client"}
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
              form="client-form"
              variant="primary"
              loading={submitting}
              disabled={submitting || !form.name.trim()}
            >
              {editing ? "Save changes" : "Create client"}
            </Button>
          </>
        }
      >
        <form
          id="client-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <Input
            id="client-name"
            name="name"
            label="Name"
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
            data-autofocus
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="client-email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />

            <Input
              id="client-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              label="Phone"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="client-company"
              name="company"
              label="Company"
              autoComplete="organization"
              value={form.company}
              onChange={(event) =>
                setForm({ ...form, company: event.target.value })
              }
            />

            <Select
              id="client-status"
              label="Status"
              options={CLIENT_STATUS_OPTIONS}
              value={form.status}
              onChange={(value) =>
                setForm({ ...form, status: value as ClientStatus })
              }
            />
          </div>

          <Input
            id="client-address"
            name="address"
            label="Address"
            autoComplete="street-address"
            value={form.address}
            onChange={(event) =>
              setForm({ ...form, address: event.target.value })
            }
          />

          <Input
            id="client-website"
            name="website"
            type="url"
            label="Website"
            hint="Include https://"
            autoComplete="url"
            value={form.website}
            onChange={(event) =>
              setForm({ ...form, website: event.target.value })
            }
          />

          <Textarea
            id="client-notes"
            name="notes"
            label="Notes"
            description="Brief, preferences, anything worth remembering."
            rows={4}
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
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

export default ClientsPage;