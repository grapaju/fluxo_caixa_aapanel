import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { apiRoutes } from './routes/api.js';

const app = Fastify({ logger: true });

await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
await app.register(cors, {
  origin: config.corsOrigin,
  credentials: true,
});

await app.register(cookie, {
  secret: config.jwtRefreshSecret,
  hook: 'onRequest',
  parseOptions: {},
});

await app.register(jwt, {
  secret: config.jwtAccessSecret,
});

app.get('/health', async () => ({ ok: true }));

await app.register(authRoutes, { prefix: '/auth' });
await app.register(apiRoutes, { prefix: '/api' });

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode && typeof error.statusCode === 'number' ? error.statusCode : 500;
  reply.status(statusCode).send({ message: error.message || 'Internal error' });
});

await app.listen({ port: config.port, host: '0.0.0.0' });
