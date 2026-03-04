import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  allowSignup: (process.env.ALLOW_SIGNUP || 'false') === 'true',

  jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTtl: process.env.REFRESH_TOKEN_TTL || '30d',

  cookieSecure: (process.env.COOKIE_SECURE || 'false') === 'true',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
} as const;
