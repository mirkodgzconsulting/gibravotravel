const { PrismaClient } = require('@prisma/client');
const { createClerkClient } = require('@clerk/backend');

const prisma = new PrismaClient();

async function debugClerkProduction() {
  console.log('🔍 DEBUGGING CLERK EN PRODUCCIÓN');
  console.log('=================================');

  try {
    // 1. Verificar variables de entorno
    console.log('\n1. Verificando variables de entorno...');
    console.log('   CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA');
    console.log('   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   VERCEL:', process.env.VERCEL);
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO CONFIGURADA');

    if (!process.env.CLERK_SECRET_KEY) {
      console.log('\n❌ CLERK_SECRET_KEY no está configurada');
      return;
    }

    // 2. Verificar formato de las claves
    console.log('\n2. Verificando formato de las claves...');
    const secretKey = process.env.CLERK_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    console.log(`   Secret Key formato: ${secretKey.startsWith('sk_') ? '✅ Correcto' : '❌ Incorrecto'}`);
    console.log(`   Publishable Key formato: ${publishableKey.startsWith('pk_') ? '✅ Correcto' : '❌ Incorrecto'}`);
    console.log(`   Secret Key tipo: ${secretKey.includes('live') ? 'LIVE' : secretKey.includes('test') ? 'TEST' : 'DESCONOCIDO'}`);
    console.log(`   Publishable Key tipo: ${publishableKey.includes('live') ? 'LIVE' : publishableKey.includes('test') ? 'TEST' : 'DESCONOCIDO'}`);

    // 3. Probar conexión con Clerk
    console.log('\n3. Probando conexión con Clerk...');
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
        console.log('   📝 Verificar que la clave sea correcta en Vercel');
      } else if (clerkError.message.includes('Forbidden')) {
        console.log('   🔧 La clave de Clerk no tiene permisos suficientes');
        console.log('   📝 Verificar permisos en Clerk Dashboard');
      } else if (clerkError.message.includes('Not Found')) {
        console.log('   🔧 La aplicación de Clerk no existe o fue eliminada');
        console.log('   📝 Verificar que la aplicación esté activa en Clerk Dashboard');
      } else {
        console.log('   🔧 Error desconocido:', clerkError.message);
        console.log('   📝 Stack trace:', clerkError.stack);
      }
      return;
    }

    // 4. Probar creación de usuario de prueba
    console.log('\n4. Probando creación de usuario de prueba...');
    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const testEmail = `test-prod-debug-${Date.now()}@example.com`;
      const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!';

      console.log(`   📧 Email de prueba: ${testEmail}`);
      console.log(`   🔑 Password temporal: ${temporaryPassword}`);

      const testUser = await clerk.users.createUser({
        emailAddress: [testEmail],
        firstName: 'Test',
        lastName: 'Production',
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
      } else if (testError.message.includes('Password')) {
        console.log('   🔧 Error con la contraseña');
      } else if (testError.message.includes('Email')) {
        console.log('   🔧 Error con el email');
      } else {
        console.log('   🔧 Error desconocido:', testError.message);
        console.log('   📝 Stack trace:', testError.stack);
      }
    }

    // 5. Verificar usuarios en base de datos
    console.log('\n5. Verificando usuarios en base de datos...');
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
        console.log(`      Es temporal: ${user.clerkId.startsWith('temp_') ? 'SÍ' : 'NO'}`);
      });

    } catch (dbError) {
      console.log('   ❌ Error consultando base de datos:', dbError.message);
    }

    console.log('\n✅ Debug completado');

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugClerkProduction();
