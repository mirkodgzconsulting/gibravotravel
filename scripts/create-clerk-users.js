const { Clerk } = require('@clerk/clerk-sdk-node');

/**
 * SCRIPT PARA CREAR USUARIOS EN CLERK
 * 
 * Este script crea usuarios directamente en Clerk usando la API
 * y luego sincroniza los clerkId con la base de datos.
 * 
 * REQUISITO: Necesitas tu CLERK_SECRET_KEY en el archivo .env.local
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function createClerkUsers() {
  console.log('🔐 CREANDO USUARIOS EN CLERK...\n');
  
  try {
    // Verificar que existe CLERK_SECRET_KEY
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    if (!clerkSecretKey) {
      console.error('❌ ERROR: CLERK_SECRET_KEY no encontrado en .env.local');
      console.log('\n📋 PASOS PARA OBTENER CLERK_SECRET_KEY:');
      console.log('─'.repeat(60));
      console.log('1. Ve a: https://dashboard.clerk.com');
      console.log('2. Selecciona tu aplicación');
      console.log('3. Ve a "API Keys" en el menú lateral');
      console.log('4. Copia el "Secret Key"');
      console.log('5. Añádelo a tu archivo .env.local:');
      console.log('   CLERK_SECRET_KEY=sk_test_...');
      console.log('─'.repeat(60));
      return;
    }

    const clerk = new Clerk({ secretKey: clerkSecretKey });

    // ========================================
    // USUARIOS A CREAR
    // ========================================
    const usersToCreate = [
      {
        email: 'ti@test.com',
        password: 'test2025//@',
        firstName: 'TI',
        lastName: 'Test',
        role: 'TI'
      },
      {
        email: 'admin@test.com',
        password: '0.vj1yuc3szpA1!',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN'
      },
      {
        email: 'user@test.com',
        password: 'test2065//@',
        firstName: 'User',
        lastName: 'Test',
        role: 'USER'
      }
    ];

    const createdUsers = [];

    // ========================================
    // CREAR USUARIOS EN CLERK
    // ========================================
    console.log('📝 Creando usuarios en Clerk...\n');

    for (const userData of usersToCreate) {
      try {
        console.log(`🔄 Creando usuario: ${userData.email}...`);
        
        // Verificar si el usuario ya existe
        const existingUsers = await clerk.users.getUserList({
          emailAddress: [userData.email]
        });

        if (existingUsers.data && existingUsers.data.length > 0) {
          console.log(`   ⚠️  Usuario ya existe en Clerk`);
          console.log(`   ClerkId: ${existingUsers.data[0].id}`);
          createdUsers.push({
            ...userData,
            clerkId: existingUsers.data[0].id,
            existed: true
          });
          continue;
        }

        // Crear usuario en Clerk
        const clerkUser = await clerk.users.createUser({
          emailAddress: [userData.email],
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          skipPasswordChecks: true, // Permitir contraseñas personalizadas
          skipPasswordRequirement: false
        });

        console.log(`   ✅ Usuario creado exitosamente`);
        console.log(`   ClerkId: ${clerkUser.id}`);

        createdUsers.push({
          ...userData,
          clerkId: clerkUser.id,
          existed: false
        });

      } catch (error) {
        console.error(`   ❌ Error creando usuario ${userData.email}:`, error.message);
      }
    }

    // ========================================
    // SINCRONIZAR CON BASE DE DATOS
    // ========================================
    if (createdUsers.length > 0) {
      console.log('\n🔄 Sincronizando con base de datos...\n');
      
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      for (const user of createdUsers) {
        try {
          const dbUser = await prisma.user.findFirst({
            where: { email: user.email }
          });

          if (dbUser) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                clerkId: user.clerkId,
                firstName: user.firstName,
                lastName: user.lastName
              }
            });
            console.log(`✅ Usuario sincronizado en BD: ${user.email}`);
          } else {
            // Crear usuario en BD si no existe
            await prisma.user.create({
              data: {
                clerkId: user.clerkId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: true
              }
            });
            console.log(`✅ Usuario creado en BD: ${user.email}`);
          }
        } catch (error) {
          console.error(`❌ Error sincronizando ${user.email}:`, error.message);
        }
      }

      await prisma.$disconnect();
    }

    // ========================================
    // RESUMEN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(60));

    console.log('\n📊 USUARIOS CREADOS/VERIFICADOS:');
    console.log('─'.repeat(60));
    createdUsers.forEach(user => {
      const icon = user.role === 'ADMIN' ? '👑' : user.role === 'TI' ? '🔧' : '👤';
      const status = user.existed ? '(ya existía)' : '(nuevo)';
      console.log(`\n${icon} ${user.role} ${status}`);
      console.log(`   Email:     ${user.email}`);
      console.log(`   Password:  ${user.password}`);
      console.log(`   ClerkId:   ${user.clerkId}`);
    });
    console.log('─'.repeat(60));

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Ve a http://localhost:3000');
    console.log('   2. Haz clic en "Sign In"');
    console.log('   3. Inicia sesión con cualquiera de estos usuarios');
    console.log('   4. ¡El sistema debería funcionar correctamente!');

  } catch (error) {
    console.error('\n❌ ERROR GENERAL:');
    console.error(error);
    throw error;
  }
}

// Ejecutar
createClerkUsers()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });

