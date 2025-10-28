// Cargar variables de entorno
require('dotenv').config({ path: '.env' });

const { Clerk } = require('@clerk/clerk-sdk-node');
const { PrismaClient } = require('@prisma/client');

async function syncExistingUsers() {
  console.log('🔄 SINCRONIZANDO USUARIOS EXISTENTES DE CLERK...\n');
  
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  
  if (!clerkSecretKey) {
    console.error('❌ No se encontró CLERK_SECRET_KEY');
    return;
  }

  const clerk = new Clerk({ secretKey: clerkSecretKey });
  const prisma = new PrismaClient();

  const emails = ['ti@test.com', 'admin@test.com', 'user@test.com'];
  const roles = { 'ti@test.com': 'TI', 'admin@test.com': 'ADMIN', 'user@test.com': 'USER' };

  console.log('📋 Buscando usuarios en Clerk...\n');

  for (const email of emails) {
    try {
      console.log(`🔍 Buscando: ${email}...`);
      
      // Buscar usuario en Clerk
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [email]
      });

      if (clerkUsers.data && clerkUsers.data.length > 0) {
        const clerkUser = clerkUsers.data[0];
        console.log(`   ✅ Usuario encontrado en Clerk`);
        console.log(`   ClerkId: ${clerkUser.id}`);
        console.log(`   Nombre: ${clerkUser.firstName} ${clerkUser.lastName}`);

        // Buscar en base de datos
        const dbUser = await prisma.user.findFirst({
          where: { email: email }
        });

        if (dbUser) {
          // Actualizar clerkId
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              clerkId: clerkUser.id,
              firstName: clerkUser.firstName || dbUser.firstName,
              lastName: clerkUser.lastName || dbUser.lastName
            }
          });
          console.log(`   ✅ Sincronizado con base de datos (actualizado)`);
        } else {
          // Crear usuario en base de datos
          await prisma.user.create({
            data: {
              clerkId: clerkUser.id,
              email: email,
              firstName: clerkUser.firstName || email.split('@')[0],
              lastName: clerkUser.lastName || 'User',
              role: roles[email],
              isActive: true
            }
          });
          console.log(`   ✅ Usuario creado en base de datos`);
        }
      } else {
        console.log(`   ⚠️  Usuario NO encontrado en Clerk`);
        console.log(`   ℹ️  Debes crear este usuario manualmente en Clerk Dashboard`);
      }

      console.log('');

    } catch (error) {
      console.error(`   ❌ Error procesando ${email}:`, error.message);
    }
  }

  await prisma.$disconnect();

  // Mostrar usuarios finales
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

  console.log('='.repeat(60));
  console.log('✅ SINCRONIZACIÓN COMPLETADA');
  console.log('='.repeat(60));

  console.log('\n📊 USUARIOS EN BASE DE DATOS:');
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
  
  console.log('\n👑 ADMIN:');
  console.log('   Email:     admin@test.com');
  console.log('   Password:  0.vj1yuc3szpA1!');
  
  console.log('\n👤 USER:');
  console.log('   Email:     user@test.com');
  console.log('   Password:  test2065//@');
  console.log('─'.repeat(60));

  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('   1. Ve a http://localhost:3000');
  console.log('   2. Haz clic en "Sign In"');
  console.log('   3. Inicia sesión con cualquiera de estos usuarios');
  console.log('   4. ¡El sistema debería funcionar correctamente!');
}

syncExistingUsers()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });



