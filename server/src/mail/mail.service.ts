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
        htmlContent: `<p>Verify your email address.</p><p><a href="${verificationUrl}">Click here to verify</a></p><p>Expires in 24 hours.</p>`,
        textContent: `Verify: ${verificationUrl}`,
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
        htmlContent: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset password</a></p><p>Expires in 30 minutes.</p>`,
        textContent: `Reset: ${resetUrl}`,
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
