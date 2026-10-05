import type { BadgeTone } from "@/components/ui/badge";

import type { TenantRole } from "@/actions/auth";
import type { ClientStatus } from "@/services/clients.service";
import type { DeliverableStatus } from "@/services/deliverables.service";
import type { LeadSource, LeadStatus, ProjectType } from "@/services/leads.service";
import type { ProjectStatus } from "@/services/projects.service";
import type { TaskPriority, TaskStatus } from "@/services/tasks.service";

/**
 * The one registry for status, priority, role and enumeration vocabulary.
 *
 * The *values* are the contract, not a design decision, and they are declared
 * once in the service modules that mirror the server's Drizzle enums. This file
 * owns only how each value reads: its label and its tone. Separating the two is
 * what stopped the same state appearing as two different colours on two screens,
 * and it is why pages no longer carry their own `humanise()` helper.
 *
 *   Leads        §10.1   NEW CONTACTED QUALIFIED PROPOSAL WON LOST
 *   Clients      §10.2   ACTIVE INACTIVE ARCHIVED
 *   Projects     §11.1   PLANNING ACTIVE ON_HOLD COMPLETED CANCELLED
 *   Tasks        §11.3   TODO IN_PROGRESS REVIEW BLOCKED DONE CANCELLED
 *   Deliverables §12.1   IN_PROGRESS INTERNAL_REVIEW SENT_TO_CLIENT
 *                        CLIENT_APPROVED REVISION_REQUESTED ARCHIVED
 *   Proposals    §14.1   DRAFT SENT VIEWED APPROVED REJECTED EXPIRED
 *   Contracts    §15.1   DRAFT SENT APPROVED ACTIVE COMPLETED TERMINATED
 *
 * Two deliberate divergences, both confirmed as product decisions:
 *
 * 1. `APPROVED` is the name for a client-approved deliverable. §12.1's
 *    `CLIENT_APPROVED` is the document's older wording for the same state and is
 *    not a value the `deliverable_status` enum has ever stored, so the enum
 *    spelling is canonical and the old one is folded into it on the way in.
 *
 * 2. §12.1 lists only six deliverable statuses and predates `CLIENT_REVIEW`,
 *    `REJECTED` and `FINALIZED`. The enum and the server's DTO carry all nine,
 *    so the live set is presented rather than filtered down to the document.
 *
 * The `tone` values ARE a presentational judgement — which states read as good,
 * bad or in-flight. Aaron owns whether that mapping is correct; the statuses
 * themselves are not invented.
 */

export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
] as const;

export const CONTRACT_STATUSES = [
  "DRAFT",
  "SENT",
  "APPROVED",
  "ACTIVE",
  "COMPLETED",
  "TERMINATED",
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export type AnyStatus =
  | LeadStatus
  | DeliverableStatus
  | ProjectStatus
  | TaskStatus
  | ClientStatus
  | ProposalStatus
  | ContractStatus;

export interface StatusPresentation {
  label: string;
  tone: BadgeTone;
}

/**
 * Older spellings folded onto the canonical value.
 *
 * `CLIENT_APPROVED` is §12.1's name for what the `deliverable_status` enum calls
 * `APPROVED`. The enum is the stored contract and has never carried the longer
 * spelling, so this is not a live value — it is mapped here anyway so that a
 * payload written against the older documentation renders under the current
 * name instead of falling through to the unknown-value fallback.
 */
const STATUS_ALIASES = {
  CLIENT_APPROVED: "APPROVED",
} as const satisfies Record<string, AnyStatus>;

/** A status after alias folding — the only keys `PRESENTATION` is keyed by. */
type CanonicalStatus = Exclude<AnyStatus, keyof typeof STATUS_ALIASES>;

/*
 * Names that collide across domains share a meaning here: DRAFT, SENT, ACTIVE,
 * COMPLETED and APPROVED appear in more than one vocabulary and read the same
 * way, so they are declared once.
 */
const PRESENTATION: Record<CanonicalStatus, StatusPresentation> = {
  // Leads
  NEW: { label: "New", tone: "neutral" },
  CONTACTED: { label: "Contacted", tone: "info" },
  QUALIFIED: { label: "Qualified", tone: "info" },
  PROPOSAL: { label: "Proposal sent", tone: "info" },
  WON: { label: "Won", tone: "positive" },
  LOST: { label: "Lost", tone: "danger" },

  // Clients
  INACTIVE: { label: "Inactive", tone: "warning" },

  // Projects
  PLANNING: { label: "Planning", tone: "neutral" },
  ON_HOLD: { label: "On hold", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "danger" },

  // Tasks
  TODO: { label: "To do", tone: "neutral" },
  REVIEW: { label: "In review", tone: "info" },
  BLOCKED: { label: "Blocked", tone: "danger" },
  DONE: { label: "Done", tone: "positive" },

  // Deliverables
  IN_PROGRESS: { label: "In progress", tone: "info" },
  INTERNAL_REVIEW: { label: "Internal review", tone: "info" },
  SENT_TO_CLIENT: { label: "Sent to client", tone: "info" },
  CLIENT_REVIEW: { label: "Client review", tone: "info" },
  REJECTED: { label: "Rejected", tone: "danger" },
  REVISION_REQUESTED: { label: "Revision requested", tone: "warning" },
  FINALIZED: { label: "Finalized", tone: "positive" },

  // Shared across leads, deliverables, proposals, contracts, projects, tasks
  ACTIVE: { label: "Active", tone: "positive" },
  APPROVED: { label: "Approved", tone: "positive" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
  COMPLETED: { label: "Completed", tone: "positive" },
  DRAFT: { label: "Draft", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "warning" },
  SENT: { label: "Sent", tone: "info" },
  TERMINATED: { label: "Terminated", tone: "danger" },
  VIEWED: { label: "Viewed", tone: "info" },
};

/**
 * Fold an older spelling onto the canonical one.
 *
 * A no-op for every current value, so it is safe to call on any status.
 */
export function normaliseStatus(status: string): CanonicalStatus {
  return (
    (STATUS_ALIASES as Record<string, CanonicalStatus>)[status] ??
    (status as CanonicalStatus)
  );
}

/**
 * The label and tone for a status.
 *
 * Falls back rather than throwing. A value the registry has never heard of — a
 * server that gained a status before this file caught up — used to take the
 * whole route down to its error boundary, which is a far worse outcome than one
 * unrecognised badge. The raw value is shown so the gap stays visible instead of
 * silently reading as something else.
 */
export function getStatusPresentation(status: AnyStatus): StatusPresentation {
  return PRESENTATION[normaliseStatus(status)] ?? {
    label: String(status).replace(/_/g, " ").toLowerCase(),
    tone: "neutral",
  };
}

const PRIORITY_PRESENTATION: Record<TaskPriority, StatusPresentation> = {
  LOW: { label: "Low", tone: "neutral" },
  MEDIUM: { label: "Medium", tone: "neutral" },
  HIGH: { label: "High", tone: "warning" },
  URGENT: { label: "Urgent", tone: "danger" },
};

export function getPriorityPresentation(
  priority: TaskPriority,
): StatusPresentation {
  return PRIORITY_PRESENTATION[priority] ?? {
    label: String(priority),
    tone: "neutral",
  };
}

/*
 * Roles are a permission level, not a state of some process, so they all render
 * neutral: colouring them would imply a status the value does not carry. Only
 * the label is a presentational judgement.
 */
const ROLE_PRESENTATION: Record<TenantRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function getRoleLabel(role: TenantRole): string {
  return ROLE_PRESENTATION[role] ?? role;
}

const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  DIRECT: "Direct",
  SOCIAL: "Social",
  ADVERTISING: "Advertising",
  EVENT: "Event",
  OTHER: "Other",
};

export function getLeadSourceLabel(source: LeadSource): string {
  return LEAD_SOURCE_LABELS[source] ?? source;
}

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  INTERIOR: "Interior",
  LANDSCAPE: "Landscape",
  RENOVATION: "Renovation",
  OTHER: "Other",
};

export function getProjectTypeLabel(type: ProjectType): string {
  return PROJECT_TYPE_LABELS[type] ?? type;
}

/**
 * Turns a status union into `{ value, label }` pairs for a `Select`, so list
 * filters and edit forms share one source of labels rather than each building
 * their own from a raw enum.
 */
export function toStatusOptions<T extends AnyStatus>(
  statuses: readonly T[],
): { value: T; label: string }[] {
  return statuses.map((status) => ({
    value: status,
    label: getStatusPresentation(status).label,
  }));
}

/**
 * The same shape as `toStatusOptions`, for a vocabulary that is not a status.
 *
 * Takes the label lookup rather than a map so a vocabulary and its wording
 * cannot drift apart at the call site.
 */
export function toOptions<T extends string>(
  values: readonly T[],
  label: (value: T) => string,
): { value: T; label: string }[] {
  return values.map((value) => ({
    value,
    label: label(value),
  }));
}

/**
 * Priority options for a `Select`. Priorities read like statuses in the UI, so
 * they reuse the same option shape rather than forcing callers to special-case.
 */
export function toPriorityOptions(
  priorities: readonly TaskPriority[],
): { value: TaskPriority; label: string }[] {
  return priorities.map((priority) => ({
    value: priority,
    label: getPriorityPresentation(priority).label,
  }));
}