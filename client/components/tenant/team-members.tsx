"use client";

import { useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Skeleton from "@/components/ui/skeleton";
import DataView from "@/components/workspace/data-view";
import { ErrorState, InlineError } from "@/components/workspace/error-state";
import { Section, SectionHeader } from "@/components/workspace/section";
import { getApiErrorMessage } from "@/lib/api/errors";
import { initials } from "@/lib/format";
import {
  memberName,
  tenancyApi,
  type CurrentTenant,
  type TenantMember,
} from "@/actions/tenancy";
import type { TenantRole } from "@/actions/auth";
import useAuthStore from "@/store/use-auth-store";
import {
  addMemberSchema,
  updateMemberRoleSchema,
  type AssignableRole,
} from "@/schema/tenancy.schema";

/**
 * Roles a member may hold a selector for. OWNER is absent because the server
 * rejects changes to it and there is no API to transfer ownership, so it is
 * rendered as a static badge instead.
 */
const ASSIGNABLE_ROLES: AssignableRole[] = ["ADMIN", "MEMBER", "VIEWER"];

const canManage = (role: CurrentTenant["role"] | undefined) =>
  role === "OWNER" || role === "ADMIN";

const label = (role: string) => role.charAt(0) + role.slice(1).toLowerCase();

const ROLE_OPTIONS = ASSIGNABLE_ROLES.map((role) => ({
  value: role,
  label: label(role),
}));

/**
 * Membership of the current practice: role changes, invitations by email and
 * removal.
 *
 * The viewer needs `GET /tenants/current` as well as the member list because
 * TENANT_MEMBERS_MANAGE decides whether the mutating controls render at all.
 * Member listing itself only needs TENANT_MEMBERS_READ, which every role holds,
 * so a failure there is swallowed to keep the card usable for read-only roles.
 */
export default function TeamMembers() {
  const [tenant, setTenant] = useState<CurrentTenant | null>(null);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<TenantMember | null>(null);

  /** Used only to mark the viewer's own row. */
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  /**
   * OWNER cannot be edited, and neither can anything at all for a viewer without
   * TENANT_MEMBERS_MANAGE — the server rejects both, so the controls are not
   * rendered rather than rendered and failing.
   */
  const canEdit = (member: TenantMember) =>
    member.role !== "OWNER" && canManage(tenant?.role);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>("MEMBER");
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      tenancyApi.getCurrentTenant(),
      tenancyApi.listMembers().catch(() => [] as TenantMember[]),
    ])
      .then(([tenantData, memberList]) => {
        if (cancelled) {
          return;
        }

        setTenant(tenantData);
        setMembers(memberList);
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

  const changeRole = async (member: TenantMember, next: TenantRole) => {
    const parsed = updateMemberRoleSchema.safeParse({
      userId: member.userId,
      role: next,
    });

    if (!parsed.success) {
      return;
    }

    const previous = member;

    setActionError(null);
    setMembers((prev) =>
      prev.map((item) =>
        item.userId === member.userId
          ? { ...item, role: parsed.data.role }
          : item,
      ),
    );

    try {
      setBusyId(member.userId);

      await tenancyApi.updateMemberRole(parsed.data);
    } catch (error) {
      setMembers((prev) =>
        prev.map((item) => (item.userId === member.userId ? previous : item)),
      );
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (member: TenantMember) => {
    setActionError(null);
    setBusyId(member.userId);

    try {
      await tenancyApi.removeMember(member.userId);
      setMembers((prev) =>
        prev.filter((item) => item.userId !== member.userId),
      );
      setRemoving(null);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    const parsed = addMemberSchema.safeParse({ email, role });

    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Check the email and role.",
      );

      return;
    }

    try {
      setAdding(true);

      const member = await tenancyApi.addMember(parsed.data);

      setMembers((prev) =>
        prev.some((item) => item.userId === member.userId)
          ? prev
          : [...prev, member],
      );
      setOpen(false);
      setEmail("");
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Section className="motion-enter mt-6" divided>
        <SectionHeader
          title="Members"
          description={`${members.length} ${
            members.length === 1 ? "member" : "members"
          } with access to this practice.`}
          actions={
            canManage(tenant?.role) ? (
              <Button size="sm" onClick={() => setOpen(true)}>
                <UserPlus className="size-4" aria-hidden="true" />
                Add member
              </Button>
            ) : undefined
          }
        />

        <div className="mt-5">
          {loading ? (
            <div className="space-y-2" aria-busy="true">
              <span className="sr-only">Loading members…</span>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : loadError && members.length === 0 ? (
            <ErrorState
              title="Couldn't load the team"
              description="We couldn't retrieve who has access to this practice."
              detail={loadError}
              size="sm"
            />
          ) : (
            <DataView<TenantMember>
              label="Practice members"
              rows={members}
              rowKey={(member) => member.userId}
              primary={(member) => memberName(member)}
              secondary={(member) => member.email}
              meta={(member) => (
                <>
                  {member.userId === currentUserId && (
                    <span className="text-[12px] text-ink-subtle">You</span>
                  )}

                  {/* OWNER cannot be edited, and neither can anything at all
                      for a viewer without TENANT_MEMBERS_MANAGE. */}
                  {!canEdit(member) && (
                    <Badge tone={member.role === "OWNER" ? "info" : "neutral"}>
                      {label(member.role)}
                    </Badge>
                  )}
                </>
              )}
              actions={(member) =>
                canEdit(member) ? (
                  <>
                    <Select
                      aria-label={`Role for ${memberName(member)}`}
                      options={ROLE_OPTIONS}
                      value={member.role}
                      size="sm"
                      fullWidth={false}
                      disabled={busyId === member.userId}
                      onChange={(value) =>
                        changeRole(member, value as TenantRole)
                      }
                      className="w-[112px]"
                    />

                    <Button
                      size="sm"
                      variant="tertiary"
                      disabled={busyId === member.userId}
                      onClick={() => setRemoving(member)}
                      aria-label={`Remove ${memberName(member)}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </>
                ) : null
              }
              empty={
                <EmptyState
                  title="No members"
                  description="Nobody has access to this practice yet. Invite someone to start working in it."
                  size="sm"
                  action={
                    canManage(tenant?.role) ? (
                      <Button size="sm" onClick={() => setOpen(true)}>
                        <UserPlus className="size-4" aria-hidden="true" />
                        Add member
                      </Button>
                    ) : undefined
                  }
                />
              }
              columns={[
                {
                  key: "member",
                  header: "Member",
                  cell: (member) => (
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-[11px] text-ink-muted"
                      >
                        {initials(memberName(member))}
                      </span>

                      <span className="truncate">{memberName(member)}</span>

                      {member.userId === currentUserId && (
                        <span className="shrink-0 text-[12px] text-ink-subtle">
                          You
                        </span>
                      )}
                    </span>
                  ),
                },
                {
                  key: "email",
                  header: "Email",
                  hideBelowLg: true,
                  cell: (member) => member.email,
                },
                {
                  key: "role",
                  header: "Role",
                  width: "w-32",
                  cell: (member) =>
                    canEdit(member) ? (
                      <span className="text-ink-muted">
                        {label(member.role)}
                      </span>
                    ) : (
                      <Badge
                        tone={member.role === "OWNER" ? "info" : "neutral"}
                      >
                        {label(member.role)}
                      </Badge>
                    ),
                },
              ]}
            />
          )}
        </div>

        {actionError && (
          <InlineError
            title="Action failed"
            detail={actionError}
            className="mt-4"
          />
        )}
      </Section>

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        label="Remove member"
        title="Remove this member?"
        hideClose
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRemoving(null)}
              disabled={busyId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={busyId !== null}
              onClick={() => removing && remove(removing)}
            >
              Remove member
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">
            {removing ? memberName(removing) : ""}
          </span>{" "}
          will lose access to this practice. Their projects, tasks and files are
          not deleted.
        </p>
      </Dialog>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label="Add member"
        title="Add a team member"
      >
        <form onSubmit={add} className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm text-ink"
              htmlFor="member-email"
            >
              Email
            </label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <Select
              id="member-role"
              label="Role"
              options={ROLE_OPTIONS}
              value={role}
              onChange={(value) => setRole(value as AssignableRole)}
            />
          </div>

          <p className="text-[13px] text-ink-subtle">
            The member must already have an account.
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
              loading={adding}
              disabled={adding || !email.trim()}
            >
              Add member
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
