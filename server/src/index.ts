import { buildApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const app = buildApp();

const server = app.listen(env.PORT, () => {
  console.log(`[sofia-shop] API listening on http://localhost:${env.PORT}`);
  console.log(`[sofia-shop] mode=${env.NODE_ENV}`);
});

const shutdown = async (signal: string) => {
  console.log(`\n[sofia-shop] received ${signal}, shutting down...`);
  server.close(async (err) => {
    if (err) console.error(err);
    await prisma.$disconnect();
    process.exit(err ? 1 : 0);
  });
  // Force exit after 10s.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
