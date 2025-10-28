const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('👥 Creando usuarios de prueba en producción...\n');

  try {
    // Verificar conexión a la base de datos
    console.log('1. Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // Verificar si ya existen usuarios de prueba
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['ti@test.com', 'admin@test.com', 'user@test.com']
        }
      }
    });

    if (existingUsers.length === 3) {
      console.log('✅ Los usuarios de prueba ya existen en la base de datos');
      console.log('⏭️  Saltando creación de usuarios\n');
      
      // Mostrar usuarios existentes
      for (const user of existingUsers) {
        console.log(`   • ${user.email} (${user.role}) - ID: ${user.id}`);
      }
      return;
    }

    // Datos de usuarios de prueba
    const testUsers = [
      {
        id: 'user_ti_test',
        clerkId: 'user_33SQ3k9daADwzexJSS23utCpPqr',
        email: 'ti@test.com',
        firstName: 'TI',
        lastName: 'Test',
        role: 'TI',
        isActive: true
      },
      {
        id: 'user_admin_test',
        clerkId: 'user_33bf957OvyQP9DxufYeP7EeKWP8',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN',
        isActive: true
      },
      {
        id: 'user_user_test',
        clerkId: 'user_34Z5esFYazEGrGfCua4vMHBIcPj',
        email: 'user@test.com',
        firstName: 'User',
        lastName: 'Test',
        role: 'USER',
        isActive: true
      }
    ];

    console.log('2. Creando usuarios de prueba...\n');

    for (const userData of testUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { clerkId: userData.clerkId },
              { email: userData.email }
            ]
          }
        });

        if (existingUser) {
          console.log(`   ⚠️  Usuario ${userData.email} ya existe - actualizando...`);
          
          // Actualizar usuario existente
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              clerkId: userData.clerkId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              isActive: userData.isActive,
              updatedAt: new Date()
            }
          });
          
          console.log(`   ✅ Usuario ${userData.email} actualizado exitosamente`);
        } else {
          // Crear nuevo usuario
          await prisma.user.create({
            data: userData
          });
          
          console.log(`   ✅ Usuario ${userData.email} creado exitosamente`);
        }
      } catch (error) {
        console.log(`   ❌ Error con usuario ${userData.email}: ${error.message}`);
      }
    }

    console.log('\n3. Verificando usuarios creados...\n');

    // Verificar que los usuarios se crearon correctamente
    for (const userData of testUsers) {
      try {
        const user = await prisma.user.findFirst({
          where: { clerkId: userData.clerkId }
        });

        if (user) {
          console.log(`   ✅ ${user.email} (${user.role}) - ID: ${user.id}`);
        } else {
          console.log(`   ❌ Usuario ${userData.email} no encontrado`);
        }
      } catch (error) {
        console.log(`   ❌ Error verificando ${userData.email}: ${error.message}`);
      }
    }

    console.log('\n✅ Usuarios de prueba creados exitosamente!');
    console.log('\n📋 RESUMEN:');
    console.log('   • TI Test: ti@test.com (user_33SQ3k9daADwzexJSS23utCpPqr)');
    console.log('   • Admin Test: admin@test.com (user_33bf957OvyQP9DxufYeP7EeKWP8)');
    console.log('   • User Test: user@test.com (user_34Z5esFYazEGrGfCua4vMHBIcPj)');
    console.log('\n🔐 Los usuarios ya están configurados en Clerk con las contraseñas proporcionadas');
    console.log('🚀 Puedes iniciar sesión en producción con cualquiera de estos usuarios');

  } catch (error) {
    console.error('❌ Error durante la creación de usuarios:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar creación de usuarios
createTestUsers();
