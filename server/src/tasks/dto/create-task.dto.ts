import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const TASK_STATUSES = [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'DONE',
  'CANCELLED',
] as const;

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export class CreateTaskDto {
  @IsDefined()
  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  phaseId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TASK_PRIORITIES)
  priority?: TaskPriority;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
