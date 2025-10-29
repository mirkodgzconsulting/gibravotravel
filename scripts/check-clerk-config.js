const { PrismaClient } = require('@prisma/client');
const { createClerkClient } = require('@clerk/backend');

const prisma = new PrismaClient();

async function checkClerkConfig() {
  console.log('🔍 VERIFICANDO CONFIGURACIÓN DE CLERK');
  console.log('=====================================');

  try {
    // 1. Verificar variables de entorno
    console.log('\n1. Verificando variables de entorno...');
    console.log('   CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA');
    console.log('   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   VERCEL:', process.env.VERCEL);

    if (!process.env.CLERK_SECRET_KEY) {
      console.log('\n❌ CLERK_SECRET_KEY no está configurada en producción');
      console.log('   Necesitas configurar esta variable en Vercel');
      return;
    }

    // 2. Probar conexión con Clerk
    console.log('\n2. Probando conexión con Clerk...');
    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Intentar obtener la lista de usuarios (esto prueba la conexión)
      const users = await clerk.users.getUserList({ limit: 1 });
      console.log('   ✅ Conexión con Clerk exitosa');
      console.log(`   📊 Usuarios en Clerk: ${users.totalCount || 'No disponible'}`);
    } catch (clerkError) {
      console.log('   ❌ Error conectando con Clerk:', clerkError.message);
      
      if (clerkError.message.includes('Invalid API key')) {
        console.log('   🔧 La clave de Clerk es inválida o incorrecta');
      } else if (clerkError.message.includes('Forbidden')) {
        console.log('   🔧 La clave de Clerk no tiene permisos suficientes');
      } else {
        console.log('   🔧 Error desconocido:', clerkError.message);
      }
      return;
    }

    // 3. Probar creación de usuario de prueba
    console.log('\n3. Probando creación de usuario de prueba...');
    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const testEmail = `test-${Date.now()}@example.com`;
      const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!';

      console.log(`   📧 Email de prueba: ${testEmail}`);
      console.log(`   🔑 Password temporal: ${temporaryPassword}`);

      const testUser = await clerk.users.createUser({
        emailAddress: [testEmail],
        firstName: 'Test',
        lastName: 'User',
        password: temporaryPassword,
        skipPasswordChecks: true,
        publicMetadata: {
          role: 'USER',
          phoneNumber: '+1234567890',
        },
      });

      console.log('   ✅ Usuario de prueba creado exitosamente en Clerk');
      console.log(`   🆔 Clerk ID: ${testUser.id}`);

      // Limpiar usuario de prueba
      await clerk.users.deleteUser(testUser.id);
      console.log('   🧹 Usuario de prueba eliminado');

    } catch (testError) {
      console.log('   ❌ Error creando usuario de prueba:', testError.message);
      
      if (testError.message.includes('User already exists')) {
        console.log('   🔧 El usuario ya existe (esto es normal)');
      } else if (testError.message.includes('Invalid email')) {
        console.log('   🔧 Email inválido');
      } else {
        console.log('   🔧 Error desconocido:', testError.message);
      }
    }

    // 4. Verificar usuarios en base de datos
    console.log('\n4. Verificando usuarios en base de datos...');
    try {
      const dbUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });

      console.log(`   📊 Usuarios en BD: ${dbUsers.length}`);
      dbUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`      Clerk ID: ${user.clerkId}`);
        console.log(`      Rol: ${user.role}`);
        console.log(`      Creado: ${user.createdAt.toISOString()}`);
      });

    } catch (dbError) {
      console.log('   ❌ Error consultando base de datos:', dbError.message);
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClerkConfig();
