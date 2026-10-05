"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Plus, Trash2, Users } from "lucide-react";

import Card, { CardBody, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LEAD_STATUSES, getStatusPresentation, toStatusOptions } from "@/lib/domain/status";
import { getApiErrorMessage } from "@/lib/api/errors";
import { leadsService, type Lead } from "@/services/leads.service";
import { clientsService, type Client } from "@/services/clients.service";

const LEAD_STATUS_OPTIONS = toStatusOptions(LEAD_STATUSES);

/** Statuses where the lead is closed and converting it no longer makes sense. */
const CLOSED_LEAD_STATUSES: Lead["status"][] = ["WON", "LOST"];

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const clientName = (clientId: string) =>
    clients.find((client) => client.id === clientId)?.name ?? "Client";

  useEffect(() => {
    let cancelled = false;

    // Converted leads reference a client id, so the name lookup needs the
    // client list too. A client-list failure must not blank the lead list.
    Promise.all([leadsService.getAll(), clientsService.getAll().catch(() => [])])
      .then(([leadData, clientData]) => {
        if (cancelled) {
          return;
        }

        setLeads(leadData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setActionError(null);

    try {
      setSubmitting(true);
      const created = await leadsService.create(form);
      setLeads((prev) => [created, ...prev]);
      setOpen(false);
      setForm({ name: "", email: "", phone: "", company: "" });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (lead: Lead, status: Lead["status"]) => {
    const previous = lead;

    setActionError(null);
    setLeads((prev) =>
      prev.map((item) => (item.id === lead.id ? { ...item, status } : item)),
    );

    try {
      setBusyId(lead.id);
      const updated = await leadsService.update(lead.id, { status });

      setLeads((prev) =>
        prev.map((item) => (item.id === lead.id ? updated : item)),
      );
    } catch (err) {
      setLeads((prev) =>
        prev.map((item) => (item.id === lead.id ? previous : item)),
      );
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  /**
   * The server creates the client, stamps the lead and moves it to WON in one
   * transaction, so both sides come back and the row is replaced rather than
   * appended.
   */
  const convert = async (lead: Lead) => {
    setActionError(null);

    try {
      setBusyId(lead.id);

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
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (lead: Lead) => {
    setActionError(null);
    setBusyId(lead.id);

    try {
      await leadsService.delete(lead.id);
      setLeads((prev) => prev.filter((item) => item.id !== lead.id));
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">
      <header className="motion-enter flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-light text-ink">Leads</h1>
          <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-muted">
            Manage your incoming leads.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          New Lead
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
        <CardHeader title="All Leads" description={`${leads.length} leads`} />
        <CardBody>
          {loading ? (
            <div className="py-8 text-center text-[14px] text-ink-subtle">Loading...</div>
          ) : loadError && leads.length === 0 ? (
            <EmptyState
              title="Could not load leads"
              description={loadError}
              tone="error"
              size="sm"
            />
          ) : leads.length === 0 ? (
            <EmptyState
              icon={<Users className="size-4" aria-hidden="true" />}
              title="No leads yet"
              description="Leads will appear here when they are created."
              size="sm"
            />
          ) : (
            <ul className="space-y-2">
              {leads.map((lead) => {
                const presentation = getStatusPresentation(lead.status);
                const isBusy = busyId === lead.id;
                const isClosed = CLOSED_LEAD_STATUSES.includes(lead.status);

                return (
                  <li
                    key={lead.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-medium text-ink">
                          {lead.name}
                        </span>
                        <Badge tone={presentation.tone} dot>
                          {presentation.label}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-subtle">
                        {lead.email && <span>{lead.email}</span>}
                        {lead.company && <span>{lead.company}</span>}
                        {lead.convertedToClientId && (
                          <span>Converted to {clientName(lead.convertedToClientId)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Select
                        aria-label={`Status for ${lead.name}`}
                        options={LEAD_STATUS_OPTIONS}
                        value={lead.status}
                        size="sm"
                        fullWidth={false}
                        disabled={isBusy}
                        onChange={(value) =>
                          updateStatus(lead, value as Lead["status"])
                        }
                        className="w-[152px]"
                      />

                      {!lead.convertedToClientId && !isClosed && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={isBusy}
                          disabled={isBusy}
                          onClick={() => convert(lead)}
                        >
                          <ArrowRightLeft className="size-4" aria-hidden="true" />
                          Convert
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="tertiary"
                        disabled={isBusy}
                        onClick={() => remove(lead)}
                        aria-label={`Delete ${lead.name}`}
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
      <Dialog open={open} onClose={() => setOpen(false)} label="New Lead" title="New Lead">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink">Email</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink">Phone</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink">Company</label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting || !form.name}>
              Create Lead
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
};

export default LeadsPage;
