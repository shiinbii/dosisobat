import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { userAuthHook } from '../middleware/userAuth.js';

const SearchQuery = z.object({
  q: z.string().optional(),
  route: z.string().optional(),     // ORAL,INJECTION,...
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function drugRoutes(fastify: FastifyInstance) {
  // All drug endpoints require login (mobile app)
  fastify.addHook('preHandler', userAuthHook(fastify));

  // ---- GET /drugs ----
  fastify.get('/drugs', async (req, reply) => {
    const parsed = SearchQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION', details: parsed.error.flatten() });
    const q = parsed.data;

    const where: any = { isActive: true };
    if (q.q) {
      where.OR = [
        { nameLower: { contains: q.q.toLowerCase() } },
        { brandNames: { contains: q.q, mode: 'insensitive' } },
      ];
    }
    if (q.route) where.routes = { contains: q.route };
    if (q.category) where.category = { contains: q.category, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.drug.findMany({
        where,
        orderBy: { nameLower: 'asc' },
        include: { forms: true },
        take: q.limit,
        skip: q.offset,
      }),
      prisma.drug.count({ where }),
    ]);

    return reply.send({ items, total, limit: q.limit, offset: q.offset });
  });

  // ---- GET /drugs/:id ----
  fastify.get<{ Params: { id: string } }>('/drugs/:id', async (req, reply) => {
    const drug = await prisma.drug.findUnique({
      where: { id: req.params.id },
      include: { forms: true },
    });
    if (!drug || !drug.isActive) return reply.code(404).send({ error: 'NOT_FOUND' });
    return reply.send(drug);
  });

  // ---- GET /drugs/sync ----
  // Returns full active catalog for offline cache.
  // Mobile calls this on startup if `version > local cache version`.
  fastify.get('/drugs/sync', async (_req, reply) => {
    const drugs = await prisma.drug.findMany({
      where: { isActive: true },
      include: { forms: true },
      orderBy: { nameLower: 'asc' },
    });
    const catalogVersion = drugs.reduce((max, d) => Math.max(max, d.version), 0);
    return reply.send({
      version: catalogVersion,
      generatedAt: new Date().toISOString(),
      count: drugs.length,
      items: drugs,
    });
  });
}
