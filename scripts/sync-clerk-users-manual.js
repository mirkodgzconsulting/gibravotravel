const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA SINCRONIZAR USUARIOS DE CLERK CON LA BASE DE DATOS
 * 
 * Este script debe ejecutarse DESPUÉS de crear los usuarios en Clerk Dashboard.
 * Actualiza los clerkId temporales con los clerkId reales de Clerk.
 * 
 * PASOS PREVIOS:
 * 1. Crear usuarios en Clerk Dashboard (https://dashboard.clerk.com)
 * 2. Copiar los clerkId reales de cada usuario
 * 3. Actualizar este script con los clerkId reales
 * 4. Ejecutar este script
 */

async function syncClerkUsers() {
  console.log('🔄 SINCRONIZANDO USUARIOS CON CLERK...\n');
  
  try {
    // ========================================
    // CONFIGURACIÓN DE CLERKID REALES
    // ========================================
    // ⚠️ IMPORTANTE: Reemplaza estos valores con los clerkId reales de Clerk Dashboard
    
    const clerkUsers = {
      TI: {
        email: 'ti@test.com',
        clerkId: 'REEMPLAZAR_CON_CLERK_ID_REAL_DE_TI', // Ejemplo: user_2abc123def456
      },
      ADMIN: {
        email: 'admin@test.com',
        clerkId: 'REEMPLAZAR_CON_CLERK_ID_REAL_DE_ADMIN', // Ejemplo: user_2xyz789ghi012
      },
      USER: {
        email: 'user@test.com',
        clerkId: 'REEMPLAZAR_CON_CLERK_ID_REAL_DE_USER', // Ejemplo: user_2jkl345mno678
      }
    };

    // Verificar que se hayan actualizado los clerkId
    const hasPlaceholders = Object.values(clerkUsers).some(
      user => user.clerkId.includes('REEMPLAZAR')
    );

    if (hasPlaceholders) {
      console.log('⚠️  ADVERTENCIA: Los clerkId aún contienen valores placeholder');
      console.log('\n📋 PASOS PARA OBTENER LOS CLERKID REALES:');
      console.log('─'.repeat(60));
      console.log('1. Ve a Clerk Dashboard: https://dashboard.clerk.com');
      console.log('2. Selecciona tu aplicación');
      console.log('3. Ve a "Users" en el menú lateral');
      console.log('4. Busca cada usuario por email:');
      console.log(`   - ${clerkUsers.TI.email}`);
      console.log(`   - ${clerkUsers.ADMIN.email}`);
      console.log(`   - ${clerkUsers.USER.email}`);
      console.log('5. Haz clic en cada usuario y copia su "User ID" (clerkId)');
      console.log('6. Actualiza este script con los clerkId reales');
      console.log('7. Ejecuta nuevamente este script');
      console.log('─'.repeat(60));
      
      console.log('\n❌ Script detenido. Actualiza los clerkId primero.');
      return;
    }

    // ========================================
    // ACTUALIZAR USUARIOS
    // ========================================
    console.log('📝 Actualizando usuarios con clerkId reales...\n');

    // Actualizar TI
    const userTI = await prisma.user.findFirst({
      where: { email: clerkUsers.TI.email }
    });

    if (userTI) {
      await prisma.user.update({
        where: { id: userTI.id },
        data: { clerkId: clerkUsers.TI.clerkId }
      });
      console.log(`✅ Usuario TI actualizado: ${clerkUsers.TI.email}`);
      console.log(`   ClerkId: ${clerkUsers.TI.clerkId}`);
    } else {
      console.log(`❌ Usuario TI no encontrado: ${clerkUsers.TI.email}`);
    }

    // Actualizar ADMIN
    const userAdmin = await prisma.user.findFirst({
      where: { email: clerkUsers.ADMIN.email }
    });

    if (userAdmin) {
      await prisma.user.update({
        where: { id: userAdmin.id },
        data: { clerkId: clerkUsers.ADMIN.clerkId }
      });
      console.log(`\n✅ Usuario ADMIN actualizado: ${clerkUsers.ADMIN.email}`);
      console.log(`   ClerkId: ${clerkUsers.ADMIN.clerkId}`);
    } else {
      console.log(`\n❌ Usuario ADMIN no encontrado: ${clerkUsers.ADMIN.email}`);
    }

    // Actualizar USER
    const userUser = await prisma.user.findFirst({
      where: { email: clerkUsers.USER.email }
    });

    if (userUser) {
      await prisma.user.update({
        where: { id: userUser.id },
        data: { clerkId: clerkUsers.USER.clerkId }
      });
      console.log(`\n✅ Usuario USER actualizado: ${clerkUsers.USER.email}`);
      console.log(`   ClerkId: ${clerkUsers.USER.clerkId}`);
    } else {
      console.log(`\n❌ Usuario USER no encontrado: ${clerkUsers.USER.email}`);
    }

    // ========================================
    // VERIFICACIÓN FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ SINCRONIZACIÓN COMPLETADA');
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

    console.log('\n📊 USUARIOS SINCRONIZADOS:');
    console.log('─'.repeat(60));
    finalUsers.forEach(user => {
      console.log(`\n${user.role === 'ADMIN' ? '👑' : user.role === 'TI' ? '🔧' : '👤'} ${user.role}`);
      console.log(`   Email:     ${user.email}`);
      console.log(`   Nombre:    ${user.firstName} ${user.lastName}`);
      console.log(`   ClerkId:   ${user.clerkId}`);
      console.log(`   Activo:    ${user.isActive ? '✅' : '❌'}`);
    });
    console.log('─'.repeat(60));

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Inicia sesión en la aplicación con cada usuario');
    console.log('   2. Verifica que el sistema funciona correctamente');
    console.log('   3. Crea ventas de prueba para validar funcionalidades');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA SINCRONIZACIÓN:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar sincronización
syncClerkUsers()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });


