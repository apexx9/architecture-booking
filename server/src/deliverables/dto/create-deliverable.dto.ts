import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export const DELIVERABLE_STATUSES = [
  'IN_PROGRESS',
  'INTERNAL_REVIEW',
  'SENT_TO_CLIENT',
  'CLIENT_REVIEW',
  'APPROVED',
  'REJECTED',
  'REVISION_REQUESTED',
  'FINALIZED',
  'ARCHIVED',
] as const;

export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export class CreateDeliverableDto {
  @IsDefined()
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DELIVERABLE_STATUSES)
  status?: DeliverableStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
