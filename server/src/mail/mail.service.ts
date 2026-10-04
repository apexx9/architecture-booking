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
    const verificationUrl = `${this.appConfig.frontendBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;
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
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f3ee; padding: 32px 20px; color: #1a1a1a;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e1d8; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(26, 26, 26, 0.04);">
              <div style="padding: 24px 28px 18px; background: #111111;">
                <div style="font-size: 28px; line-height: 1; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Renove<span style="font-size: 12px; vertical-align: top; margin-left: 2px;">®</span></div>
              </div>
              <div style="padding: 32px 28px 28px;">
                <h1 style="font-size: 28px; line-height: 1.2; margin: 0 0 16px; font-weight: 700; color: #1a1a1a;">Verify your email</h1>
                <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #4b4b4b;">Thanks for signing up. Click below to verify your email and open your studio workspace.</p>
                <div style="margin: 0 0 24px;">
                  <a href="${verificationUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; letter-spacing: 0.01em;">Verify email</a>
                </div>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b6b6b;">This verification link expires in 24 hours.</p>
              </div>
            </div>
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
    const resetUrl = `${this.appConfig.frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
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
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f3ee; padding: 32px 20px; color: #1a1a1a;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e1d8; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(26, 26, 26, 0.04);">
              <div style="padding: 24px 28px 18px; background: #111111;">
                <div style="font-size: 28px; line-height: 1; font-weight: 700; letter-spacing: -0.05em; color: #ffffff;">Renove<span style="font-size: 12px; vertical-align: top; margin-left: 2px;">®</span></div>
              </div>
              <div style="padding: 32px 28px 28px;">
                <h1 style="font-size: 28px; line-height: 1.2; margin: 0 0 16px; font-weight: 700; color: #1a1a1a;">Reset your password</h1>
                <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #4b4b4b;">We received a request to reset your password. Use the secure link below to choose a new one.</p>
                <div style="margin: 0 0 24px;">
                  <a href="${resetUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; letter-spacing: 0.01em;">Reset password</a>
                </div>
                <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #6b6b6b;">If you didn't request this, you can safely ignore this email.</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b6b6b;">This reset link expires in 30 minutes.</p>
              </div>
            </div>
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
