import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { userAuthHook } from '../middleware/userAuth.js';

const Q = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function icd10Routes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', userAuthHook(fastify));

  fastify.get('/icd10', async (req, reply) => {
    const parsed = Q.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION', details: parsed.error.flatten() });
    const q = parsed.data;

    const where: any = { isActive: true };
    if (q.q) {
      where.OR = [
        { code: { contains: q.q.toUpperCase() } },
        { description: { contains: q.q, mode: 'insensitive' } },
        { descriptionId: { contains: q.q, mode: 'insensitive' } },
      ];
    }
    if (q.category) where.category = q.category;

    const [items, total] = await Promise.all([
      prisma.icd10.findMany({
        where,
        orderBy: { code: 'asc' },
        take: q.limit,
        skip: q.offset,
      }),
      prisma.icd10.count({ where }),
    ]);

    return reply.send({ items, total, limit: q.limit, offset: q.offset });
  });

  fastify.get('/icd10/sync', async (_req, reply) => {
    const items = await prisma.icd10.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
    return reply.send({
      generatedAt: new Date().toISOString(),
      count: items.length,
      items,
    });
  });
}
