const { execSync } = require('child_process');

console.log('🚀 Configuración completa de producción...\n');

async function setupCompleteProduction() {
  try {
    // 1. Verificar que estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' ||
                        process.env.DATABASE_URL?.includes('postgresql://');

    if (!isProduction) {
      console.log('⚠️  No se detectó entorno de producción');
      console.log('💡 Para ejecutar en producción, asegúrate de tener DATABASE_URL configurado');
      console.log('🔧 Ejecutando de todas formas...\n');
    }

    // 2. Configurar base de datos
    console.log('📊 Paso 1: Configurando base de datos...');
    execSync('node scripts/setup-production.js', { stdio: 'inherit' });

    // 3. Crear usuarios de prueba
    console.log('\n👥 Paso 2: Creando usuarios de prueba...');
    execSync('node scripts/create-test-users.js', { stdio: 'inherit' });

    // 4. Verificar configuración
    console.log('\n🔍 Paso 3: Verificando configuración...');
    execSync('node scripts/verify-production-setup.js', { stdio: 'inherit' });

    console.log('\n🎉 ¡Configuración completa de producción finalizada!');
    console.log('\n📋 RESUMEN:');
    console.log('   ✅ Base de datos configurada con todas las tablas e índices');
    console.log('   ✅ Usuarios de prueba creados');
    console.log('   ✅ Configuración verificada');
    console.log('\n🔐 USUARIOS DE PRUEBA:');
    console.log('   • TI: ti@test.com / test2025//@');
    console.log('   • Admin: admin@test.com / 0.vj1yuc3szpA1!');
    console.log('   • User: user@test.com / test2065//@');
    console.log('\n🚀 La aplicación está lista para usar en producción!');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
}

setupCompleteProduction();
