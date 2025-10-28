const { execSync } = require('child_process');

console.log('🚀 Ejecutando post-deploy...\n');

async function postDeploy() {
  try {
    // Verificar que estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' ||
                        process.env.DATABASE_URL?.includes('postgresql://');

    if (!isProduction) {
      console.log('💻 Entorno de desarrollo detectado - saltando post-deploy');
      return;
    }

    console.log('🌍 Entorno de producción detectado');
    console.log('🔧 Ejecutando configuración post-deploy...\n');

    // 1. Verificar usuarios de prueba
    console.log('1. Verificando usuarios de prueba...');
    try {
      execSync('node scripts/check-test-users.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Error verificando usuarios, creando...');
      execSync('node scripts/create-test-users.js', { stdio: 'inherit' });
    }

    // 2. Verificar configuración general
    console.log('\n2. Verificando configuración general...');
    execSync('node scripts/verify-production-setup.js', { stdio: 'inherit' });

    console.log('\n✅ Post-deploy completado exitosamente!');
    console.log('\n🎉 La aplicación está lista para usar en producción!');

  } catch (error) {
    console.error('❌ Error durante post-deploy:', error.message);
    // No hacer exit(1) para no fallar el deploy
  }
}

postDeploy();
