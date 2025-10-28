const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * SCRIPT PARA ACTUALIZAR CLERKID REALES DE CLERK
 * 
 * Este script actualiza los clerkId temporales con los clerkId reales
 * proporcionados por Clerk Dashboard.
 */

async function updateClerkIds() {
  console.log('🔄 ACTUALIZANDO CLERKID REALES...\n');
  
  try {
    // ClerkId reales proporcionados
    const realClerkIds = {
      'ti@test.com': 'user_33SQ3k9daADwzexJSS23utCpPqr',
      'admin@test.com': 'user_33bf957OvyQP9DxufYeP7EeKWP8',
      'user@test.com': 'user_34Z5esFYazEGrGfCua4vMHBIcP'
    };

    console.log('📋 Actualizando usuarios...\n');

    for (const [email, clerkId] of Object.entries(realClerkIds)) {
      try {
        // Buscar usuario en la base de datos
        const user = await prisma.user.findFirst({
          where: { email: email }
        });

        if (user) {
          // Actualizar clerkId
          await prisma.user.update({
            where: { id: user.id },
            data: { clerkId: clerkId }
          });

          console.log(`✅ ${email}`);
          console.log(`   ClerkId anterior: ${user.clerkId}`);
          console.log(`   ClerkId nuevo:    ${clerkId}`);
          console.log('');
        } else {
          console.log(`❌ Usuario no encontrado: ${email}`);
          console.log('');
        }
      } catch (error) {
        console.error(`❌ Error actualizando ${email}:`, error.message);
      }
    }

    // Verificar actualización
    console.log('='.repeat(60));
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

    console.log('\n📊 USUARIOS ACTUALIZADOS:');
    console.log('─'.repeat(60));
    finalUsers.forEach(user => {
      const icon = user.role === 'ADMIN' ? '👑' : user.role === 'TI' ? '🔧' : '👤';
      console.log(`\n${icon} ${user.role}`);
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
    console.log('   ClerkId:   user_33SQ3k9daADwzexJSS23utCpPqr');
    
    console.log('\n👑 ADMIN:');
    console.log('   Email:     admin@test.com');
    console.log('   Password:  0.vj1yuc3szpA1!');
    console.log('   ClerkId:   user_33bf957OvyQP9DxufYeP7EeKWP8');
    
    console.log('\n👤 USER:');
    console.log('   Email:     user@test.com');
    console.log('   Password:  test2065//@');
    console.log('   ClerkId:   user_34Z5esFYazEGrGfCua4vMHBIcP');
    console.log('─'.repeat(60));

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('   1. Ve a http://localhost:3000');
    console.log('   2. Haz clic en "Sign In"');
    console.log('   3. Inicia sesión con cualquiera de estos usuarios');
    console.log('   4. ¡Deberías poder acceder sin problemas!');

    console.log('\n✅ ¡Sistema listo para usar!');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA ACTUALIZACIÓN:');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar actualización
updateClerkIds()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script finalizado con errores');
    console.error(error);
    process.exit(1);
  });



