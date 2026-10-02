"use client";

import { useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card, { CardBody, CardHeader } from "@/components/ui/card";
import Dialog from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import Input from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  tenancyApi,
  type CurrentTenant,
  type TenantMember,
} from "@/actions/tenancy";
import type { TenantRole } from "@/actions/auth";
import {
  addMemberSchema,
  updateMemberRoleSchema,
  type AssignableRole,
} from "@/schema/tenancy.schema";

const ASSIGNABLE_ROLES: AssignableRole[] = ["ADMIN", "MEMBER", "VIEWER"];

/**
 * Roles a member may hold a selector for. OWNER is absent because the server
 * rejects changes to it and there is no API to transfer ownership, so it is
 * rendered as a static badge instead.
 */
const EDITABLE_ROLES: TenantRole[] = ["ADMIN", "MEMBER", "VIEWER"];

const canManage = (role: CurrentTenant["role"] | undefined) =>
  role === "OWNER" || role === "ADMIN";

const label = (role: string) => role.charAt(0) + role.slice(1).toLowerCase();

/**
 * Membership of the current practice: role changes, invitations by email and
 * removal.
 *
 * The viewer needs `GET /tenants/current` as well as the member list because
 * TENANT_MEMBERS_MANAGE decides whether the mutating controls render at all.
 * Member listing itself only needs TENANT_MEMBERS_READ, which every role holds,
 * so a failure there is swallowed to keep the card usable for read-only roles.
 */
export default function TeamCard() {
  const [tenant, setTenant] = useState<CurrentTenant | null>(null);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      setMembers((prev) => prev.filter((item) => item.userId !== member.userId));
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
    <Card className="motion-enter">
      <CardHeader
        title="Team"
        description={`${members.length} member${members.length === 1 ? "" : "s"}`}
        action={
          canManage(tenant?.role) ? (
            <Button size="sm" onClick={() => setOpen(true)}>
              <UserPlus className="size-4" aria-hidden="true" />
              Add Member
            </Button>
          ) : undefined
        }
      />
      <CardBody>
        {loading ? (
          <div className="py-8 text-center text-[14px] text-ink-subtle">
            Loading...
          </div>
        ) : loadError && members.length === 0 ? (
          <EmptyState
            title="Could not load the team"
            description={loadError}
            tone="error"
            size="sm"
          />
        ) : members.length === 0 ? (
          <EmptyState
            title="No members"
            description="Members of this practice will be listed here."
            size="sm"
          />
        ) : (
          <ul className="space-y-2">
            {members.map((member) => {
              const isBusy = busyId === member.userId;
              // OWNER cannot be edited, and neither can anything at all for a
              // viewer without TENANT_MEMBERS_MANAGE.
              const editable =
                member.role !== "OWNER" && canManage(tenant?.role);

              return (
                <li
                  key={member.userId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line p-3"
                >
                  <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                    {member.email}
                  </span>

                  <span className="flex shrink-0 items-center gap-2">
                    {editable ? (
                      <>
                        <label
                          className="sr-only"
                          htmlFor={`member-role-${member.userId}`}
                        >
                          Role for {member.email}
                        </label>
                        <select
                          id={`member-role-${member.userId}`}
                          value={member.role}
                          disabled={isBusy}
                          onChange={(event) =>
                            changeRole(member, event.target.value as TenantRole)
                          }
                          className="h-8 rounded-sm border border-line bg-surface px-2 text-[12px] text-ink disabled:opacity-50"
                        >
                          {EDITABLE_ROLES.map((option) => (
                            <option key={option} value={option}>
                              {label(option)}
                            </option>
                          ))}
                        </select>

                        <Button
                          size="sm"
                          variant="tertiary"
                          disabled={isBusy}
                          onClick={() => remove(member)}
                          aria-label={`Remove ${member.email}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </>
                    ) : (
                      <Badge tone={member.role === "OWNER" ? "info" : "neutral"}>
                        {label(member.role)}
                      </Badge>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {actionError && (
          <p role="alert" className="mt-4 text-[13px] text-danger">
            {actionError}
          </p>
        )}
      </CardBody>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label="Add Member"
        title="Add Member"
      >
        <form onSubmit={add} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-ink" htmlFor="member-email">
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
            <label className="mb-1 block text-sm text-ink" htmlFor="member-role">
              Role
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(event) => setRole(event.target.value as AssignableRole)}
              className="h-10 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink"
            >
              {ASSIGNABLE_ROLES.map((option) => (
                <option key={option} value={option}>
                  {label(option)}
                </option>
              ))}
            </select>
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
              Add Member
            </Button>
          </div>
        </form>
      </Dialog>
    </Card>
  );
}