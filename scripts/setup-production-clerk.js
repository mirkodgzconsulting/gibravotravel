const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupProductionClerk() {
  console.log('🔧 CONFIGURACIÓN DE CLERK EN PRODUCCIÓN');
  console.log('======================================');

  console.log('\n📋 INSTRUCCIONES PARA CONFIGURAR CLERK EN VERCEL:');
  console.log('');
  console.log('1. 🌐 Ir a Vercel Dashboard: https://vercel.com/dashboard');
  console.log('2. 📁 Seleccionar el proyecto: gibravotravel');
  console.log('3. ⚙️  Ir a Settings > Environment Variables');
  console.log('4. ➕ Agregar las siguientes variables:');
  console.log('');
  console.log('   Variable: CLERK_SECRET_KEY');
  console.log('   Valor: sk_live_... (o sk_test_... para desarrollo)');
  console.log('   Entornos: Production, Preview, Development');
  console.log('');
  console.log('   Variable: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  console.log('   Valor: pk_live_... (o pk_test_... para desarrollo)');
  console.log('   Entornos: Production, Preview, Development');
  console.log('');
  console.log('5. 🔄 Hacer redeploy del proyecto');
  console.log('');

  console.log('🔍 OBTENER LAS CLAVES DE CLERK:');
  console.log('');
  console.log('1. 🌐 Ir a Clerk Dashboard: https://dashboard.clerk.com/');
  console.log('2. 📁 Seleccionar tu aplicación');
  console.log('3. ⚙️  Ir a API Keys');
  console.log('4. 📋 Copiar las claves:');
  console.log('   - Secret Key (sk_live_... o sk_test_...)');
  console.log('   - Publishable Key (pk_live_... o pk_test_...)');
  console.log('');

  console.log('⚠️  IMPORTANTE:');
  console.log('- Usar claves LIVE para producción');
  console.log('- Usar claves TEST para desarrollo');
  console.log('- Las claves deben ser del mismo entorno');
  console.log('- Después de configurar, hacer redeploy');
  console.log('');

  console.log('🧪 VERIFICAR CONFIGURACIÓN:');
  console.log('Después de configurar, ejecutar:');
  console.log('   node scripts/check-production-clerk.js');
  console.log('');

  // Verificar configuración actual
  console.log('🔍 CONFIGURACIÓN ACTUAL:');
  console.log(`   CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA'}`);
  console.log(`   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   VERCEL: ${process.env.VERCEL}`);

  if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.log('\n✅ Las variables están configuradas localmente');
    console.log('   Verificar que también estén en Vercel');
  } else {
    console.log('\n❌ Las variables NO están configuradas');
    console.log('   Seguir las instrucciones arriba para configurarlas');
  }

  await prisma.$disconnect();
}

setupProductionClerk();
