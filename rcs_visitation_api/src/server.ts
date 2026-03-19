import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './config/logger';

const server = app.listen(env.PORT, async () => {
  try {
    await prisma.$connect();
    logger.info(`✅ Database connected`);
    logger.info(`🚀 RCS Visitation API running on port ${env.PORT}`);
    logger.info(`📖 Environment: ${env.NODE_ENV}`);
  } catch (err) {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  }
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});
