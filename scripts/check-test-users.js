const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTestUsers() {
  console.log('🔍 Verificando usuarios de prueba...\n');

  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa\n');

    // Buscar usuarios de prueba
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['ti@test.com', 'admin@test.com', 'user@test.com']
        }
      },
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

    console.log(`📊 Usuarios de prueba encontrados: ${testUsers.length}/3\n`);

    if (testUsers.length === 0) {
      console.log('❌ No se encontraron usuarios de prueba');
      console.log('💡 Ejecuta: npm run create-test-users');
      return;
    }

    // Mostrar usuarios encontrados
    for (const user of testUsers) {
      const status = user.isActive ? '✅ Activo' : '❌ Inactivo';
      console.log(`   ${status} ${user.email} (${user.role})`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Clerk ID: ${user.clerkId}`);
      console.log(`      Creado: ${user.createdAt.toISOString()}\n`);
    }

    // Verificar que todos los usuarios estén presentes
    const expectedEmails = ['ti@test.com', 'admin@test.com', 'user@test.com'];
    const foundEmails = testUsers.map(u => u.email);
    const missingEmails = expectedEmails.filter(email => !foundEmails.includes(email));

    if (missingEmails.length > 0) {
      console.log('⚠️  Usuarios faltantes:');
      for (const email of missingEmails) {
        console.log(`   • ${email}`);
      }
      console.log('\n💡 Ejecuta: npm run create-test-users');
    } else {
      console.log('🎉 Todos los usuarios de prueba están presentes y activos!');
    }

  } catch (error) {
    console.error('❌ Error verificando usuarios:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUsers();
