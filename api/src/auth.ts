import type { FastifyRequest } from 'fastify';

export async function requireAuth(request: FastifyRequest) {
  try {
    // O @fastify/jwt já valida o token a partir do header Authorization (Bearer)
    // e popula request.user com o payload decodificado.
    await request.jwtVerify();
  } catch {
    const err: any = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}
