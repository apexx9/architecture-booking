"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ErrorState } from "@/components/workspace/error-state";
import { Section, SectionHeader } from "@/components/workspace/section";
import Skeleton from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/errors";
import { tenancyApi, type CurrentTenant } from "@/actions/tenancy";
import useAuthStore from "@/store/use-auth-store";
import { updateTenantSchema } from "@/schema/tenancy.schema";

/** TENANT_MEMBERS_MANAGE and tenant updates are OWNER/ADMIN only. */
const canManage = (role: CurrentTenant["role"] | undefined) =>
  role === "OWNER" || role === "ADMIN";

/** "Owner" reads as a word; "OWNER" does not. */
const ROLE_SENTENCE: Record<CurrentTenant["role"], string> = {
  OWNER: "You own this practice.",
  ADMIN: "You are an admin of this practice.",
  MEMBER: "You are a member of this practice.",
  VIEWER: "You can view this practice.",
};

/**
 * The current practice's own details.
 *
 * This used to be two cards: one to rename the practice you are in, and one
 * listing every practice you belong to, stacked directly beneath each other. The
 * result was the same name three times on one screen — in a card subtitle, in an
 * input, and in a list row — with a "Current" badge beside the copy already
 * sitting in the input above it, and a role badge floating under the form with
 * nothing to attach it to.
 *
 * Listing and switching practices is not a setting. It is workspace context, and
 * it now lives in the context bar as `PracticeSwitcher`. What is left here is the
 * one thing that genuinely belongs in settings: the name of the practice you are
 * working in, and the fact that you can change it.
 */
export default function PracticeDetails() {
  const [tenant, setTenant] = useState<CurrentTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const { toast } = useToast();
  const setTenants = useAuthStore((state) => state.setTenants);

  /*
   * The initial fetch starts from the `true` the loading state was declared with
   * rather than setting it here. Setting it in the effect would be a render
   * before anything had even been requested.
   */
  useEffect(() => {
    let cancelled = false;

    tenancyApi
      .getCurrentTenant()
      .then((data) => {
        if (cancelled) return;

        setTenant(data);
        setName(data.name);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(getApiErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Retry only. The first load has no button to press until it has failed. */
  const retry = async () => {
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

      await tenancyApi.renameTenant(parsed.data);

      setTenant((previous) =>
        previous ? { ...previous, name: parsed.data.name } : previous,
      );

      /*
       * The context bar reads the practice name from the auth store, not from
       * this response. Renaming here without updating the store would leave the
       * bar showing the old name until a reload.
       */
      setTenants((previous) =>
        previous.map((item) =>
          item.id === tenant?.id ? { ...item, name: parsed.data.name } : item,
        ),
      );

      setSavedAt(parsed.data.name);

      toast({
        tone: "success",
        title: "Practice renamed",
        description: parsed.data.name,
      });
    } catch (error) {
      const description = getApiErrorMessage(error);

      toast({ tone: "error", title: "Could not rename practice", description });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Section className="max-w-xl">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-10 w-72" />
        <Skeleton className="mt-3 h-3 w-48" />
      </Section>
    );
  }

  if (loadError || !tenant) {
    return (
      <ErrorState
        title="Couldn't load your practice"
        description="We couldn't retrieve this practice's details."
        detail={loadError}
        onRetry={retry}
      />
    );
  }

  const editable = canManage(tenant.role);
  const unchanged = name.trim() === tenant.name;

  return (
    <Section className="max-w-2xl">
      <SectionHeader
        title="Practice"
        description="What this practice is called across Renove."
      />

      <form onSubmit={save} className="mt-6" noValidate>
        <div className="max-w-md">
          <Input
            id="practice-name"
            name="name"
            label="Practice name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSavedAt(null);
            }}
            error={nameError ?? undefined}
            disabled={!editable}
            autoComplete="organization"
          />

          <p className="mt-2 text-[13px] text-ink-subtle">
            {ROLE_SENTENCE[tenant.role]}
            {!editable && " Only an owner or admin can rename it."}
          </p>
        </div>

        {/*
         * Save is a secondary action on a form with one field, so it sits under
         * the input rather than beside it — and it only appears when there is
         * something to save. A permanently greyed-out "Save" is a control that
         * tells the user it failed to load.
         */}
        {editable && (!unchanged || saving) && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" variant="secondary" loading={saving}>
              Save changes
            </Button>

            {unchanged && savedAt && !saving && (
              <span
                role="status"
                className="text-[13px] text-ink-subtle"
              >
                Saved as {savedAt}
              </span>
            )}

            {!unchanged && !saving && (
              <Button
                type="button"
                variant="tertiary"
                onClick={() => {
                  setName(tenant.name);
                  setNameError(null);
                }}
              >
                Discard
              </Button>
            )}
          </div>
        )}
      </form>

      {/*
       * These two used to live here as separate cards, which is how a user ended
       * up with three places managing people. Pointing at the real routes is
       * honest about where the work happens.
       */}
      <div className="mt-8 border-t border-line pt-5">
        <p className="text-[13px] font-medium text-ink">Elsewhere</p>

        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-muted">
          Practice members and their roles live in{" "}
          <Link
            href="/team"
            className="rounded-sm text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Team
          </Link>
          . Your own profile, password and sessions live under{" "}
          <Link
            href="/settings?section=account"
            className="rounded-sm text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Account
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}