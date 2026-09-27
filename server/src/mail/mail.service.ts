import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { AppConfigService } from '@/config/app-config.service';

@Injectable()
export class MailService {
  private readonly transporter: ReturnType<
    typeof nodemailer.createTransport
  > | null;

  constructor(private readonly appConfig: AppConfigService) {
    const smtp = this.appConfig.smtp;

    if (!smtp.host || !smtp.port || !smtp.user || !smtp.password) {
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.password,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        'Email service is not configured.',
      );
    }

    const verificationUrl = `${this.appConfig.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: this.appConfig.smtp.from ?? 'noreply@renove.app',
      to: email,
      subject: 'Verify your email',
      text: `
Verify your email address.

Open this link to verify your account:

${verificationUrl}

This link expires in 24 hours.
      `.trim(),
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    if (!this.transporter) {
      throw new InternalServerErrorException(
        'Email service is not configured.',
      );
    }

    const resetUrl = `${this.appConfig.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from: this.appConfig.smtp.from ?? 'noreply@renove.app',
      to: email,
      subject: 'Reset your password',
      text: `
We received a request to reset your password.

Open this link to reset it:

${resetUrl}

This link expires in 30 minutes.

If you did not request this, you can safely ignore this email.
      `.trim(),
    });
  }
}
