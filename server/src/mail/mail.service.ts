import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';

import { AppConfigService } from '@/config/app-config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private brevo?: BrevoClient;

  constructor(private readonly appConfig: AppConfigService) {}

  private getClient(): BrevoClient {
    if (!this.brevo) {
      const apiKey = this.appConfig.brevoApiKey;
      if (!apiKey) {
        throw new InternalServerErrorException(
          'Email service is not configured.',
        );
      }
      this.brevo = new BrevoClient({ apiKey });
    }
    return this.brevo;
  }

  private get canDeliver(): boolean {
    return !!this.appConfig.brevoApiKey;
  }

  private deliverOrLog(url: string, subject: string): void {
    if (this.appConfig.isProduction) {
      throw new InternalServerErrorException(
        'Email service is not configured.',
      );
    }
    this.logger.warn(`${subject} (Brevo not configured, not sent): ${url}`);
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.appConfig.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    if (!this.canDeliver) {
      this.deliverOrLog(verificationUrl, `Verification email for ${email}`);
      return;
    }
    try {
      await this.getClient().transactionalEmails.sendTransacEmail({
        sender: {
          name: this.appConfig.smtp.fromName || 'Renove',
          email: this.appConfig.smtp.from || 'noreply@renove.app',
        },
        to: [{ email }],
        subject: 'Verify your email',
        htmlContent: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
            <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Verify your email</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">Thanks for signing up! Click the button below to verify your email address.</p>
            <div style="margin-bottom: 24px;">
              <a href="${verificationUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 500;">Verify email</a>
            </div>
            <p style="font-size: 14px; color: #666666; line-height: 1.5;">This link expires in 24 hours.</p>
          </div>
        `,
        textContent: `Verify your email\n\nThanks for signing up! Verify your email here: ${verificationUrl}\n\nThis link expires in 24 hours.`,
      });
      this.logger.log(`Verification email accepted by Brevo for ${email}`);
    } catch (err) {
      this.logger.error(
        'Failed to send verification email',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.appConfig.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    if (!this.canDeliver) {
      this.deliverOrLog(resetUrl, `Password reset email for ${email}`);
      return;
    }
    try {
      await this.getClient().transactionalEmails.sendTransacEmail({
        sender: {
          name: this.appConfig.smtp.fromName || 'Renove',
          email: this.appConfig.smtp.from || 'noreply@renove.app',
        },
        to: [{ email }],
        subject: 'Reset your password',
        htmlContent: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
            <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Reset your password</h1>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">We received a request to reset your password. Click the button below to create a new password.</p>
            <div style="margin-bottom: 24px;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 500;">Reset password</a>
            </div>
            <p style="font-size: 14px; color: #666666; line-height: 1.5; margin-bottom: 8px;">If you didn't request this, you can safely ignore this email.</p>
            <p style="font-size: 14px; color: #666666; line-height: 1.5;">This link expires in 30 minutes.</p>
          </div>
        `,
        textContent: `Reset your password\n\nWe received a request to reset your password.\n\nReset here: ${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
      });
      this.logger.log(`Password reset email accepted by Brevo for ${email}`);
    } catch (err) {
      this.logger.error(
        'Failed to send password reset email',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
