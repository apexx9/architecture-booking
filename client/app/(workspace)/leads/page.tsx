"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  Check,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import SearchField from "@/components/ui/search-field";
import Skeleton from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import DataView from "@/components/workspace/data-view";
import { ErrorState, InlineError } from "@/components/workspace/error-state";
import { FilterChips } from "@/components/workspace/filter-chips";
import PageHeader from "@/components/workspace/page-header";
import PageToolbar from "@/components/workspace/page-toolbar";
import { getApiErrorMessage } from "@/lib/api/errors";
import { pluralise } from "@/lib/format";
import {
  getLeadSourceLabel,
  getProjectTypeLabel,
  toOptions,
  toStatusOptions,
} from "@/lib/domain/status";
import { useToast } from "@/components/ui/toast";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  PROJECT_TYPES,
  leadsService,
  type CreateLeadInput,
  type Lead,
  type LeadSource,
  type LeadStatus,
  type ProjectType,
  type UpdateLeadInput,
} from "@/services/leads.service";
import { clientsService, type Client } from "@/services/clients.service";

const LEAD_STATUS_OPTIONS = toStatusOptions(LEAD_STATUSES);
const LEAD_SOURCE_OPTIONS = toOptions(LEAD_SOURCES, getLeadSourceLabel);
const PROJECT_TYPE_OPTIONS = toOptions(PROJECT_TYPES, getProjectTypeLabel);

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "",
  projectType: "",
  estimatedBudget: "",
  location: "",
  notes: "",
};

type FormState = typeof emptyForm;

/** Free-text fields a create may omit and an edit may deliberately clear. */
const OPTIONAL_TEXT_FIELDS = [
  "email",
  "phone",
  "company",
  "location",
  "notes",
] as const;

/**
 * Which control in a row is waiting on the server.
 *
 * A single `busyId` could not say *which* action was in flight, so changing a
 * lead's status lit the spinner on its Convert button and implied a promotion
 * that was not happening. Keying on the action as well as the row also stops two
 * overlapping row operations from clearing each other's pending state.
 */
type PendingAction = "status" | "convert" | "remove";

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nameLookupFailed, setNameLookupFailed] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    id: string;
    action: PendingAction;
  } | null>(null);

  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Lead | null>(null);

  const { toast } = useToast();

  const converting = pending?.action === "convert";
  const removing = pending?.action === "remove";

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [leadData, clientData] = await Promise.all([
        leadsService.getAll(),
        // A client-list failure must not blank the lead list, but it does mean
        // converted leads cannot be named — so it is reported rather than
        // silently degrading every lineage reference to a placeholder.
        clientsService.getAll().catch(() => {
          setNameLookupFailed(true);

          return [] as Client[];
        }),
      ]);

      setLeads(leadData);
      setClients(clientData);
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

  /**
   * The client a converted lead became, or `undefined` when it is not in the
   * loaded set.
   *
   * Returning nothing rather than a placeholder string matters: the previous
   * fallback rendered the literal word "Client", which read as a person's name.
   */
  const convertedClient = (lead: Lead) =>
    lead.convertedToClientId
      ? clients.find((client) => client.id === lead.convertedToClientId)
      : undefined;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({
      name: lead.name,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      company: lead.company ?? "",
      source: lead.source ?? "",
      projectType: lead.projectType ?? "",
      estimatedBudget: lead.estimatedBudget ?? "",
      location: lead.location ?? "",
      notes: lead.notes ?? "",
    });
    setFormError(null);
    setActionError(null);
    setOpen(true);
  };

  /**
   * Blank optional fields are dropped rather than sent.
   *
   * This is a correctness requirement, not a nicety. The server validates with
   * `@IsOptional() @IsEmail()`, and class-validator's `@IsOptional()` skips
   * validation only for `null`/`undefined` — never for `""`. Sending an empty
   * email therefore failed with a 400, which made every lead created without one
   * impossible to save.
   */
  const createPayload = (state: FormState): CreateLeadInput => {
    const payload: CreateLeadInput = { name: state.name.trim() };

    for (const key of OPTIONAL_TEXT_FIELDS) {
      const value = state[key].trim();

      if (value) {
        payload[key] = value;
      }
    }

    if (state.source) {
      payload.source = state.source as LeadSource;
    }

    if (state.projectType) {
      payload.projectType = state.projectType as ProjectType;
    }

    if (state.estimatedBudget.trim()) {
      payload.estimatedBudget = state.estimatedBudget.trim();
    }

    return payload;
  };

  /**
   * On edit, an emptied field is a deliberate clear — and PATCH only writes the
   * keys it receives, so a dropped key would leave the stored value in place
   * while the dialog closed as if it had worked. Those fields are therefore sent
   * as `null`, which the DTO's `@IsOptional()` accepts and the nullable column
   * stores.
   */
  const editPayload = (state: FormState): UpdateLeadInput => {
    const payload: UpdateLeadInput = { name: state.name.trim() };

    for (const key of OPTIONAL_TEXT_FIELDS) {
      payload[key] = state[key].trim() || null;
    }

    if (state.source) {
      payload.source = state.source as LeadSource;
    }

    if (state.projectType) {
      payload.projectType = state.projectType as ProjectType;
    }

    if (state.estimatedBudget.trim()) {
      payload.estimatedBudget = state.estimatedBudget.trim();
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
        const updated = await leadsService.update(
          editing.id,
          editPayload(form),
        );

        setLeads((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        setOpen(false);
        toast({
          tone: "success",
          title: "Lead updated",
          description: updated.name,
        });
      } else {
        const created = await leadsService.create(createPayload(form));

        setLeads((prev) => [created, ...prev]);
        setOpen(false);
        toast({
          tone: "success",
          title: "Lead created",
          description: created.name,
        });
      }
    } catch (error) {
      // Inside the dialog on purpose: a native <dialog> puts the rest of the
      // page in the top layer, so an error rendered outside it is invisible.
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (lead: Lead, status: LeadStatus) => {
    const previous = lead;

    setActionError(null);
    setLeads((prev) =>
      prev.map((item) => (item.id === lead.id ? { ...item, status } : item)),
    );

    try {
      setPending({ id: lead.id, action: "status" });

      const updated = await leadsService.update(lead.id, { status });

      setLeads((prev) =>
        prev.map((item) => (item.id === lead.id ? updated : item)),
      );
    } catch (error) {
      setLeads((prev) =>
        prev.map((item) => (item.id === lead.id ? previous : item)),
      );

      const message = getApiErrorMessage(error);

      setActionError(message);
      toast({
        tone: "error",
        title: "Could not change status",
        description: message,
      });
    } finally {
      setPending(null);
    }
  };

  /**
   * The server creates the client, stamps the lead and moves it to WON in one
   * transaction, so both sides come back and the row is replaced rather than
   * appended. It cannot be undone from the UI, which is why it is confirmed
   * first.
   */
  const convert = async (lead: Lead) => {
    setActionError(null);

    try {
      setPending({ id: lead.id, action: "convert" });

      const { client, lead: updatedLead } = await leadsService.convertToClient(
        lead.id,
        {},
      );

      setClients((prev) =>
        prev.some((item) => item.id === client.id) ? prev : [client, ...prev],
      );
      setLeads((prev) =>
        prev.map((item) => (item.id === updatedLead.id ? updatedLead : item)),
      );
      setConvertTarget(null);
      toast({
        tone: "success",
        title: "Converted to client",
        description: `${lead.name} is now ${client.name}.`,
      });
    } catch (error) {
      const message = getApiErrorMessage(error);

      setActionError(message);
      setConvertTarget(null);
      toast({
        tone: "error",
        title: "Could not convert lead",
        description: message,
      });
    } finally {
      setPending(null);
    }
  };

  const remove = async (lead: Lead) => {
    setActionError(null);

    try {
      setPending({ id: lead.id, action: "remove" });

      await leadsService.delete(lead.id);

      setLeads((prev) => prev.filter((item) => item.id !== lead.id));
      setRemoveTarget(null);
      toast({ tone: "success", title: "Lead deleted", description: lead.name });
    } catch (error) {
      const message = getApiErrorMessage(error);

      setActionError(message);
      setRemoveTarget(null);
      toast({
        tone: "error",
        title: "Could not delete lead",
        description: message,
      });
    } finally {
      setPending(null);
    }
  };

  /*
   * Filtering runs over the list the page has already loaded. There is no search
   * endpoint, so this narrows what is on screen rather than querying the server.
   */
  const needle = query.trim().toLowerCase();

  const visible = leads.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (!needle) return true;

    return [lead.name, lead.email, lead.company, lead.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const hasConvertedLead = visible.some(
    (lead) => lead.convertedToClientId !== null,
  );

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
        <PageHeader
          title="Leads"
          description="Every enquiry you are working, from first contact to signed-off client."
          actions={
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              New lead
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
          <LeadsSkeleton />
        ) : loadError && leads.length === 0 ? (
          <ErrorState
            title="Couldn't load leads"
            description="We couldn't retrieve your enquiries right now."
            detail={loadError}
            onRetry={load}
            className="border-t border-line"
          />
        ) : leads.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Users className="size-4" aria-hidden="true" />}
              title="No leads yet"
              description="A lead is an enquiry you are still working. Record it here, work it to a decision, then convert it into a client when it is signed off."
              action={
                <Button onClick={openCreate}>
                  <Plus className="size-4" aria-hidden="true" />
                  New lead
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
                  ? `${visible.length} of ${leads.length}`
                  : pluralise(leads.length, "lead")
              }
              filters={
                <FilterChips
                  label="Filter by status"
                  allLabel="All statuses"
                  options={LEAD_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                    count: leads.filter((lead) => lead.status === option.value)
                      .length,
                  }))}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              }
            >
              <SearchField
                label="Search leads"
                placeholder="Name, email, company or location"
                value={query}
                onChange={setQuery}
              />
            </PageToolbar>

            {nameLookupFailed && hasConvertedLead && (
              <p className="mt-4 text-[13px] text-ink-subtle">
                Client details could not be loaded, so converted leads cannot be
                named.
              </p>
            )}

            <div className="mt-6">
              {visible.length === 0 ? (
                <EmptyState
                  title="Nothing matches"
                  description="No lead matches the current search and filter."
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
                <DataView<Lead>
                  label="Leads"
                  rows={visible}
                  rowKey={(lead) => lead.id}
                  primary={(lead) => lead.name}
                  secondary={(lead) =>
                    [lead.company, lead.location].filter(Boolean).join(" · ") ||
                    "No company or location recorded"
                  }
                  meta={(lead) => (
                    <>
                      <StatusBadge status={lead.status} />

                      {lead.source && (
                        <Badge tone="neutral">
                          {getLeadSourceLabel(lead.source)}
                        </Badge>
                      )}

                      {lead.convertedToClientId && (
                        <span className="inline-flex items-center gap-1 text-[12px] text-ink">
                          <Check
                            className="size-3.5 text-positive"
                            aria-hidden="true"
                          />
                          {convertedClient(lead)
                            ? "Converted"
                            : "Converted to a client"}
                        </span>
                      )}
                    </>
                  )}
                  actions={(lead) => {
                    const isPending = pending?.id === lead.id;

                    return (
                      <>
                        <Select
                          aria-label={`Status for ${lead.name}`}
                          options={LEAD_STATUS_OPTIONS}
                          value={lead.status}
                          size="sm"
                          fullWidth={false}
                          disabled={isPending}
                          onChange={(value) =>
                            updateStatus(lead, value as LeadStatus)
                          }
                          className="w-[136px]"
                        />

                        {/*
                            Conversion is gated purely on whether it has already
                            happened. Gating it on a "closed" status set was a
                            rule invented in this layer, and it contradicted the
                            server: conversion itself moves the lead to WON, so
                            every legitimately converted lead was treated as
                            unconvertible.
                          */}
                        {!lead.convertedToClientId && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={pending?.action === "convert" && isPending}
                            disabled={isPending}
                            onClick={() => setConvertTarget(lead)}
                          >
                            <ArrowRightLeft
                              className="size-4"
                              aria-hidden="true"
                            />
                            Convert
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="tertiary"
                          disabled={isPending}
                          onClick={() => openEdit(lead)}
                          aria-label={`Edit ${lead.name}`}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>

                        <Button
                          size="sm"
                          variant="tertiary"
                          disabled={isPending}
                          onClick={() => setRemoveTarget(lead)}
                          aria-label={`Delete ${lead.name}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </>
                    );
                  }}
                  columns={[
                    { key: "name", header: "Lead", cell: (lead) => lead.name },
                    {
                      key: "status",
                      header: "Status",
                      width: "w-28",
                      cell: (lead) => <StatusBadge status={lead.status} />,
                    },
                    {
                      key: "source",
                      header: "Source",
                      width: "w-32",
                      hideBelowLg: true,
                      cell: (lead) =>
                        lead.source ? (
                          <Badge tone="neutral">
                            {getLeadSourceLabel(lead.source)}
                          </Badge>
                        ) : (
                          "—"
                        ),
                    },
                    {
                      key: "contact",
                      header: "Contact",
                      hideBelowLg: true,
                      cell: (lead) => lead.email ?? lead.phone ?? "—",
                    },
                    {
                      key: "location",
                      header: "Location",
                      hideBelowMd: true,
                      cell: (lead) => lead.location ?? "—",
                    },
                    {
                      key: "converted",
                      header: "Converted",
                      hideBelowMd: true,
                      cell: (lead) => {
                        if (!lead.convertedToClientId) return "—";

                        const converted = convertedClient(lead);

                        return converted ? (
                          <Link
                            href={`/clients/${converted.id}`}
                            className="inline-flex items-center gap-1 rounded-sm text-ink underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                          >
                            <Check
                              className="size-3.5 text-positive"
                              aria-hidden="true"
                            />
                            {converted.name}
                          </Link>
                        ) : (
                          <span className="text-ink-subtle">
                            Client removed
                          </span>
                        );
                      },
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
        label={editing ? "Edit lead" : "New lead"}
        title={editing ? `Edit ${editing.name}` : "New lead"}
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
              form="lead-form"
              variant="primary"
              loading={submitting}
              disabled={submitting || !form.name.trim()}
            >
              {editing ? "Save changes" : "Create lead"}
            </Button>
          </>
        }
      >
        <form
          id="lead-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <Input
            id="lead-name"
            name="name"
            label="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            data-autofocus
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="lead-email"
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
              id="lead-phone"
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
              id="lead-company"
              name="company"
              label="Company"
              autoComplete="organization"
              value={form.company}
              onChange={(event) =>
                setForm({ ...form, company: event.target.value })
              }
            />

            <Input
              id="lead-location"
              name="location"
              label="Location"
              hint="Where the project would be built"
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="lead-source"
              label="Source"
              placeholder="Not set"
              options={LEAD_SOURCE_OPTIONS}
              value={form.source}
              onChange={(value) => setForm({ ...form, source: value })}
            />

            <Select
              id="lead-project-type"
              label="Project type"
              placeholder="Not set"
              options={PROJECT_TYPE_OPTIONS}
              value={form.projectType}
              onChange={(value) => setForm({ ...form, projectType: value })}
            />
          </div>

          <Input
            id="lead-budget"
            name="estimatedBudget"
            label="Estimated budget"
            hint="A figure, without a currency symbol"
            inputMode="decimal"
            value={form.estimatedBudget}
            onChange={(event) =>
              setForm({ ...form, estimatedBudget: event.target.value })
            }
          />

          <Textarea
            id="lead-notes"
            name="notes"
            label="Notes"
            description="What the client asked for, and anything worth remembering."
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
        open={convertTarget !== null}
        onClose={() => setConvertTarget(null)}
        label="Convert lead to client"
        title="Convert to a client"
        hideClose
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConvertTarget(null)}
              disabled={converting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={converting}
              onClick={() => convertTarget && convert(convertTarget)}
            >
              Convert lead
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px] leading-relaxed text-ink-muted">
          <p>
            <span className="font-medium text-ink">{convertTarget?.name}</span>{" "}
            becomes a client on this practice.
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>A new client record is created from this lead.</li>
            <li>The lead moves to Won and can no longer be converted.</li>
            <li>
              Only name, email, phone and company carry over — the rest stays on
              the lead.
            </li>
          </ul>
        </div>
      </Dialog>

      <Dialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        label="Delete lead"
        title="Delete this lead?"
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
              Delete lead
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">{removeTarget?.name}</span>{" "}
          will be permanently deleted. This cannot be undone.
        </p>
      </Dialog>
    </>
  );
};

/**
 * Mirrors the settled page — toolbar rule, then a table — so the transition
 * does not reflow.
 */
const LeadsSkeleton = () => (
  <div className="mt-6" aria-busy="true">
    <span className="sr-only">Loading leads…</span>

    <Skeleton className="h-14 w-full" />
    <Skeleton className="mt-6 h-72 w-full" />
  </div>
);

export default LeadsPage;
