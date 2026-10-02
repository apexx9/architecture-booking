import type { BadgeTone } from "@/components/ui/badge";

/**
 * Status vocabularies.
 *
 * These unions are transcribed verbatim from `app-details.md` — they are the
 * contract, not a design decision:
 *
 *   Leads        §10.1   NEW CONTACTED QUALIFIED PROPOSAL WON LOST
 *   Deliverables §12.1   IN_PROGRESS INTERNAL_REVIEW SENT_TO_CLIENT
 *                        CLIENT_APPROVED REVISION_REQUESTED ARCHIVED
 *   Proposals    §14.1   DRAFT SENT VIEWED APPROVED REJECTED EXPIRED
 *   Contracts    §15.1   DRAFT SENT APPROVED ACTIVE COMPLETED TERMINATED
 *
 * Divergence from the database, kept deliberately: the `deliverable_status`
 * pgEnum carries CLIENT_REVIEW, APPROVED, REJECTED and FINALIZED, and the
 * server's DTO accepts all of them. `CLIENT_APPROVED` from §12.1 is the
 * document's older name for what the enum calls APPROVED. Both spellings are
 * listed below so a status arriving from the API always resolves to a label
 * rather than rendering undefined — see `getStatusPresentation`.
 *
 * `DeliverableStatus` is typed from the union of the two, so no live value can
 * miss the presentation map. Aaron should confirm which name the product wants
 * before we drop either.
 *
 * The `tone` and `label` maps below ARE a presentational judgement — which
 * states read as good, bad or in-flight. Aaron owns whether that mapping is
 * correct; the statuses themselves are not invented.
 */

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "WON",
  "LOST",
] as const;

export const DELIVERABLE_STATUSES = [
  "IN_PROGRESS",
  "INTERNAL_REVIEW",
  "SENT_TO_CLIENT",
  "CLIENT_REVIEW",
  "CLIENT_APPROVED",
  "APPROVED",
  "REJECTED",
  "REVISION_REQUESTED",
  "FINALIZED",
  "ARCHIVED",
] as const;

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

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export type AnyStatus =
  | LeadStatus
  | DeliverableStatus
  | ProposalStatus
  | ContractStatus;

interface StatusPresentation {
  label: string;
  tone: BadgeTone;
}

/*
 * Statuses whose names collide across domains share a meaning here: DRAFT,
 * SENT and APPROVED appear in more than one vocabulary and read the same way.
 */
const PRESENTATION: Record<AnyStatus, StatusPresentation> = {
  // Leads
  NEW: { label: "New", tone: "neutral" },
  CONTACTED: { label: "Contacted", tone: "info" },
  QUALIFIED: { label: "Qualified", tone: "info" },
  PROPOSAL: { label: "Proposal sent", tone: "info" },
  WON: { label: "Won", tone: "positive" },
  LOST: { label: "Lost", tone: "danger" },

  // Deliverables
  IN_PROGRESS: { label: "In progress", tone: "info" },
  INTERNAL_REVIEW: { label: "Internal review", tone: "info" },
  SENT_TO_CLIENT: { label: "Sent to client", tone: "info" },
  CLIENT_REVIEW: { label: "Client review", tone: "info" },
  CLIENT_APPROVED: { label: "Client approved", tone: "positive" },
  REJECTED: { label: "Rejected", tone: "danger" },
  REVISION_REQUESTED: { label: "Revision requested", tone: "warning" },
  FINALIZED: { label: "Finalized", tone: "positive" },
  ARCHIVED: { label: "Archived", tone: "neutral" },

  // Proposals / Contracts
  DRAFT: { label: "Draft", tone: "neutral" },
  SENT: { label: "Sent", tone: "info" },
  VIEWED: { label: "Viewed", tone: "info" },
  APPROVED: { label: "Approved", tone: "positive" },
  EXPIRED: { label: "Expired", tone: "warning" },
  ACTIVE: { label: "Active", tone: "positive" },
  COMPLETED: { label: "Completed", tone: "positive" },
  TERMINATED: { label: "Terminated", tone: "danger" },
};

export function getStatusPresentation(status: AnyStatus): StatusPresentation {
  return PRESENTATION[status];
}

/**
 * Turns a status union into `{ value, label }` pairs for a `Select`. Exported so
 * list filters and edit forms share one source of labels.
 */
export function toStatusOptions<T extends AnyStatus>(
  statuses: readonly T[],
): { value: T; label: string }[] {
  return statuses.map((status) => ({
    value: status,
    label: PRESENTATION[status].label,
  }));
}
