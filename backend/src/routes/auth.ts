import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, loginUser } from '../lib/auth.js';
import { config } from '../lib/config.js';
import { getSubscriptionStatus } from '../lib/subscription.js';
import { userAuthHook } from '../middleware/userAuth.js';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  profession: z.enum(['DOKTER', 'APOTEKER', 'PERAWAT', 'BIDAN', 'MAHASISWA', 'LAINNYA']).default('LAINNYA'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().min(1),
  deviceName: z.string().optional(),
  platform: z.enum(['ios', 'android', 'web']),
  force: z.boolean().optional(),
});

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  // ---- POST /auth/register ----
  fastify.post('/auth/register', async (req, reply) => {
    const body = RegisterSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION', details: body.error.flatten() });

    const emailLower = body.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { emailLower } });
    if (existing) return reply.code(409).send({ error: 'EMAIL_TAKEN' });

    const trialEndsAt = new Date(Date.now() + config.trialDays * 24 * 60 * 60 * 1000);
    const password = await hashPassword(body.data.password);

    const user = await prisma.user.create({
      data: {
        email: body.data.email.trim(),
        emailLower,
        password,
        name: body.data.name.trim(),
        profession: body.data.profession,
        trialEndsAt,
      },
    });

    return reply.code(201).send({
      id: user.id,
      email: user.email,
      name: user.name,
      profession: user.profession,
      trialEndsAt: user.trialEndsAt,
    });
  });

  // ---- POST /auth/login ----
  fastify.post('/auth/login', async (req, reply) => {
    const body = LoginSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION', details: body.error.flatten() });

    const result = await loginUser({ fastify, ...body.data });

    if (result.kind === 'INVALID') {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' });
    }
    if (result.kind === 'DEVICE_CONFLICT') {
      return reply.code(409).send({
        error: 'DEVICE_CONFLICT',
        message: 'Akun ini sedang aktif di perangkat lain. Logout dari perangkat tersebut atau lakukan force-logout.',
        activeDeviceName: result.activeDeviceName,
        activeDeviceId: result.activeDeviceId,
        activePlatform: result.activePlatform,
      });
    }

    const sub = await getSubscriptionStatus(result.user.id);

    return reply.send({
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        profession: result.user.profession,
        trialEndsAt: result.user.trialEndsAt,
      },
      session: {
        id: result.session.id,
        deviceId: result.session.deviceId,
        deviceName: result.session.deviceName,
      },
      subscription: sub,
    });
  });

  // ---- POST /auth/logout ----
  fastify.post('/auth/logout', { preHandler: userAuthHook(fastify) }, async (req, reply) => {
    if (!req.currentSessionId) return reply.code(401).send({ error: 'UNAUTHENTICATED' });
    await prisma.session.update({
      where: { id: req.currentSessionId },
      data: { revokedAt: new Date(), revokeReason: 'USER_LOGOUT' },
    });
    if (req.currentUser) {
      await prisma.user.update({
        where: { id: req.currentUser.id },
        data: { currentSessionId: null },
      });
    }
    return reply.send({ ok: true });
  });

  // ---- GET /auth/me ----
  fastify.get('/auth/me', { preHandler: userAuthHook(fastify) }, async (req, reply) => {
    if (!req.currentUser) return reply.code(401).send({ error: 'UNAUTHENTICATED' });
    const sub = await getSubscriptionStatus(req.currentUser.id);
    return reply.send({ user: req.currentUser, subscription: sub });
  });

  // ---- POST /auth/change-password ----
  fastify.post('/auth/change-password', { preHandler: userAuthHook(fastify) }, async (req, reply) => {
    if (!req.currentUser) return reply.code(401).send({ error: 'UNAUTHENTICATED' });
    const body = ChangePasswordSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'VALIDATION', details: body.error.flatten() });

    const user = await prisma.user.findUnique({ where: { id: req.currentUser.id } });
    if (!user) return reply.code(404).send({ error: 'USER_NOT_FOUND' });

    const ok = await (await import('../lib/auth.js')).verifyPassword(body.data.oldPassword, user.password);
    if (!ok) return reply.code(401).send({ error: 'WRONG_OLD_PASSWORD' });

    const newHash = await hashPassword(body.data.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
    return reply.send({ ok: true });
  });
}
