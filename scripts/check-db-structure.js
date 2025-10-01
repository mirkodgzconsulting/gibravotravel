const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgres://3e4272eaae6e7376a88ecd0a501e18a40f444d4ec789dc8067f503bfa52df05a:sk_ueHlBxp9PCds7r8gHoj03@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function checkDBStructure() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...\n');
    
    // Verificar que la tabla users existe y tiene la estructura correcta
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        photo: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (users.length > 0) {
      const user = users[0];
      console.log('✅ Estructura de la tabla users:');
      console.log('   - id:', typeof user.id, '✅');
      console.log('   - clerkId:', typeof user.clerkId, '✅');
      console.log('   - email:', typeof user.email, '✅');
      console.log('   - firstName:', typeof user.firstName, '✅');
      console.log('   - lastName:', typeof user.lastName, '✅');
      console.log('   - phoneNumber:', typeof user.phoneNumber, '✅');
      console.log('   - photo:', typeof user.photo, '✅');
      console.log('   - role:', typeof user.role, '✅');
      console.log('   - isActive:', typeof user.isActive, '✅');
      console.log('   - createdAt:', typeof user.createdAt, '✅');
      console.log('   - updatedAt:', typeof user.updatedAt, '✅');
      
      console.log('\n📊 Valores de rol disponibles:');
      const allRoles = await prisma.user.findMany({
        select: { role: true },
        distinct: ['role']
      });
      
      allRoles.forEach((u, index) => {
        console.log(`   ${index + 1}. ${u.role}`);
      });
      
      console.log('\n🔍 Usuario específico (user@test.com):');
      const specificUser = await prisma.user.findUnique({
        where: { clerkId: 'user_33SQggnVckEUlVdo4wdvivN5KaW' },
        select: {
          clerkId: true,
          email: true,
          role: true,
          isActive: true
        }
      });
      
      if (specificUser) {
        console.log('   ✅ Usuario encontrado:');
        console.log('   - ClerkId:', specificUser.clerkId);
        console.log('   - Email:', specificUser.email);
        console.log('   - Rol:', specificUser.role, '(tipo:', typeof specificUser.role, ')');
        console.log('   - Activo:', specificUser.isActive);
      } else {
        console.log('   ❌ Usuario NO encontrado');
      }
      
    } else {
      console.log('❌ No hay usuarios en la tabla');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Código de error:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDBStructure();
