import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prisma } from './prisma.js';
import { config } from './config.js';
import type { FastifyInstance } from 'fastify';

export type UserTokenPayload = {
  sub: string;       // userId
  jti: string;       // session id
  type: 'user';
};

export type AdminTokenPayload = {
  sub: string;       // adminId
  type: 'admin';
};

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/**
 * Login a user with single-device enforcement.
 * Returns:
 *   - { kind: "OK", token, session, user }  → success
 *   - { kind: "DEVICE_CONFLICT", activeDeviceName, activeDeviceId }
 *       → another device is active. Caller can retry with `force: true` to take over.
 */
export async function loginUser(opts: {
  fastify: FastifyInstance;
  email: string;
  password: string;
  deviceId: string;
  deviceName?: string;
  platform: string;
  force?: boolean;
}) {
  const emailLower = opts.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { emailLower },
    include: { sessions: { where: { revokedAt: null }, orderBy: { lastSeenAt: 'desc' }, take: 1 } },
  });
  if (!user || !user.isActive) {
    return { kind: 'INVALID' as const };
  }
  const ok = await verifyPassword(opts.password, user.password);
  if (!ok) return { kind: 'INVALID' as const };

  // Single-device check
  const active = user.sessions[0];
  if (active && active.deviceId !== opts.deviceId && !opts.force) {
    return {
      kind: 'DEVICE_CONFLICT' as const,
      activeDeviceName: active.deviceName ?? 'Unknown device',
      activeDeviceId: active.deviceId,
      activePlatform: active.platform,
    };
  }

  // Revoke any existing active sessions
  if (active) {
    await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'REPLACED_BY_NEW_LOGIN' },
    });
  }

  // Create new session
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + config.userTokenTtlDays * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      jti,
      deviceId: opts.deviceId,
      deviceName: opts.deviceName,
      platform: opts.platform,
      expiresAt,
    },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { currentSessionId: session.id },
  });

  const token = await opts.fastify.jwt.sign(
    { sub: user.id, jti, type: 'user' } as UserTokenPayload,
    { expiresIn: `${config.userTokenTtlDays}d` }
  );

  return {
    kind: 'OK' as const,
    token,
    session,
    user,
  };
}

/**
 * Verify user access token & active session.
 * Returns user + session, or throws "code" error.
 */
export async function authenticateUser(token: string, fastify: FastifyInstance) {
  let payload: UserTokenPayload;
  try {
    payload = (await fastify.jwt.verify(token)) as UserTokenPayload;
  } catch {
    throw { code: 'INVALID_TOKEN', status: 401 };
  }
  if (payload.type !== 'user') throw { code: 'INVALID_TOKEN', status: 401 };

  const session = await prisma.session.findUnique({
    where: { jti: payload.jti },
    include: { user: true },
  });
  if (!session) throw { code: 'SESSION_NOT_FOUND', status: 401 };
  if (session.revokedAt) throw { code: 'SESSION_REVOKED', status: 401, reason: session.revokeReason };
  if (session.expiresAt < new Date()) throw { code: 'SESSION_EXPIRED', status: 401 };
  if (session.user.currentSessionId !== session.id) {
    throw { code: 'SESSION_REPLACED', status: 401 };
  }

  // Best-effort heartbeat (do not block the request on failure)
  prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});

  return { user: session.user, session };
}

export async function authenticateAdmin(token: string, fastify: FastifyInstance) {
  let payload: AdminTokenPayload;
  try {
    payload = (await fastify.jwt.verify(token)) as AdminTokenPayload;
  } catch {
    throw { code: 'INVALID_TOKEN', status: 401 };
  }
  if (payload.type !== 'admin') throw { code: 'INVALID_TOKEN', status: 401 };
  const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
  if (!admin || !admin.isActive) throw { code: 'ADMIN_INACTIVE', status: 401 };
  return admin;
}
