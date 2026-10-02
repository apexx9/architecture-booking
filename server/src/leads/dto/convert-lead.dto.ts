import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Overrides applied to the client record created from a converted lead. */
export class ConvertLeadToClientDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
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
}
