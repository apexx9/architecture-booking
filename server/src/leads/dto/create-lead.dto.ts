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

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

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

  /** Column is a Postgres enum; unknown values are rejected rather than 500. */
  @IsOptional()
  @IsEnum(LEAD_SOURCES)
  source?: LeadSource;

  @IsOptional()
  @IsEnum(PROJECT_TYPES)
  projectType?: ProjectType;

  /** numeric column; a decimal string is passed straight to Postgres. */
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
