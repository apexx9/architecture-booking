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
