import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './lib/config.js';
import { authRoutes } from './routes/auth.js';
import { drugRoutes } from './routes/drugs.js';
import { icd10Routes } from './routes/icd10.js';
import { adminRoutes } from './routes/admin.js';

async function build() {
  const app = Fastify({
    logger: {
      transport: config.nodeEnv === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: config.jwtSecret });

  app.get('/health', async () => ({
    ok: true,
    service: 'dosis-obat-backend',
    time: new Date().toISOString(),
  }));

  await app.register(authRoutes);
  await app.register(drugRoutes);
  await app.register(icd10Routes);
  await app.register(adminRoutes);

  return app;
}

build()
  .then(async (app) => {
    try {
      await app.listen({ host: '0.0.0.0', port: config.port });
      app.log.info(`🚀 Backend listening on :${config.port}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  });
