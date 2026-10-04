export type NodeEnv = 'development' | 'test' | 'production';

export function isNodeEnv(value: unknown): value is NodeEnv {
  return value === 'development' || value === 'test' || value === 'production';
}

const REQUIRED_VARIABLES = ['DATABASE_URL', 'JWT_ACCESS_SECRET'] as const;

function describeValue(value: unknown): string {
  return value === undefined
    ? 'undefined'
    : (JSON.stringify(value) ?? 'undefined');
}

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const errors: string[] = [];

  for (const key of REQUIRED_VARIABLES) {
    const value = config[key];

    if (value === undefined || value === null || value === '') {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  const nodeEnv = (config.NODE_ENV ?? 'development') as unknown;

  if (!isNodeEnv(nodeEnv)) {
    errors.push(
      `NODE_ENV must be one of: development, test, production (received ${String(nodeEnv)}).`,
    );
  }

  const port = config.PORT === undefined ? 3000 : Number(config.PORT);

  if (Number.isNaN(port) || !Number.isInteger(port) || port <= 0) {
    errors.push(
      `PORT must be a positive integer (received ${String(config.PORT)}).`,
    );
  }

  const sameSite = config.COOKIE_SAME_SITE;

  if (
    sameSite !== undefined &&
    sameSite !== 'lax' &&
    sameSite !== 'strict' &&
    sameSite !== 'none'
  ) {
    errors.push(
      `COOKIE_SAME_SITE must be one of: lax, strict, none (received ${describeValue(sameSite)}).`,
    );
  }

  const cookieSecure = config.COOKIE_SECURE;

  if (
    cookieSecure !== undefined &&
    cookieSecure !== 'true' &&
    cookieSecure !== 'false'
  ) {
    errors.push(
      `COOKIE_SECURE must be either "true" or "false" (received ${describeValue(cookieSecure)}).`,
    );
  }

  /*
   * Every session cookie is issued with `secure` in production, so an explicit
   * `COOKIE_SECURE=false` there means the browser silently discards each
   * Set-Cookie. Nothing errors: requests go out unauthenticated and every
   * protected call comes back 401, which reads as a broken API rather than a
   * cookie misconfiguration. Refuse to start instead.
   */
  if (nodeEnv === 'production' && cookieSecure === 'false') {
    errors.push(
      'COOKIE_SECURE must be "true" in production. Cookies issued without the ' +
        'Secure attribute are dropped over HTTPS, so no session would persist.',
    );
  }

  /*
   * `SameSite=None` is the only value that lets the browser attach session and
   * CSRF cookies to cross-site XHR, and browsers refuse `None` without `Secure`.
   * Setting `none` without `true` produces the same silent total auth failure.
   */
  if (sameSite === 'none' && cookieSecure !== 'true') {
    errors.push(
      'COOKIE_SAME_SITE=none requires COOKIE_SECURE=true. Browsers reject a ' +
        'SameSite=None cookie that is not also Secure.',
    );
  }

  /*
   * Only reachable when the web app and API sit on different registrable
   * domains. `lax` withholds the CSRF cookie from cross-site XHR, so the
   * double-submit check fails on every mutating request, including the email
   * verification call, and the browser reports only "link invalid or expired".
   * Requiring the pair explicitly turns that into a startup error.
   */
  if (nodeEnv === 'production' && sameSite === 'lax' && config.CROSS_SITE === 'true') {
    errors.push(
      'CROSS_SITE=true requires COOKIE_SAME_SITE=none. With lax, the browser ' +
        'will not send the CSRF cookie on cross-site requests and every ' +
        'mutating endpoint will reject them.',
    );
  }

  if (errors.length > 0) {
    throw new Error(
      [
        'Environment configuration is invalid:',
        ...errors.map((error) => `  - ${error}`),
        '',
        'Fix your environment variables before starting the application.',
      ].join('\n'),
    );
  }

  return config;
}
