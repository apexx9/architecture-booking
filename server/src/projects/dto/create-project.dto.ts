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

export const PROJECT_STATUSES = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export class CreateProjectDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PROJECT_STATUSES)
  status?: ProjectStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  /** numeric(12,2) column; a decimal string is passed straight to Postgres. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  budget?: string;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
