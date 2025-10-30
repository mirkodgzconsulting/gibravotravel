import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Crear una instancia de PrismaClient con configuración optimizada
const createPrismaClient = () => {
  // PRIORIZAR PRISMA_DATABASE_URL sobre DATABASE_URL
  // DATABASE_URL apunta a db.prisma.io:5432 que no existe
  const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
  
  console.log('🔍 Using database URL from:', process.env.PRISMA_DATABASE_URL ? 'PRISMA_DATABASE_URL' : 'DATABASE_URL');
  
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