import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  PASSWORD_DIGIT_REGEX,
  PASSWORD_LETTER_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/auth/password-policy';

export class RegisterDto {
  @IsEmail()
  email!: string;

  /**
   * Optional so existing API clients that only send email + password keep
   * working; the sign-up form always collects it.
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: 'Password must be at least 8 characters long.',
  })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: 'Password must be at most 128 characters long.',
  })
  @Matches(PASSWORD_LETTER_REGEX, {
    message: 'Password must contain at least one letter.',
  })
  @Matches(PASSWORD_DIGIT_REGEX, {
    message: 'Password must contain at least one number.',
  })
  password!: string;
}
