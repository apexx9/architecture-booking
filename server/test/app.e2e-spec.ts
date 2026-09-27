import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '@/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /auth/csrf returns a CSRF token', async () => {
    const response = await request(app.getHttpServer()).get('/auth/csrf');

    expect(response.status).toBe(200);
    expect(typeof response.body.csrfToken).toBe('string');
    expect(response.body.csrfToken).toHaveLength(64);
  });

  it('GET /auth/me rejects a request without an access token', async () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('POST /auth/login rejects a request without a CSRF token', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'Password123' })
      .expect(401);
  });

  it('POST /auth/login rejects an invalid request body', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .set('x-csrf-token', 'token')
      .set('Cookie', ['csrf_token=token'])
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  it('POST /auth/register rejects a weak password', async () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .set('x-csrf-token', 'token')
      .set('Cookie', ['csrf_token=token'])
      .send({ email: 'user@example.com', password: 'short' })
      .expect(400);
  });

  it('POST /auth/register rejects a password without letters', async () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .set('x-csrf-token', 'token')
      .set('Cookie', ['csrf_token=token'])
      .send({ email: 'user@example.com', password: '1234567890' })
      .expect(400);
  });

  it('GET / unknown route returns 404', async () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  it('POST /auth/login rate-limits brute-force attempts', async () => {
    const httpServer = app.getHttpServer();

    let lastStatus = 0;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'Password123' });

      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
  });
});
