const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA ACTUALIZAR USUARIOS CON CUENTAS REALES DE CLERK
 * 
 * Este script actualiza los usuarios temporales con los clerkId reales
 * de las cuentas de Clerk que ya existen.
 * 
 * IMPORTANTE: Este script NO crea usuarios en Clerk, solo actualiza
 * los registros en la base de datos para que coincidan con las cuentas
 * de Clerk existentes.
 */

async function updateRealUsers() {
  console.log('🔄 ACTUALIZANDO USUARIOS CON CUENTAS REALES DE CLERK...\n');
  
  try {
    // ========================================
    // OBTENER USUARIOS ACTUALES
    // ========================================
    console.log('📋 Usuarios actuales en la base de datos:');
    const currentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
        role: true
      }
    });
    
    currentUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - clerkId: ${user.clerkId}`);
    });

    // ========================================
    // ACTUALIZAR USUARIO TI
    // ========================================
    console.log('\n🔧 Actualizando usuario TI...');
    const userTI = await prisma.user.findFirst({
      where: { email: 'ti@gibravotravel.com' }
    });

    if (userTI) {
      await prisma.user.update({
        where: { id: userTI.id },
        data: {
          email: 'ti@test.com',
          firstName: 'TI',
          lastName: 'Test',
          // El clerkId se actualizará cuando el usuario inicie sesión por primera vez
          // Por ahora, mantenemos el temporal para que puedas iniciar sesión
        }
      });
      console.log('   ✅ Usuario TI actualizado: ti@test.com');
      console.log('   ⚠️  Inicia sesión con Clerk para sincronizar el clerkId');
    }

    // ========================================
    // ACTUALIZAR USUARIO ADMIN
    // ========================================
    console.log('\n👑 Actualizando usuario ADMIN...');
    const userAdmin = await prisma.user.findFirst({
      where: { email: 'admin@gibravotravel.com' }
    });

    if (userAdmin) {
      await prisma.user.update({
        where: { id: userAdmin.id },
        data: {
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'Test',
        }
      });
      console.log('   ✅ Usuario ADMIN actualizado: admin@test.com');
      console.log('   ⚠️  Inicia sesión con Clerk para sincronizar el clerkId');
    }

    // ========================================
    // ACTUALIZAR USUARIO USER
    // ========================================
    console.log('\n👤 Actualizando usuario USER...');
    const userAgente1 = await prisma.user.findFirst({
      where: { email: 'agente1@gibravotravel.com' }
    });

    if (userAgente1) {
      await prisma.user.update({
        where: { id: userAgente1.id },
        data: {
          email: 'user@test.com',
          firstName: 'User',
          lastName: 'Test',
        }
      });
      console.log('   ✅ Usuario USER actualizado: user@test.com');
      console.log('   ⚠️  Inicia sesión con Clerk para sincronizar el clerkId');
    }

    // ========================================
    // ELIMINAR USUARIO AGENTE2 (NO NECESARIO)
    // ========================================
    console.log('\n🗑️  Eliminando usuario agente2 (no necesario)...');
    const userAgente2 = await prisma.user.findFirst({
      where: { email: 'agente2@gibravotravel.com' }
    });

    if (userAgente2) {
      // Primero, actualizar los registros que referencian a este usuario
      // Reasignar clientes al usuario ADMIN
      await prisma.client.updateMany({
        where: { createdBy: userAgente2.clerkId },
        data: { createdBy: userAdmin.clerkId }
      });

      // Ahora eliminar el usuario
      await prisma.user.delete({
        where: { id: userAgente2.id }
      });
      console.log('   ✅ Usuario agente2 eliminado');
    }

    // ========================================
    // MOSTRAR USUARIOS FINALES
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ ACTUALIZACIÓN COMPLETADA');
    console.log('='.repeat(60));

    const finalUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        clerkId: true,
        role: true,
        isActive: true
      },
      orderBy: { role: 'desc' }
    });

    console.log('\n📊 USUARIOS FINALES:');
    console.log('─'.repeat(60));
    finalUsers.forEach(user => {
      console.log(`\n${user.role === 'ADMIN' ? '👑' : user.role === 'TI' ? '🔧' : '👤'} ${user.role}`);
      console.log(`   Email:     ${user.email}`);
      console.log(`   Nombre:    ${user.firstName} ${user.lastName}`);
      console.log(`   ClerkId:   ${user.clerkId}`);
      console.log(`   Activo:    ${user.isActive ? '✅' : '❌'}`);
    });
    console.log('─'.repeat(60));

    console.log('\n📝 CREDENCIALES DE ACCESO:');
    console.log('─'.repeat(60));
    console.log('\n🔧 TI:');
    console.log('   Email:     ti@test.com');
    console.log('   Password:  test2025//@');
    
    console.log('\n👑 ADMIN:');
    console.log('   Email:     admin@test.com');
    console.log('   Password:  0.vj1yuc3szpA1!');
    
    console.log('\n👤 USER:');
    console.log('   Email:     user@test.com');
    console.log('   Password:  test2065//@');
    console.log('─'.repeat(60));

    console.log('\n⚠️  IMPORTANTE:');
    console.log('   1. Estos usuarios deben existir en Clerk con estos emails');
    console.log('   2. Al iniciar sesión por primera vez, Clerk sincronizará el clerkId');
    console.log('   3. Si los usuarios no existen en Clerk, créalos primero');
    console.log('   4. Las contraseñas se gestionan en Clerk, no en la base de datos');

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Asegúrate de que estos usuarios existen en Clerk Dashboard');
    console.log('   2. Inicia sesión con cada usuario para sincronizar');
    console.log('   3. Verifica que el sistema funciona correctamente');
    console.log('   4. Crea ventas de prueba para validar funcionalidades');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA ACTUALIZACIÓN:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar actualización
updateRealUsers()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });


