import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force new instance in development to ensure schema changes are picked up
export const prisma =
  process.env.NODE_ENV === 'production'
    ? globalForPrisma.prisma ?? new PrismaClient()
    : new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

