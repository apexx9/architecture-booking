"use client";

import { useEffect, useState } from "react";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getRoleLabel } from "@/lib/domain/status";
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

  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await tenancyApi.getCurrentTenant();

      setTenant(data);
      setName(data.name);
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
      toast({
        tone: "success",
        title: "Practice renamed",
        description: parsed.data.name,
      });
    } catch (error) {
      const description = getApiErrorMessage(error);

      setActionError(description);
      toast({ tone: "error", title: "Could not rename practice", description });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="motion-enter">
      <CardHeader title="Practice" description={tenant?.name ?? undefined} />
      <CardBody>
        {loading ? (
          <div
            role="status"
            className="py-4 text-center text-[14px] text-ink-subtle"
          >
            Loading…
          </div>
        ) : loadError || !tenant ? (
          <EmptyState
            title="Could not load your practice"
            description={loadError ?? undefined}
            tone="error"
            size="sm"
            action={
              <Button variant="secondary" onClick={load}>
                Try again
              </Button>
            }
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
                  variant="primary"
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

            {/* The raw enum value used to be rendered here. */}
            <Badge tone={tenant.role === "OWNER" ? "info" : "neutral"} dot>
              Your role: {getRoleLabel(tenant.role)}
            </Badge>
          </form>
        )}
      </CardBody>
    </Card>
  );
}