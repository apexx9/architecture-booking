"use client";

import { useEffect, useState } from "react";
import { Building2, FolderPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api/errors";
import { pluralise } from "@/lib/format";
import { getRoleLabel } from "@/lib/domain/status";
import { tenancyApi, type TenantSummary } from "@/actions/tenancy";
import { createTenantSchema } from "@/schema/tenancy.schema";

/**
 * Every practice the signed-in user belongs to, with the current one marked.
 *
 * Creating a practice does not switch to it: the server creates it as a second
 * membership and the switcher in the sidebar is what changes the active
 * context, so nothing here reloads the workspace.
 */
export default function PracticesCard() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setTenants(await tenancyApi.listTenants());
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

    tenancyApi
      .getCurrentTenant()
      .then((current) => {
        if (!cancelled) {
          setCurrentId(current.id);
        }
      })
      .catch(() => {
        // The list alone is still worth showing without the "current" marker.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    const parsed = createTenantSchema.safeParse({ name });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Enter a valid name.");

      return;
    }

    try {
      setCreating(true);

      const created = await tenancyApi.createTenant(parsed.data);

      setTenants((prev) => [...prev, created]);
      setOpen(false);
      setName("");
      toast({
        tone: "success",
        title: "Practice created",
        description: created.name,
      });
    } catch (error) {
      const description = getApiErrorMessage(error);

      setFormError(description);
      toast({ tone: "error", title: "Could not create practice", description });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="motion-enter">
      <CardHeader
        title="Practices"
        description={
          loading ? "Loading…" : `${pluralise(tenants.length, "practice")} you belong to`
        }
        action={
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <FolderPlus className="size-4" aria-hidden="true" />
            New practice
          </Button>
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
        ) : loadError && tenants.length === 0 ? (
          <EmptyState
            title="Could not load practices"
            description={loadError}
            tone="error"
            size="sm"
            action={
              <Button variant="secondary" onClick={load}>
                Try again
              </Button>
            }
          />
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-4" aria-hidden="true" />}
            title="No practices"
            description="You do not belong to a practice yet."
            size="sm"
            action={
              <Button variant="primary" onClick={() => setOpen(true)} size="sm">
                <FolderPlus className="size-4" aria-hidden="true" />
                New practice
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {tenants.map((tenant) => (
              <li
                key={tenant.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line p-3"
              >
                <span className="text-[14px] text-ink">{tenant.name}</span>

                <span className="flex items-center gap-2">
                  {tenant.id === currentId && (
                    <Badge tone="positive" dot>
                      Current
                    </Badge>
                  )}
                  <Badge tone="neutral" dot={false}>
                    {getRoleLabel(tenant.role)}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Dialog
        open={open}
        onClose={() => {
          if (creating) return;

          setOpen(false);
        }}
        label="New practice"
        title="New practice"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-practice-form"
              variant="primary"
              loading={creating}
              disabled={creating || !name.trim()}
            >
              Create practice
            </Button>
          </>
        }
      >
        <form
          id="new-practice-form"
          onSubmit={create}
          className="space-y-4"
          noValidate
        >
          <Input
            id="new-tenant"
            name="name"
            label="Practice name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            data-autofocus
            required
          />

          <p className="text-[13px] text-ink-subtle">
            You become the owner. Switch to it from the sidebar afterwards.
          </p>

          {formError && (
            <p role="alert" className="text-[13px] text-danger">
              {formError}
            </p>
          )}
        </form>
      </Dialog>
    </Card>
  );
}