import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { authenticateAdmin } from '../lib/auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    currentAdmin?: { id: string; email: string; name: string };
  }
}

export function adminAuthHook(fastify: FastifyInstance) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'MISSING_TOKEN' });
    }
    const token = auth.slice(7);
    try {
      const admin = await authenticateAdmin(token, fastify);
      req.currentAdmin = { id: admin.id, email: admin.email, name: admin.name };
    } catch (err: any) {
      return reply.code(err?.status ?? 401).send({ error: err?.code ?? 'INVALID_TOKEN' });
    }
  };
}
