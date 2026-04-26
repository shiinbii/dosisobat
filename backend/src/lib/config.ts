const required = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
};

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: required('JWT_SECRET'),
  databaseUrl: required('DATABASE_URL'),

  // Tokens
  userTokenTtlDays: 30,
  adminTokenTtlDays: 1,

  // Subscription
  trialDays: 14,
};
