import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  reconnectAttempts: number
  lastReconnectTime: number
}

// Inicializar contadores globales
if (!globalForPrisma.reconnectAttempts) {
  globalForPrisma.reconnectAttempts = 0
  globalForPrisma.lastReconnectTime = 0
}

// Crear una instancia de PrismaClient con configuración optimizada
const createPrismaClient = () => {
  // PRIORIZAR PRISMA_DATABASE_URL sobre DATABASE_URL
  // DATABASE_URL apunta a db.prisma.io:5432 que no existe
  const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
  
  console.log('🔍 Using database URL from:', process.env.PRISMA_DATABASE_URL ? 'PRISMA_DATABASE_URL' : 'DATABASE_URL');
  
  // Agregar parámetros de conexión para prevenir "too many connections"
  // Plan gratuito de Prisma Postgres: usar límite bajo (3 conexiones)
  // Esto ayuda a evitar suspensiones por exceso de uso
  const connectionLimit = process.env.NODE_ENV === 'production' ? 3 : 5;
  const poolTimeout = 10;
  
  const urlWithParams = databaseUrl?.includes('?') 
    ? `${databaseUrl}&connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`
    : `${databaseUrl}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: urlWithParams,
      },
    },
  })
}

// Singleton pattern para desarrollo y producción
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Siempre guardar en globalThis, incluso en producción
globalForPrisma.prisma = prisma

// Función de recuperación automática
export async function reconnectPrisma() {
  const now = Date.now()
  const timeSinceLastReconnect = now - globalForPrisma.lastReconnectTime
  
  // Limitar reintentos: máximo 3 intentos por minuto
  if (globalForPrisma.reconnectAttempts >= 3 && timeSinceLastReconnect < 60000) {
    console.log('⚠️ [Prisma] Too many reconnection attempts, waiting...')
    return
  }
  
  // Resetear contador si pasó más de 1 minuto
  if (timeSinceLastReconnect > 60000) {
    globalForPrisma.reconnectAttempts = 0
  }
  
  globalForPrisma.reconnectAttempts++
  globalForPrisma.lastReconnectTime = now
  
  console.log(`🔄 [Prisma] Attempting to reconnect (attempt ${globalForPrisma.reconnectAttempts}/3)...`)
  
  try {
    // Guardar referencia a la instancia anterior
    const oldPrisma = globalForPrisma.prisma
    
    // Crear nueva instancia SIN desconectar la anterior
    // Esto permite que queries en curso terminen normalmente
    const newPrisma = createPrismaClient()
    
    // Verificar que la nueva conexión funcione
    await newPrisma.$queryRaw`SELECT 1`
    
    // Actualizar la referencia global
    globalForPrisma.prisma = newPrisma
    
    console.log('✅ [Prisma] Successfully reconnected to database (new instance created)')
    
    // Desconectar la instancia anterior después de un breve delay
    // Esto permite que queries en curso terminen
    if (oldPrisma) {
      setTimeout(async () => {
        try {
          await oldPrisma.$disconnect()
          console.log('✅ [Prisma] Old instance disconnected cleanly')
        } catch (error) {
          console.error('⚠️ [Prisma] Error disconnecting old instance:', error)
        }
      }, 2000) // Esperar 2 segundos para que queries terminen
    }
    
    return newPrisma
  } catch (error) {
    console.error('❌ [Prisma] Failed to reconnect:', error)
    throw error
  }
}

// Manejar desconexión al cerrar
if (typeof window === 'undefined') {
  const shutdown = async () => {
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect()
    }
  }
  
  process.on('beforeExit', shutdown)
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}