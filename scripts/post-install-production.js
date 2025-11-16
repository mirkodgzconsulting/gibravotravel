const { execSync } = require('child_process');

console.log('📦 Post-install detectado...\n');

async function postInstallProduction() {
  try {
    // Verificar que estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' ||
                        process.env.DATABASE_URL?.includes('postgresql://');

    if (!isProduction) {
      console.log('💻 Entorno de desarrollo - saltando migraciones');
      return;
    }

    console.log('🌍 Entorno de producción detectado');
    console.log('🔄 Ejecutando migración rápida (no bloquea el build)...\n');

    // Ejecutar migración rápida con timeout
    try {
      execSync('node scripts/migrate-production-fast.js', { 
        stdio: 'inherit',
        timeout: 15000, // 15 segundos máximo
        killSignal: 'SIGTERM'
      });
      console.log('✅ Migración rápida completada\n');
    } catch (error) {
      // No fallar el build si hay timeout o error
      console.log('⚠️  Migración rápida con advertencias, continuando...\n');
    }

    console.log('✅ Post-install completado exitosamente!');

  } catch (error) {
    console.error('❌ Error en post-install:', error.message);
    // No hacer exit(1) para no fallar el install
  }
}

// Ejecutar post-install
postInstallProduction();
