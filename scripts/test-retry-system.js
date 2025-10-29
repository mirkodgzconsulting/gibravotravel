const { PrismaClient } = require('@prisma/client');
const { clerkRetryService } = require('../src/lib/clerk-retry');

const prisma = new PrismaClient();

async function testRetrySystem() {
  console.log('🧪 PROBANDO SISTEMA DE REINTENTOS');
  console.log('=================================');

  try {
    // Crear múltiples usuarios para probar la robustez
    const testUsers = [
      {
        email: `test-retry-1-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Retry 1',
        phoneNumber: '+1234567890',
        role: 'USER'
      },
      {
        email: `test-retry-2-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Retry 2',
        phoneNumber: '+1234567891',
        role: 'ADMIN'
      },
      {
        email: `test-retry-3-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Retry 3',
        phoneNumber: '+1234567892',
        role: 'TI'
      }
    ];

    console.log(`\n📊 Creando ${testUsers.length} usuarios de prueba...`);

    const results = [];
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`\n🔄 Procesando usuario ${i + 1}/${testUsers.length}: ${user.email}`);
      
      const startTime = Date.now();
      
      const result = await clerkRetryService.createUserWithRetry({
        emailAddress: [user.email],
        firstName: user.firstName,
        lastName: user.lastName,
        password: Math.random().toString(36).slice(-12) + 'A1!',
        skipPasswordChecks: true,
        publicMetadata: {
          role: user.role,
          phoneNumber: user.phoneNumber,
        },
      });
      
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
        await clerkRetryService.deleteUserWithRetry(result.user.id);
        console.log(`   🧹 Usuario eliminado`);
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
    const totalAttempts = results.reduce((sum, r) => sum + (r.attempts || 0), 0);
    const avgDuration = results.reduce((sum, r) => sum + parseInt(r.duration), 0) / results.length;
    
    console.log(`✅ Usuarios creados exitosamente: ${successCount}/${testUsers.length}`);
    console.log(`❌ Usuarios fallidos: ${failureCount}/${testUsers.length}`);
    console.log(`🔄 Total de intentos: ${totalAttempts}`);
    console.log(`⏱️  Duración promedio: ${Math.round(avgDuration)}ms`);
    
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

testRetrySystem();
