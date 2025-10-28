const { PrismaClient } = require('@prisma/client');

async function fixDatabaseConnections() {
  console.log('🔧 Verificando conexiones de base de datos...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error'],
  });

  try {
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos exitosa');
    
    // Verificar estado de la base de datos
    const userCount = await prisma.user.count();
    console.log(`📊 Usuarios en la base de datos: ${userCount}`);
    
    // Cerrar conexión limpiamente
    await prisma.$disconnect();
    console.log('✅ Conexión cerrada correctamente');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.message.includes('too many clients')) {
      console.log('💡 Solución: Reinicia el servidor PostgreSQL o ajusta max_connections');
      console.log('   - En PostgreSQL: ALTER SYSTEM SET max_connections = 200;');
      console.log('   - Reinicia el servidor de desarrollo');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabaseConnections().catch(console.error);
