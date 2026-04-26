import { prisma } from './prisma.js';

export type SubStatus = {
  isActive: boolean;
  // "TRIAL" | "PAID" | "EXPIRED" | "NONE"
  kind: 'TRIAL' | 'PAID' | 'EXPIRED' | 'NONE';
  endsAt: Date | null;
  // days remaining, negative if expired
  daysRemaining: number | null;
};

/**
 * Determine current subscription/trial status for a user.
 * Active paid subscription wins over trial.
 */
export async function getSubscriptionStatus(userId: string): Promise<SubStatus> {
  const now = new Date();

  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endsAt: { gt: now },
    },
    orderBy: { endsAt: 'desc' },
  });
  if (activeSub) {
    const daysRemaining = Math.ceil((activeSub.endsAt.getTime() - now.getTime()) / 86400000);
    return { isActive: true, kind: 'PAID', endsAt: activeSub.endsAt, daysRemaining };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { isActive: false, kind: 'NONE', endsAt: null, daysRemaining: null };

  if (user.trialEndsAt > now) {
    const daysRemaining = Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / 86400000);
    return { isActive: true, kind: 'TRIAL', endsAt: user.trialEndsAt, daysRemaining };
  }

  return { isActive: false, kind: 'EXPIRED', endsAt: user.trialEndsAt, daysRemaining: 0 };
}
