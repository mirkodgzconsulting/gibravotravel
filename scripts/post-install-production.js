const { execSync } = require('child_process');

console.log('📦 Post-install detectado...\n');

async function postInstallProduction() {
  try {
    // Verificar que estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' ||
                        process.env.DATABASE_URL?.includes('postgresql://');

    if (!isProduction) {
      console.log('💻 Entorno de desarrollo - saltando post-install');
      return;
    }

    console.log('🌍 Entorno de producción detectado');
    console.log('🔧 Ejecutando configuración automática...\n');

    // Ejecutar configuración automática
    execSync('node scripts/auto-fix-production.js', { stdio: 'inherit' });

    console.log('\n✅ Post-install completado exitosamente!');

  } catch (error) {
    console.error('❌ Error en post-install:', error.message);
    // No hacer exit(1) para no fallar el install
  }
}

// Ejecutar post-install
postInstallProduction();
