"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import { FormSection } from "@/components/workspace/form-section";
import { getApiErrorMessage } from "@/lib/api/errors";
import { toStatusOptions } from "@/lib/domain/status";
import {
  CLIENT_STATUSES,
  clientsService,
  type Client,
  type ClientStatus,
  type CreateClientInput,
  type UpdateClientInput,
} from "@/services/clients.service";

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

const clientToForm = (client: Client): FormState => ({
  name: client.name,
  email: client.email ?? "",
  phone: client.phone ?? "",
  company: client.company ?? "",
  address: client.address ?? "",
  website: client.website ?? "",
  notes: client.notes ?? "",
  status: client.status,
});

/**
 * Blank optional fields are dropped rather than sent: the server's
 * `@IsOptional()` skips `null` and `undefined` but not `""`, so an empty string
 * would fail validation on a field the user simply left alone.
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
 * only the keys it receives, so dropping the key would leave the stored value in
 * place while the dialog closed as though it had worked — a silent lie about the
 * user's own data. Every optional column is nullable and the DTO's
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

interface ClientFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Omit to create; pass a client to edit it. */
  client?: Client | null;
  /** Called with the created or updated client. */
  onSaved: (client: Client) => void;
}

/**
 * Create or edit a client.
 *
 * Owned here rather than duplicated inside the list and detail pages, because a
 * client can now be edited from either and the payloads above are not something
 * that should exist twice.
 */
export function ClientFormDialog({
  open,
  onClose,
  client = null,
  onSaved,
}: ClientFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Seeded when the dialog opens and re-seeded whenever the target client
   * changes, so an edit never shows the previous record's values. The same
   * "derive during render" pattern the project form uses, rather than an effect
   * that would trigger a second render pass.
   */
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const seedKey = client ? client.id : "new";

  if (open && seededFor !== seedKey) {
    setSeededFor(seedKey);
    setForm(client ? clientToForm(client) : emptyForm);
    setError(null);
  }

  const close = () => {
    if (submitting) return;

    setSeededFor(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError(null);

    if (!form.name.trim()) {
      setError("Enter a name.");

      return;
    }

    try {
      setSubmitting(true);

      const saved = client
        ? await clientsService.update(client.id, editPayload(form))
        : await clientsService.create(createPayload(form));

      setSeededFor(null);
      onSaved(saved);
      onClose();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      label={client ? "Edit client" : "New client"}
      title={client ? `Edit ${client.name}` : "New client"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="client-form"
            variant="primary"
            loading={submitting}
            disabled={submitting || !form.name.trim()}
          >
            {client ? "Save changes" : "Create client"}
          </Button>
        </>
      }
    >
      <form
        id="client-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <FormSection title="Identity">
          <Input
            id="client-name"
            name="name"
            label="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            data-autofocus
            required
          />

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
        </FormSection>

        <FormSection
          title="Contact"
          description="Only what you actually need to reach them on."
        >
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
        </FormSection>

        <FormSection title="Notes">
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
        </FormSection>

        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}

export default ClientFormDialog;
