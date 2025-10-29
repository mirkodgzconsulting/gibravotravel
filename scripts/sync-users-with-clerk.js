const { PrismaClient } = require('@prisma/client');
const { createClerkClient } = require('@clerk/backend');

const prisma = new PrismaClient();

async function syncUsersWithClerk() {
  console.log('🔄 SINCRONIZANDO USUARIOS CON CLERK');
  console.log('==================================');

  try {
    // Verificar configuración de Clerk
    if (!process.env.CLERK_SECRET_KEY) {
      console.log('❌ CLERK_SECRET_KEY no está configurada');
      console.log('   Ejecutar: node scripts/setup-production-clerk.js');
      return;
    }

    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // 1. Obtener usuarios de la base de datos
    console.log('\n1. Obteniendo usuarios de la base de datos...');
    const dbUsers = await prisma.user.findMany({
      where: {
        clerkId: {
          startsWith: 'temp_'
        }
      }
    });

    console.log(`   📊 Usuarios con ID temporal: ${dbUsers.length}`);

    if (dbUsers.length === 0) {
      console.log('   ✅ No hay usuarios que necesiten sincronización');
      return;
    }

    // 2. Obtener usuarios de Clerk
    console.log('\n2. Obteniendo usuarios de Clerk...');
    const clerkUsers = await clerk.users.getUserList({ limit: 100 });
    console.log(`   📊 Usuarios en Clerk: ${clerkUsers.totalCount || 0}`);

    // 3. Sincronizar usuarios
    console.log('\n3. Sincronizando usuarios...');
    let successCount = 0;
    let errorCount = 0;

    for (const dbUser of dbUsers) {
      try {
        console.log(`\n   🔄 Procesando: ${dbUser.firstName} ${dbUser.lastName} (${dbUser.email})`);
        
        // Verificar si el usuario ya existe en Clerk
        const existingClerkUser = clerkUsers.data.find(user => 
          user.emailAddresses.some(email => email.emailAddress === dbUser.email)
        );

        if (existingClerkUser) {
          console.log(`   ✅ Usuario ya existe en Clerk: ${existingClerkUser.id}`);
          
          // Actualizar el clerkId en la base de datos
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { clerkId: existingClerkUser.id }
          });
          
          console.log(`   🔄 ClerkId actualizado en BD`);
          successCount++;
          continue;
        }

        // Crear usuario en Clerk
        const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!';
        
        const newClerkUser = await clerk.users.createUser({
          emailAddress: [dbUser.email],
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          password: temporaryPassword,
          skipPasswordChecks: true,
          publicMetadata: {
            role: dbUser.role,
            phoneNumber: dbUser.phoneNumber,
          },
        });

        console.log(`   ✅ Usuario creado en Clerk: ${newClerkUser.id}`);
        console.log(`   🔑 Password temporal: ${temporaryPassword}`);

        // Actualizar el clerkId en la base de datos
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { clerkId: newClerkUser.id }
        });

        console.log(`   🔄 ClerkId actualizado en BD`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error sincronizando usuario: ${error.message}`);
        errorCount++;
      }
    }

    // 4. Resumen
    console.log('\n📊 RESUMEN DE SINCRONIZACIÓN:');
    console.log(`   ✅ Usuarios sincronizados exitosamente: ${successCount}`);
    console.log(`   ❌ Usuarios con errores: ${errorCount}`);
    console.log(`   📊 Total procesados: ${dbUsers.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Sincronización completada');
      console.log('   Los usuarios ahora pueden iniciar sesión con sus credenciales');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncUsersWithClerk();
