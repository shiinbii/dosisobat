import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';
import { adminAuthHook } from '../middleware/adminAuth.js';
import { config } from '../lib/config.js';

const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const FormInput = z.object({
  type: z.string().min(1),
  strength: z.string().min(1),
  amountMg: z.number().nullable().optional(),
  perMl: z.number().nullable().optional(),
  packaging: z.string().nullable().optional(),
});

const DrugInput = z.object({
  name: z.string().min(1),
  brandNames: z.string().optional().default(''),
  category: z.string().min(1),
  routes: z.string().min(1),
  composition: z.string().nullable().optional(),
  indication: z.string().nullable().optional(),
  contraindication: z.string().nullable().optional(),
  sideEffects: z.string().nullable().optional(),
  warning: z.string().nullable().optional(),
  pediMgPerKgDose: z.number().nullable().optional(),
  pediMgPerKgDay: z.number().nullable().optional(),
  pediMaxPerDose: z.number().nullable().optional(),
  pediMaxPerDay: z.number().nullable().optional(),
  pediFreqPerDay: z.number().int().nullable().optional(),
  pediMinAgeMonths: z.number().int().nullable().optional(),
  pediNotes: z.string().nullable().optional(),
  adultDoseMin: z.number().nullable().optional(),
  adultDoseMax: z.number().nullable().optional(),
  adultMaxPerDay: z.number().nullable().optional(),
  adultFreqPerDay: z.number().int().nullable().optional(),
  adultNotes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  forms: z.array(FormInput).default([]),
});

const Icd10Input = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  descriptionId: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function adminRoutes(fastify: FastifyInstance) {
  // ---- POST /admin/login ----
  fastify.post('/admin/login', async (req, reply) => {
    const body = AdminLoginSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION' });
    const admin = await prisma.adminUser.findUnique({ where: { email: body.data.email } });
    if (!admin || !admin.isActive) return reply.code(401).send({ error: 'INVALID_CREDENTIALS' });
    const ok = await verifyPassword(body.data.password, admin.password);
    if (!ok) return reply.code(401).send({ error: 'INVALID_CREDENTIALS' });
    const token = await fastify.jwt.sign(
      { sub: admin.id, type: 'admin' },
      { expiresIn: `${config.adminTokenTtlDays}d` }
    );
    return reply.send({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  });

  // ---- everything below requires admin auth ----
  const protectedScope = async (scope: FastifyInstance) => {
    scope.addHook('preHandler', adminAuthHook(fastify));

    // Drugs CRUD
    scope.get('/admin/drugs', async (_req, reply) => {
      const drugs = await prisma.drug.findMany({
        orderBy: { nameLower: 'asc' },
        include: { forms: true },
      });
      return reply.send({ items: drugs });
    });

    scope.post('/admin/drugs', async (req, reply) => {
      const body = DrugInput.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'VALIDATION', details: body.error.flatten() });
      const { forms, ...d } = body.data;
      const created = await prisma.drug.create({
        data: {
          ...d,
          nameLower: d.name.toLowerCase().trim(),
          forms: { create: forms },
        },
        include: { forms: true },
      });
      return reply.code(201).send(created);
    });

    scope.put<{ Params: { id: string } }>('/admin/drugs/:id', async (req, reply) => {
      const body = DrugInput.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'VALIDATION', details: body.error.flatten() });
      const { forms, ...d } = body.data;
      const updated = await prisma.drug.update({
        where: { id: req.params.id },
        data: {
          ...d,
          nameLower: d.name.toLowerCase().trim(),
          version: { increment: 1 },
          forms: {
            deleteMany: {},
            create: forms,
          },
        },
        include: { forms: true },
      });
      return reply.send(updated);
    });

    scope.delete<{ Params: { id: string } }>('/admin/drugs/:id', async (req, reply) => {
      await prisma.drug.update({
        where: { id: req.params.id },
        data: { isActive: false, version: { increment: 1 } },
      });
      return reply.send({ ok: true });
    });

    // ICD-10 CRUD
    scope.get('/admin/icd10', async (_req, reply) => {
      const items = await prisma.icd10.findMany({ orderBy: { code: 'asc' } });
      return reply.send({ items });
    });

    scope.post('/admin/icd10', async (req, reply) => {
      const body = Icd10Input.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'VALIDATION', details: body.error.flatten() });
      const created = await prisma.icd10.upsert({
        where: { code: body.data.code },
        create: body.data,
        update: body.data,
      });
      return reply.code(201).send(created);
    });

    scope.put<{ Params: { code: string } }>('/admin/icd10/:code', async (req, reply) => {
      const body = Icd10Input.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'VALIDATION', details: body.error.flatten() });
      const updated = await prisma.icd10.update({
        where: { code: req.params.code },
        data: body.data,
      });
      return reply.send(updated);
    });

    scope.delete<{ Params: { code: string } }>('/admin/icd10/:code', async (req, reply) => {
      await prisma.icd10.update({
        where: { code: req.params.code },
        data: { isActive: false },
      });
      return reply.send({ ok: true });
    });

    // Users (read-only)
    scope.get('/admin/users', async (_req, reply) => {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, name: true, profession: true,
          trialEndsAt: true, isActive: true, createdAt: true, currentSessionId: true,
          subscriptions: { orderBy: { endsAt: 'desc' }, take: 1 },
        },
      });
      return reply.send({ items: users });
    });

    // Manually grant subscription (for now until payment integration)
    const GrantSchema = z.object({
      userId: z.string().min(1),
      plan: z.enum(['MONTHLY', 'YEARLY']),
      months: z.number().int().min(1).max(36).default(1),
    });
    scope.post('/admin/subscriptions/grant', async (req, reply) => {
      const body = GrantSchema.safeParse(req.body);
      if (!body.success) return reply.code(400).send({ error: 'VALIDATION', details: body.error.flatten() });
      const endsAt = new Date(Date.now() + body.data.months * 30 * 24 * 60 * 60 * 1000);
      const sub = await prisma.subscription.create({
        data: {
          userId: body.data.userId,
          plan: body.data.plan,
          status: 'ACTIVE',
          startsAt: new Date(),
          endsAt,
        },
      });
      return reply.code(201).send(sub);
    });

    // Force logout a user (revoke all sessions)
    scope.post<{ Params: { id: string } }>('/admin/users/:id/force-logout', async (req, reply) => {
      await prisma.session.updateMany({
        where: { userId: req.params.id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'ADMIN_REVOKE' },
      });
      await prisma.user.update({
        where: { id: req.params.id },
        data: { currentSessionId: null },
      });
      return reply.send({ ok: true });
    });
  };

  fastify.register(protectedScope);
}
