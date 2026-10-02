import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFileDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  deliverableId?: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalName!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mimeType!: string;

  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  size!: number;

  @IsOptional()
  @IsUUID()
  uploadedById?: string;
}
