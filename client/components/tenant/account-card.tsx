"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Tooltip from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { Section, SectionHeader } from "@/components/workspace/section";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { authService } from "@/services/auth.service";
import type { AuthUser } from "@/actions/auth";
import useAuthStore from "@/store/use-auth-store";

/**
 * The signed-in user's own account.
 *
 * Everything here is read-only except signing out everywhere, because that is all
 * the API supports: `GET /auth/me` returns the profile and there is no profile
 * update endpoint. Name, email and status are therefore displayed rather than
 * editable — an editable field that cannot save is worse than a static one.
 */
export default function AccountCard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { toast } = useToast();
  const tenants = useAuthStore((state) => state.tenants);

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setUser(await authService.getCurrentUser());
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

  const signOutEverywhere = async () => {
    setActionError(null);

    try {
      setSigningOut(true);

      await authService.logoutAll();

      setConfirming(false);
      // `logoutAll` clears the auth store; the redirect is the router's job once
      // the session is gone, so the toast is the last thing the user sees.
      toast({
        tone: "success",
        title: "Signed out everywhere",
        description: "Sign in again to return to your practice.",
      });
    } catch (error) {
      const description = getApiErrorMessage(error);

      setActionError(description);
      setConfirming(false);
      toast({ tone: "error", title: "Could not sign out", description });
    }
  };

  return (
    <>
      <Section className="motion-enter">
        <SectionHeader title="Account" description="Your sign-in details." />

        <div className="mt-5">
          {loading ? (
            <div
              role="status"
              className="py-8 text-center text-[14px] text-ink-subtle"
            >
              Loading…
            </div>
          ) : loadError || !user ? (
            <EmptyState
              title="Could not load your account"
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
            <>
              <dl className="divide-y divide-line">
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-[13px] text-ink-subtle">Name</dt>
                  <dd className="text-[14px] text-ink">
                    {user.fullName?.trim() || "Not set"}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-[13px] text-ink-subtle">Email</dt>
                  <dd className="text-[14px] text-ink break-all">
                    {user.email}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-[13px] text-ink-subtle">
                    Email verified
                  </dt>
                  <dd className="text-[14px] text-ink">
                    {user.emailVerifiedAt ? (
                      `Verified ${formatDate(user.emailVerifiedAt) ?? ""}`.trim()
                    ) : (
                      <Badge tone="warning" dot>
                        Not verified
                      </Badge>
                    )}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-[13px] text-ink-subtle">Status</dt>
                  <dd>
                    <Badge tone="neutral" dot>
                      {user.status}
                    </Badge>
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-[13px] text-ink-subtle">Member since</dt>
                  <dd className="text-[14px] text-ink tabular-nums">
                    {formatDate(user.createdAt) ?? "—"}
                  </dd>
                </div>

                {tenants.length > 0 && (
                  <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                    <dt className="text-[13px] text-ink-subtle">Practices</dt>
                    <dd className="text-[14px] text-ink">
                      {tenants.map((tenant) => tenant.name).join(", ")}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 border-t border-line pt-5">
                <h3 className="text-[13px] font-medium text-ink">Sessions</h3>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setConfirming(true)}
                    aria-label="Sign out of all devices"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Sign out everywhere
                  </Button>

                  <Tooltip
                    label="Your name, email and status cannot be changed from here — the API has no profile update endpoint."
                    side="bottom"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-subtle">
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      Profile details are read-only
                    </span>
                  </Tooltip>
                </div>

                <p className="mt-2 text-[13px] leading-relaxed text-ink-subtle">
                  Signing out everywhere ends every active session on every
                  device, including this one.
                </p>
              </div>

              {actionError && (
                <p
                  role="alert"
                  className="mt-4 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger"
                >
                  {actionError}
                </p>
              )}
            </>
          )}
        </div>
      </Section>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        label="Sign out everywhere"
        title="Sign out of all devices?"
        hideClose
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirming(false)}
              disabled={signingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={signingOut}
              onClick={signOutEverywhere}
            >
              Sign out everywhere
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          Every session ends, on this device and any other. You will need to
          sign in again.
        </p>
      </Dialog>
    </>
  );
}
