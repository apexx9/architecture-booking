import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  PROJECT_TYPES,
  type LeadSource,
  type LeadStatus,
  type ProjectType,
} from '@/db/schema/leads.schema';

/**
 * Mirrors `CreateLeadDto` with every field optional.
 *
 * Written out rather than derived with `PartialType` because
 * `@nestjs/mapped-types` is not a dependency of this service; the two files
 * need to stay in step.
 */
export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;

  @IsOptional()
  @IsEnum(LEAD_SOURCES)
  source?: LeadSource;

  @IsOptional()
  @IsEnum(PROJECT_TYPES)
  projectType?: ProjectType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  estimatedBudget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(LEAD_STATUSES)
  status?: LeadStatus;
}
