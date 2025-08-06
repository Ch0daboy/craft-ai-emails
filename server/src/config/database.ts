import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Global Prisma client instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Initialize Prisma client
export const prisma = globalThis.__prisma || new PrismaClient();

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Basic initialization logging
logger.info('Prisma client configured');

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed gracefully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

// Handle graceful shutdown
process.on('SIGINT', disconnectDatabase);
process.on('SIGTERM', disconnectDatabase);

export default prisma;