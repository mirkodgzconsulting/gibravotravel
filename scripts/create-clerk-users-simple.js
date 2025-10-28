// Cargar variables de entorno
require('dotenv').config({ path: '.env' });

const { Clerk } = require('@clerk/clerk-sdk-node');

async function createUsers() {
  console.log('🔐 CREANDO USUARIOS EN CLERK...\n');
  
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  console.log('🔑 CLERK_SECRET_KEY encontrada:', clerkSecretKey ? 'Sí ✅' : 'No ❌');
  
  if (!clerkSecretKey) {
    console.error('❌ No se encontró CLERK_SECRET_KEY');
    return;
  }

  const clerk = new Clerk({ secretKey: clerkSecretKey });

  const users = [
    {
      emailAddress: ['ti@test.com'],
      password: 'test2025//@',
      firstName: 'TI',
      lastName: 'Test',
      role: 'TI'
    },
    {
      emailAddress: ['admin@test.com'],
      password: '0.vj1yuc3szpA1!',
      firstName: 'Admin',
      lastName: 'Test',
      role: 'ADMIN'
    },
    {
      emailAddress: ['user@test.com'],
      password: 'test2065//@',
      firstName: 'User',
      lastName: 'Test',
      role: 'USER'
    }
  ];

  for (const userData of users) {
    try {
      console.log(`\n🔄 Creando usuario: ${userData.emailAddress[0]}...`);
      
      // Verificar si ya existe
      try {
        const existingUsers = await clerk.users.getUserList({
          emailAddress: userData.emailAddress
        });

        if (existingUsers.data && existingUsers.data.length > 0) {
          console.log(`   ⚠️  Usuario ya existe`);
          console.log(`   ClerkId: ${existingUsers.data[0].id}`);
          console.log(`   Email: ${existingUsers.data[0].emailAddresses[0].emailAddress}`);
          continue;
        }
      } catch (checkError) {
        console.log(`   ℹ️  No se pudo verificar existencia, intentando crear...`);
      }

      // Crear usuario
      const clerkUser = await clerk.users.createUser({
        emailAddress: userData.emailAddress,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      });

      console.log(`   ✅ Usuario creado exitosamente`);
      console.log(`   ClerkId: ${clerkUser.id}`);
      console.log(`   Email: ${clerkUser.emailAddresses[0].emailAddress}`);

      // Sincronizar con base de datos
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const dbUser = await prisma.user.findFirst({
        where: { email: userData.emailAddress[0] }
      });

      if (dbUser) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            clerkId: clerkUser.id,
            firstName: userData.firstName,
            lastName: userData.lastName
          }
        });
        console.log(`   ✅ Sincronizado con base de datos`);
      }

      await prisma.$disconnect();

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      if (error.errors) {
        console.error('   Detalles:', JSON.stringify(error.errors, null, 2));
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ PROCESO COMPLETADO');
  console.log('='.repeat(60));
  console.log('\n📝 CREDENCIALES:');
  console.log('   ti@test.com - test2025//@');
  console.log('   admin@test.com - 0.vj1yuc3szpA1!');
  console.log('   user@test.com - test2065//@');
}

createUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });



