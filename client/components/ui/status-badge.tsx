import Badge from "@/components/ui/badge";
import { getStatusPresentation, type AnyStatus } from "@/lib/domain/status";

interface StatusBadgeProps {
  status: AnyStatus;
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
 * The label and tone come from `lib/domain/status.ts`. Neither is decided here:
 * this component only renders what that registry says.
 *
 * ```tsx
 * <StatusBadge status="REVISION_REQUESTED" />
 * ```
 */
const StatusBadge = ({ status, dot = true, className }: StatusBadgeProps) => {
  const { label, tone } = getStatusPresentation(status);

  return (
    <Badge tone={tone} dot={dot} className={className}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
