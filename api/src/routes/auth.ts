import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { config } from '../config.js';

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function parseTtl(ttl: string): number {
  // suportar "15m", "30d" etc.
  const m = ttl.match(/^(\d+)([smhd])$/);
  if (!m) return 15 * 60;
  const amount = Number(m[1]);
  const unit = m[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * multipliers[unit];
}

const accessTtlSeconds = parseTtl(config.accessTtl);
const refreshTtlSeconds = parseTtl(config.refreshTtl);

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.cookieSecure,
    path: '/auth/refresh',
    domain: config.cookieDomain,
    maxAge: refreshTtlSeconds,
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/signup', async (request, reply) => {
    if (!config.allowSignup) {
      reply.status(403).send({ message: 'Cadastro desabilitado' });
      return;
    }

    const body = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      reply.status(409).send({ message: 'Email já cadastrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({ data: { email: body.email, passwordHash } });

    reply.send({ id: user.id, email: user.email });
  });

  app.post('/login', async (request, reply) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      reply.status(401).send({ message: 'Credenciais inválidas' });
      return;
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      reply.status(401).send({ message: 'Credenciais inválidas' });
      return;
    }

    const accessToken = await reply.jwtSign({ id: user.id, email: user.email }, { expiresIn: accessTtlSeconds });

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTokenHash = sha256(refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
      },
    });

    reply.setCookie('refresh_token', refreshToken, refreshCookieOptions());
    reply.send({ accessToken, user: { id: user.id, email: user.email } });
  });

  app.post('/refresh', async (request, reply) => {
    const refreshToken = (request.cookies as any)?.refresh_token as string | undefined;
    if (!refreshToken) {
      reply.status(401).send({ message: 'No refresh token' });
      return;
    }

    const tokenHash = sha256(refreshToken);
    const record = await prisma.refreshToken.findFirst({ where: { tokenHash, revokedAt: null } });
    if (!record) {
      reply.status(401).send({ message: 'Invalid refresh token' });
      return;
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
      reply.status(401).send({ message: 'Expired refresh token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      reply.status(401).send({ message: 'Invalid refresh token' });
      return;
    }

    // Rotaciona refresh
    await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    const newRefreshToken = crypto.randomBytes(48).toString('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(newRefreshToken),
        expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
      },
    });

    const accessToken = await reply.jwtSign({ id: user.id, email: user.email }, { expiresIn: accessTtlSeconds });
    reply.setCookie('refresh_token', newRefreshToken, refreshCookieOptions());
    reply.send({ accessToken, user: { id: user.id, email: user.email } });
  });

  app.post('/logout', async (request, reply) => {
    const refreshToken = (request.cookies as any)?.refresh_token as string | undefined;
    if (refreshToken) {
      const tokenHash = sha256(refreshToken);
      await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    reply.clearCookie('refresh_token', { ...refreshCookieOptions(), maxAge: 0 });
    reply.send({ ok: true });
  });
}
