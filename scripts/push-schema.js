const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const DATABASE_URL = "postgres://3e4272eaae6e7376a88ecd0a501e18a40f444d4ec789dc8067f503bfa52df05a:sk_ueHlBxp9PCds7r8gHoj03@db.prisma.io:5432/postgres?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function pushSchema() {
  try {
    console.log('🚀 Aplicando schema de Prisma a la base de datos...\n');
    
    // Ejecutar prisma db push
    console.log('📝 Ejecutando prisma db push...');
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: DATABASE_URL
      }
    });
    
    console.log('\n✅ Schema aplicado exitosamente!\n');
    
    // Verificar que la tabla clients existe
    console.log('🔍 Verificando tabla clients...');
    
    try {
      const clientCount = await prisma.client.count();
      console.log(`✅ Tabla clients creada correctamente - ${clientCount} registros`);
    } catch (error) {
      console.log('❌ Error al verificar tabla clients:', error.message);
    }
    
    // Verificar todas las tablas
    console.log('\n📊 Estado de todas las tablas:');
    
    const users = await prisma.user.count();
    const clients = await prisma.client.count();
    const tourBuses = await prisma.tourBus.count();
    const departures = await prisma.departure.count();
    const info = await prisma.info.count();
    const routes = await prisma.route.count();
    const stops = await prisma.stop.count();
    
    console.log(`👥 Users: ${users} registros`);
    console.log(`👤 Clients: ${clients} registros`);
    console.log(`🚌 TourBuses: ${tourBuses} registros`);
    console.log(`🚀 Departures: ${departures} registros`);
    console.log(`ℹ️ Info: ${info} registros`);
    console.log(`🛣️ Routes: ${routes} registros`);
    console.log(`🚏 Stops: ${stops} registros`);

  } catch (error) {
    console.error('❌ Error aplicando schema:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

pushSchema();
