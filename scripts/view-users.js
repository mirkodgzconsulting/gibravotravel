const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgres://3e4272eaae6e7376a88ecd0a501e18a40f444d4ec789dc8067f503bfa52df05a:sk_ueHlBxp9PCds7r8gHoj03@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function viewUsers() {
  try {
    console.log('🔍 Usuarios en la base de datos:\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
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
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Clerk ID: ${user.clerkId}`);
        console.log(`   👤 Rol: ${user.role}`);
        console.log(`   ✅ Activo: ${user.isActive ? 'Sí' : 'No'}`);
        console.log(`   📅 Creado: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

viewUsers();
