const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgres://3e4272eaae6e7376a88ecd0a501e18a40f444d4ec789dc8067f503bfa52df05a:sk_ueHlBxp9PCds7r8gHoj03@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      console.log(`✅ Encontrados ${users.length} usuarios:\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Rol: ${user.role}`);
        console.log(`   ✅ Activo: ${user.isActive ? 'Sí' : 'No'}`);
        console.log(`   📅 Creado: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Verificar tablas creadas
    console.log('\n🔍 Verificando tablas creadas...\n');
    
    const departures = await prisma.departure.count();
    const info = await prisma.info.count();
    const routes = await prisma.route.count();
    const stops = await prisma.stop.count();

    console.log(`📊 Partenze/Note: ${departures} registros`);
    console.log(`📊 Info: ${info} registros`);
    console.log(`📊 Percorsi: ${routes} registros`);
    console.log(`📊 Fermate: ${stops} registros`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
