"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";

import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import Input from "@/components/ui/input";
import Popover from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getRoleLabel } from "@/lib/domain/status";
import { tenancyApi } from "@/actions/tenancy";
import useAuthStore from "@/store/use-auth-store";
import { createTenantSchema } from "@/schema/tenancy.schema";

const menuItemClass =
  "relative flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink-muted transition-colors duration-150 hover:bg-surface-subtle hover:text-ink focus-visible:bg-surface-subtle focus-visible:text-ink focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/**
 * The active practice, and the only place it can be changed.
 *
 * Switching a practice changes the tenant every scoped query runs against, so it
 * is a workspace-level decision and it belongs in the workspace chrome rather
 * than in Settings — where it previously also lived, which meant the same control
 * existed in two places and neither could be the owner.
 *
 * Creating a practice is here for the same reason: you switch to something after
 * you create it, so the two actions belong on one surface.
 */
export default function PracticeSwitcher({
  onSwitch,
  isSwitching,
  className,
}: {
  onSwitch: (tenantId: string) => Promise<void>;
  isSwitching: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const tenants = useAuthStore((state) => state.tenants);
  const activeTenantId = useAuthStore((state) => state.activeTenantId);
  const setTenants = useAuthStore((state) => state.setTenants);

  const active =
    tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0];

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  /*
   * The store is seeded at login, so this list can grow afterwards — a practice
   * created here, or membership granted elsewhere. Leaving the bar stale would
   * mean switching to a practice the switcher no longer offers.
   */
  useEffect(() => {
    let cancelled = false;

    tenancyApi
      .listTenants()
      .then((fresh) => {
        if (!cancelled) setTenants(fresh);
      })
      .catch(() => {
        // A stale list is still usable for switching. Creation reports its own
        // failure, so there is nothing to surface here.
      });

    return () => {
      cancelled = true;
    };
  }, [setTenants]);

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

      setTenants((previous) =>
        previous.some((tenant) => tenant.id === created.id)
          ? previous
          : [...previous, created],
      );

      setOpen(false);
      setName("");

      toast({
        tone: "success",
        title: "Practice created",
        description: `${created.name} — switch to it from here.`,
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
    <>
      <Popover
        label="Switch practice"
        align="start"
        trigger={(triggerProps) => (
          <button
            {...triggerProps}
            type="button"
            className={[
              "flex min-w-0 max-w-56 items-center gap-2 rounded-sm px-2 py-1.5",
              "transition-colors duration-150 hover:bg-surface-subtle",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
              className ?? "",
            ].join(" ")}
          >
            <Building2
              className="size-4 shrink-0 text-ink-subtle"
              aria-hidden="true"
            />

            <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-ink">
              {active?.name ?? (tenants.length === 0 ? "No practice" : "—")}
            </span>

            <ChevronDown
              className="size-3.5 shrink-0 text-ink-subtle"
              aria-hidden="true"
            />
          </button>
        )}
      >
        {(close) => (
          <>
            <p className="px-3 pt-2 pb-1.5 text-[11px] tracking-[0.08em] text-ink-subtle uppercase">
              Practice
            </p>

            {tenants.length === 0 ? (
              <p className="px-3 py-2 text-[13px] text-ink-muted">
                You do not belong to a practice yet.
              </p>
            ) : (
              <div className="pb-1">
                {tenants.map((tenant) => {
                  const isActive = tenant.id === active?.id;

                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      disabled={isSwitching || isActive}
                      onClick={async () => {
                        close();

                        if (!isActive) await onSwitch(tenant.id);
                      }}
                      className={[
                        menuItemClass,
                        isActive ? "bg-surface-subtle" : "",
                        "disabled:cursor-default disabled:opacity-100",
                      ].join(" ")}
                    >
                      {/* Weight and the check glyph, not colour, mark the current practice. */}
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-0.5 bg-ink"
                        />
                      )}

                      <Check
                        aria-hidden="true"
                        className={`size-3.5 shrink-0 ${isActive ? "text-ink" : "text-transparent"}`}
                      />

                      <span
                        className={`min-w-0 flex-1 truncate ${isActive ? "font-medium text-ink" : ""}`}
                      >
                        {tenant.name}
                      </span>

                      <span className="shrink-0 text-[12px] text-ink-subtle">
                        {getRoleLabel(tenant.role)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-line-muted pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  setOpen(true);
                  router.refresh();
                }}
                className={menuItemClass}
              >
                <Plus className="size-3.5 shrink-0" aria-hidden="true" />
                New practice
              </button>
            </div>
          </>
        )}
      </Popover>

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
            You become its owner. It will appear in the switcher, ready for you to
            move into.
          </p>

          {formError && (
            <p role="alert" className="text-[13px] text-danger">
              {formError}
            </p>
          )}
        </form>
      </Dialog>
    </>
  );
}