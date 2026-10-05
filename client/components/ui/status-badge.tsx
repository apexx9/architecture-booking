import Badge from "@/components/ui/badge";
import {
  getPriorityPresentation,
  getStatusPresentation,
  type AnyStatus,
  type StatusPresentation,
} from "@/lib/domain/status";
import type { TaskPriority } from "@/services/tasks.service";

type BadgeStatus = AnyStatus | TaskPriority;

const isPriority = (status: BadgeStatus): status is TaskPriority =>
  (["LOW", "MEDIUM", "HIGH", "URGENT"] as const).includes(
    status as TaskPriority,
  );

interface StatusBadgeProps {
  status: BadgeStatus;
  /**
   * Statuses are always rendered as text plus tone — the label is the meaning,
   * the colour is reinforcement. The dot adds a low-vision-friendly shape cue on
   * top and is on by default for that reason.
   */
  dot?: boolean;
  className?: string;
}

/**
 * Renders one of the status vocabularies from `app-details.md` with a consistent
 * tone, so the same state never appears as two different colours in two screens.
 *
 * Task priority is accepted too: it is presented identically and comes from the
 * same registry, and splitting it into a second badge component would only give
 * two components the same job.
 *
 * The label and tone come from `lib/domain/status.ts`. Neither is decided here:
 * this component only renders what that registry says.
 *
 * ```tsx
 * <StatusBadge status="REVISION_REQUESTED" />
 * <StatusBadge status="URGENT" />
 * ```
 */
const StatusBadge = ({ status, dot = true, className }: StatusBadgeProps) => {
  const { label, tone }: StatusPresentation = isPriority(status)
    ? getPriorityPresentation(status)
    : getStatusPresentation(status);

  return (
    <Badge tone={tone} dot={dot} className={className}>
      {label}
    </Badge>
  );
};

export default StatusBadge;