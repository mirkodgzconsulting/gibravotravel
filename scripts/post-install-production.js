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

    // Ejecutar migración de documentoViaggioName (preservar datos)
    try {
      console.log('🔄 Preservando documentoViaggioName...');
      execSync('node scripts/migrate-documento-viaggio-preserve.js', { stdio: 'inherit' });
      console.log('✅ Preservación de documentoViaggioName completada');
    } catch (error) {
      console.log('⚠️  Preservación de documentoViaggioName con advertencias, continuando...');
    }

    // Ejecutar migración de notas (segura, no borra datos)
    try {
      console.log('🔄 Ejecutando migración de campos de notas...');
      execSync('node scripts/migrate-production-notas-safe.js', { stdio: 'inherit' });
      console.log('✅ Migración de notas completada');
    } catch (error) {
      console.log('⚠️  Migración de notas con advertencias, continuando...');
    }

    // Ejecutar configuración automática
    try {
      execSync('node scripts/auto-fix-production.js', { stdio: 'pipe' });
      console.log('✅ Auto-reparación completada');
    } catch (error) {
      console.log('⚠️  Auto-reparación con advertencias, continuando...');
    }

    // NOTA: La importación de clientes NO se hace automáticamente durante el deploy
    // porque puede bloquear el build (tarda varios minutos con 4,121 registros).
    // La importación debe hacerse manualmente desde /clienti → Botón "Importar"
    // o ejecutando: npm run import:clientes

    console.log('\n💡 Para importar clientes desde Excel:');
    console.log('   1. Desde la interfaz: /clienti → Botón "Importar"');
    console.log('   2. Desde línea de comandos: npm run import:clientes');
    console.log('\n✅ Post-install completado exitosamente!');

  } catch (error) {
    console.error('❌ Error en post-install:', error.message);
    // No hacer exit(1) para no fallar el install
  }
}

// Ejecutar post-install
postInstallProduction();
