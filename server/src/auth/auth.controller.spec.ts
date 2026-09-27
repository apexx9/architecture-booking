import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import type { Request, Response } from 'express';

import { AuthService } from '@/auth/auth.service';
import { AccessTokenGuard } from '@/auth/auth.guard';
import { AuthController } from '@/auth/auth.controller';
import { CsrfService } from '@/auth/csrf.service';
import { AppConfigService } from '@/config/app-config.service';

function createMockResponse(): Response {
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  return response;
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let csrfService: CsrfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(async () => ({
              id: 'user-1',
              email: 'user@example.com',
              status: 'PENDING',
              createdAt: new Date(),
            })),
            login: jest.fn(async () => ({
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
              user: { id: 'user-1' },
              session: { id: 'session-1', expiresAt: new Date() },
            })),
            logout: jest.fn(async () => undefined),
            logoutAll: jest.fn(async () => undefined),
            refresh: jest.fn(async () => ({
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              session: { id: 'session-2', expiresAt: new Date() },
            })),
            resendVerification: jest.fn(async () => ({
              message: 'A new verification link has been sent.',
            })),
          },
        },
        {
          provide: CsrfService,
          useValue: {
            validate: jest.fn((cookie: string | undefined) => {
              if (!cookie) {
                throw new UnauthorizedException('Invalid CSRF token.');
              }
            }),
          },
        },
        {
          provide: AccessTokenGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: AppConfigService,
          useValue: { isProduction: false },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(async () => ({
              sub: 'user-1',
              type: 'access',
            })),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    csrfService = module.get<CsrfService>(CsrfService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('rejects the request when no CSRF token is provided', async () => {
      const request = {
        ip: '127.0.0.1',
        headers: {},
        cookies: {},
        get: jest.fn(() => undefined),
      } as unknown as Request;

      const response = createMockResponse();

      await expect(
        controller.login(
          { email: 'user@example.com', password: 'password123' },
          request,
          response,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('sets auth cookies on success', async () => {
      const request = {
        ip: '127.0.0.1',
        headers: { 'x-csrf-token': 'csrf-token' },
        cookies: { csrf_token: 'csrf-token' },
        get: jest.fn(() => 'test-agent'),
      } as unknown as Request;

      const response = createMockResponse();

      await controller.login(
        { email: 'user@example.com', password: 'password123' },
        request,
        response,
      );

      expect(authService.login).toHaveBeenCalled();
      expect(csrfService.validate).toHaveBeenCalled();
      expect(response.cookie).toHaveBeenCalledWith(
        'access_token',
        'access-token',
        expect.any(Object),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.any(Object),
      );
    });
  });

  describe('register', () => {
    it('forwards the registration to the auth service', async () => {
      const request = {
        ip: '127.0.0.1',
        headers: { 'x-csrf-token': 'csrf-token' },
        cookies: { csrf_token: 'csrf-token' },
        get: jest.fn(() => undefined),
      } as unknown as Request;

      const result = await controller.register(
        { email: 'user@example.com', password: 'Password123' },
        request,
      );

      expect(authService.register).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'Password123',
      });
      expect(result.status).toBe('PENDING');
    });
  });

  describe('resendVerification', () => {
    it('forwards the request to the auth service', async () => {
      const request = {
        ip: '127.0.0.1',
        headers: { 'x-csrf-token': 'csrf-token' },
        cookies: { csrf_token: 'csrf-token' },
        get: jest.fn(() => undefined),
      } as unknown as Request;

      const result = await controller.resendVerification(
        { email: 'user@example.com' },
        request,
      );

      expect(authService.resendVerification).toHaveBeenCalledWith({
        email: 'user@example.com',
      });
      expect(result.message).toContain('verification link');
    });
  });
});
