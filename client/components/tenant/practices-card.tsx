"use client";

import { useEffect, useState } from "react";
import { Building2, FolderPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/errors";
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

  useEffect(() => {
    let cancelled = false;

    tenancyApi
      .listTenants()
      .then((data) => {
        if (!cancelled) {
          setTenants(data);
          setLoadError(null);
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
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="motion-enter">
      <CardHeader
        title="Practices"
        description={`${tenants.length} practice${tenants.length === 1 ? "" : "s"} you belong to`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <FolderPlus className="size-4" aria-hidden="true" />
            New Practice
          </Button>
        }
      />
      <CardBody>
        {loading ? (
          <div className="py-8 text-center text-[14px] text-ink-subtle">
            Loading...
          </div>
        ) : loadError && tenants.length === 0 ? (
          <EmptyState
            title="Could not load practices"
            description={loadError}
            tone="error"
            size="sm"
          />
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-4" aria-hidden="true" />}
            title="No practices"
            description="You do not belong to a practice yet."
            size="sm"
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
                  <Badge tone="neutral">{tenant.role}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label="New Practice"
        title="New Practice"
      >
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink" htmlFor="new-tenant">
              Practice name
            </label>
            <Input
              id="new-tenant"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <p className="text-[13px] text-ink-subtle">
            You become the owner. Switch to it from the sidebar afterwards.
          </p>

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
              loading={creating}
              disabled={creating || !name.trim()}
            >
              Create Practice
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}