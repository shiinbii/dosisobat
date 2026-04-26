import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { authenticateUser } from '../lib/auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: {
      id: string;
      email: string;
      name: string;
      profession: string;
    };
    currentSessionId?: string;
  }
}

export function userAuthHook(fastify: FastifyInstance) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'MISSING_TOKEN' });
    }
    const token = auth.slice(7);
    try {
      const { user, session } = await authenticateUser(token, fastify);
      req.currentUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        profession: user.profession,
      };
      req.currentSessionId = session.id;
    } catch (err: any) {
      const status = err?.status ?? 401;
      const code = err?.code ?? 'INVALID_TOKEN';
      const reason = err?.reason;
      return reply.code(status).send({ error: code, reason });
    }
  };
}
