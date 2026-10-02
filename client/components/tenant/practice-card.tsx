"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/errors";
import { tenancyApi, type CurrentTenant } from "@/actions/tenancy";
import { updateTenantSchema } from "@/schema/tenancy.schema";

/** TENANT_MEMBERS_MANAGE and tenant updates are OWNER/ADMIN only. */
const canManage = (role: CurrentTenant["role"] | undefined) =>
  role === "OWNER" || role === "ADMIN";

/**
 * Renames the practice the session is currently scoped to.
 *
 * The tenant name arrives from `GET /tenants/current`, so this card owns both
 * the fetch and the editable copy: an unmounted card must not leave the rename
 * input showing a stale name from a previous tenant switch.
 */
export default function PracticeCard() {
  const [tenant, setTenant] = useState<CurrentTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    tenancyApi
      .getCurrentTenant()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setTenant(data);
        setName(data.name);
        setLoadError(null);
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

  const save = async (event: React.FormEvent) => {
    event.preventDefault();

    setNameError(null);

    const parsed = updateTenantSchema.safeParse({ name });

    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? "Enter a valid name.");

      return;
    }

    try {
      setSaving(true);
      setActionError(null);

      await tenancyApi.renameTenant(parsed.data);

      setTenant((prev) => (prev ? { ...prev, name: parsed.data.name } : prev));
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="motion-enter">
      <CardHeader title="Practice" description={tenant?.name ?? undefined} />
      <CardBody>
        {loading ? (
          <div className="py-4 text-center text-[14px] text-ink-subtle">
            Loading...
          </div>
        ) : loadError || !tenant ? (
          <EmptyState
            title="Could not load your practice"
            description={loadError ?? undefined}
            tone="error"
            size="sm"
          />
        ) : (
          <form onSubmit={save} className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1">
                <label
                  className="mb-1 block text-sm text-ink"
                  htmlFor="practice-name"
                >
                  Practice name
                </label>
                <Input
                  id="practice-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={!canManage(tenant.role)}
                  required
                />
              </div>

              {canManage(tenant.role) && (
                <Button
                  type="submit"
                  loading={saving}
                  disabled={saving || name === tenant.name}
                >
                  Save
                </Button>
              )}
            </div>

            {nameError && (
              <p role="alert" className="text-[13px] text-danger">
                {nameError}
              </p>
            )}

            {actionError && (
              <p role="alert" className="text-[13px] text-danger">
                {actionError}
              </p>
            )}

            {!canManage(tenant.role) && (
              <p className="text-[13px] text-ink-subtle">
                Only an owner or admin can rename this practice.
              </p>
            )}

            <Badge tone={tenant.role === "OWNER" ? "info" : "neutral"} dot>
              Your role: {tenant.role}
            </Badge>
          </form>
        )}
      </CardBody>
    </Card>
  );
}