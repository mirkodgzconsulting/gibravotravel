import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Crear una instancia de PrismaClient
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
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