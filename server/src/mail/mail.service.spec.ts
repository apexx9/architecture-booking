import { ConfigService } from '@nestjs/config';

import { MailService } from '@/mail/mail.service';

describe('MailService', () => {
  it('brands verification emails with the Renovate wordmark and mark', async () => {
    const configService = {
      getOrThrow: jest.fn((key: string, fallback?: string) => {
        if (key === 'BREVO_API_KEY') return 'test-api-key';
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        if (key === 'APP_URL') return 'http://localhost:3001';
        if (key === 'PORT') return 3001;
        if (key === 'NODE_ENV') return 'development';
        if (key === 'COOKIE_SAME_SITE') return 'lax';
        return fallback;
      }),
      get: jest.fn((key: string) => {
        if (key === 'BREVO_API_KEY') return 'test-api-key';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new MailService({
      ...configService,
      brevoApiKey: 'test-api-key',
      smtp: {
        from: 'noreply@renove.app',
        fromName: 'Renove',
      },
      frontendBaseUrl: 'http://localhost:3000',
      isProduction: false,
    } as any);

    const sendTransacEmail = jest.fn().mockResolvedValue({});
    (service as any).brevo = {
      transactionalEmails: { sendTransacEmail },
    };

    await service.sendVerificationEmail('studio@example.com', 'token-123');

    expect(sendTransacEmail).toHaveBeenCalledTimes(1);
    const payload = sendTransacEmail.mock.calls[0][0];
    expect(payload.htmlContent).toContain('Renove');
    expect(payload.htmlContent).toContain('®');
    expect(payload.subject).toBe('Verify your email');
  });
});
