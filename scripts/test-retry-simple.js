const { PrismaClient } = require('@prisma/client');
const { createClerkClient } = require('@clerk/backend');

const prisma = new PrismaClient();

async function testRetrySimple() {
  console.log('🧪 PROBANDO SISTEMA DE REINTENTOS SIMPLE');
  console.log('========================================');

  try {
    // Verificar configuración
    if (!process.env.CLERK_SECRET_KEY) {
      console.log('❌ CLERK_SECRET_KEY no está configurada');
      return;
    }

    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Función de reintentos simple
    async function createUserWithRetry(userData, maxRetries = 3) {
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Intento ${attempt}/${maxRetries} - Creando usuario: ${userData.email}`);
          
          const user = await clerk.users.createUser({
            emailAddress: [userData.email],
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: userData.password,
            skipPasswordChecks: true,
            publicMetadata: {
              role: userData.role,
              phoneNumber: userData.phoneNumber,
            },
          });
          
          console.log(`✅ Usuario creado exitosamente en intento ${attempt}: ${user.id}`);
          return { success: true, user, attempt };
          
        } catch (error) {
          lastError = error;
          console.log(`❌ Intento ${attempt} falló: ${error.message}`);
          
          if (attempt < maxRetries) {
            const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
            console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      console.log(`❌ Todos los intentos fallaron para usuario: ${userData.email}`);
      return { success: false, error: lastError, attempts: maxRetries };
    }

    // Crear usuarios de prueba
    const testUsers = [
      {
        email: `test-retry-1-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Retry 1',
        phoneNumber: '+1234567890',
        role: 'USER',
        password: Math.random().toString(36).slice(-12) + 'A1!'
      },
      {
        email: `test-retry-2-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Retry 2',
        phoneNumber: '+1234567891',
        role: 'ADMIN',
        password: Math.random().toString(36).slice(-12) + 'A1!'
      }
    ];

    console.log(`\n📊 Creando ${testUsers.length} usuarios de prueba...`);

    const results = [];
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`\n🔄 Procesando usuario ${i + 1}/${testUsers.length}: ${user.email}`);
      
      const startTime = Date.now();
      const result = await createUserWithRetry(user);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results.push({
        user: user.email,
        success: result.success,
        attempts: result.attempt || result.attempts,
        duration: `${duration}ms`,
        error: result.error?.message || null
      });
      
      if (result.success) {
        console.log(`   ✅ Éxito en ${result.attempt} intentos (${duration}ms)`);
        
        // Limpiar usuario de prueba
        try {
          await clerk.users.deleteUser(result.user.id);
          console.log(`   🧹 Usuario eliminado`);
        } catch (deleteError) {
          console.log(`   ⚠️  Error eliminando usuario: ${deleteError.message}`);
        }
      } else {
        console.log(`   ❌ Falló después de ${result.attempts} intentos (${duration}ms)`);
        console.log(`   📝 Error: ${result.error?.message || 'Unknown'}`);
      }
    }

    // Resumen
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log('======================');
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Usuarios creados exitosamente: ${successCount}/${testUsers.length}`);
    console.log(`❌ Usuarios fallidos: ${failureCount}/${testUsers.length}`);
    
    console.log('\n📋 DETALLES POR USUARIO:');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.user} - ${result.attempts} intentos - ${result.duration}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    if (successCount === testUsers.length) {
      console.log('\n🎉 ¡Sistema de reintentos funcionando perfectamente!');
    } else if (successCount > 0) {
      console.log('\n⚠️  Sistema de reintentos parcialmente funcional');
    } else {
      console.log('\n❌ Sistema de reintentos necesita revisión');
    }

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRetrySimple();
