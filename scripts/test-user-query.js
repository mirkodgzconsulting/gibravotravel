const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgres://3e4272eaae6e7376a88ecd0a501e18a40f444d4ec789dc8067f503bfa52df05a:sk_ueHlBxp9PCds7r8gHoj03@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function testUserQuery() {
  try {
    const testClerkId = 'user_33SQggnVckEUlVdo4wdvivN5KaW'; // El clerkId del usuario user@test.com
    
    console.log('🔍 Probando consulta para clerkId:', testClerkId);
    
    const user = await prisma.user.findUnique({
      where: { clerkId: testClerkId },
      select: { 
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      console.log('❌ Usuario NO encontrado');
      
      // Buscar todos los usuarios para comparar
      console.log('\n🔍 Todos los usuarios en la DB:');
      const allUsers = await prisma.user.findMany({
        select: {
          clerkId: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
      
      allUsers.forEach((u, index) => {
        console.log(`${index + 1}. Email: ${u.email}, ClerkId: ${u.clerkId}`);
      });
      
    } else {
      console.log('✅ Usuario encontrado:');
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 ClerkId: ${user.clerkId}`);
      console.log(`   👤 Rol: ${user.role}`);
      console.log(`   ✅ Activo: ${user.isActive}`);
      console.log(`   📝 Nombre: ${user.firstName} ${user.lastName}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUserQuery();
