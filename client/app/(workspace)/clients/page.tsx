"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  clientsService,
  type Client,
  type ClientStatus,
  type CreateClientInput,
} from "@/services/clients.service";

const CLIENT_STATUSES: ClientStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];

const STATUS_TONE = {
  ACTIVE: "positive",
  INACTIVE: "neutral",
  ARCHIVED: "neutral",
} as const satisfies Record<ClientStatus, "positive" | "neutral">;

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

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  /** When set, the dialog edits this client instead of creating a new one. */
  const [editing, setEditing] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    clientsService
      .getAll()
      .then((data) => {
        if (!cancelled) {
          setClients(data);
        }
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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
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
    setOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    /*
     * Empty optional strings are dropped rather than sent: an omitted field
     * means "leave alone" on PATCH, whereas "" would blank the stored value.
     * `name` is required by the schema so it is always present.
     */
    const optional = (
      key: Exclude<keyof FormState, "name" | "status">,
    ): string | undefined => {
      const value = form[key].trim();

      return value === "" ? undefined : value;
    };

    const payload: CreateClientInput = {
      name: form.name.trim(),
      status: form.status,
    };

    const optionalValues = {
      email: optional("email"),
      phone: optional("phone"),
      company: optional("company"),
      address: optional("address"),
      website: optional("website"),
      notes: optional("notes"),
    };

    for (const [key, value] of Object.entries(optionalValues)) {
      if (value !== undefined) {
        Object.assign(payload, { [key]: value });
      }
    }

    try {
      setSubmitting(true);

      if (editing) {
        const updated = await clientsService.update(editing.id, payload);

        setClients((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        const created = await clientsService.create(payload);

        setClients((prev) => [created, ...prev]);
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

  const updateStatus = async (client: Client, status: ClientStatus) => {
    const previous = client;

    setActionError(null);
    setClients((prev) =>
      prev.map((item) => (item.id === client.id ? { ...item, status } : item)),
    );

    try {
      setBusyId(client.id);

      const updated = await clientsService.update(client.id, { status });

      setClients((prev) =>
        prev.map((item) => (item.id === client.id ? updated : item)),
      );
    } catch (error) {
      setClients((prev) =>
        prev.map((item) => (item.id === client.id ? previous : item)),
      );
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (client: Client) => {
    setActionError(null);
    setBusyId(client.id);

    try {
      await clientsService.delete(client.id);
      setClients((prev) => prev.filter((item) => item.id !== client.id));
    } catch (error) {
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
            Clients
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
            Everyone you have an active engagement with.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          New Client
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
          title="All Clients"
          description={`${clients.length} clients`}
        />
        <CardBody>
          {loading ? (
            <div className="py-8 text-center text-[14px] text-ink-subtle">
              Loading...
            </div>
          ) : loadError && clients.length === 0 ? (
            <EmptyState
              title="Could not load clients"
              description={loadError}
              tone="error"
              size="sm"
            />
          ) : clients.length === 0 ? (
            <EmptyState
              icon={<Building2 className="size-4" aria-hidden="true" />}
              title="No clients yet"
              description="Clients will appear here when they are added."
              size="sm"
            />
          ) : (
            <ul className="space-y-2">
              {clients.map((client) => {
                const isBusy = busyId === client.id;

                return (
                  <li
                    key={client.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-medium text-ink">
                          {client.name}
                        </span>
                        <Badge tone={STATUS_TONE[client.status]} dot>
                          {client.status.charAt(0) +
                            client.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle">
                        {client.email && <span>{client.email}</span>}
                        {client.phone && <span>{client.phone}</span>}
                        {client.company && <span>{client.company}</span>}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <label
                        className="sr-only"
                        htmlFor={`client-status-${client.id}`}
                      >
                        Status for {client.name}
                      </label>
                      <select
                        id={`client-status-${client.id}`}
                        value={client.status}
                        disabled={isBusy}
                        onChange={(event) =>
                          updateStatus(
                            client,
                            event.target.value as ClientStatus,
                          )
                        }
                        className="h-8 rounded-sm border border-line bg-surface px-2 text-[12px] text-ink disabled:opacity-50"
                      >
                        {CLIENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>

                      <Button
                        size="sm"
                        variant="tertiary"
                        disabled={isBusy}
                        onClick={() => openEdit(client)}
                        aria-label={`Edit ${client.name}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>

                      <Button
                        size="sm"
                        variant="tertiary"
                        disabled={isBusy}
                        onClick={() => remove(client)}
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label={editing ? "Edit Client" : "New Client"}
        title={editing ? `Edit ${editing.name}` : "New Client"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink" htmlFor="client-name">
              Name
            </label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm text-ink"
                htmlFor="client-email"
              >
                Email
              </label>
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-ink"
                htmlFor="client-phone"
              >
                Phone
              </label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm text-ink"
                htmlFor="client-company"
              >
                Company
              </label>
              <Input
                id="client-company"
                value={form.company}
                onChange={(event) =>
                  setForm({ ...form, company: event.target.value })
                }
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm text-ink"
                htmlFor="client-status"
              >
                Status
              </label>
              <select
                id="client-status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as ClientStatus,
                  })
                }
                className="h-10 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink"
              >
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="client-address"
            >
              Address
            </label>
            <Input
              id="client-address"
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="client-website"
            >
              Website
            </label>
            <Input
              id="client-website"
              type="url"
              value={form.website}
              onChange={(event) =>
                setForm({ ...form, website: event.target.value })
              }
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="client-notes"
            >
              Notes
            </label>
            <Input
              id="client-notes"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
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
              {editing ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default ClientsPage;