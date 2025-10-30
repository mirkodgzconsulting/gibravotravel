import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Crear una instancia de PrismaClient con configuración optimizada
const createPrismaClient = () => {
  // Si DATABASE_URL existe, usarla. Si no, usar PRISMA_DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL;
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

// Singleton pattern para desarrollo y producción
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Siempre guardar en globalThis, incluso en producción
globalForPrisma.prisma = prisma

// Manejar desconexión al cerrar
if (typeof window === 'undefined') {
  const shutdown = async () => {
    await prisma.$disconnect()
  }
  
  process.on('beforeExit', shutdown)
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}