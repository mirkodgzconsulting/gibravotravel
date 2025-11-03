const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('📦 Post-install detectado...\n');

async function checkIfClientesImported() {
  try {
    // Verificar si ya hay clientes importados (con email sinemail)
    const clientesCount = await prisma.client.count({
      where: {
        email: {
          startsWith: 'sinemail'
        }
      }
    });
    
    return clientesCount > 0;
  } catch (error) {
    console.log('⚠️  Error verificando clientes:', error.message);
    return false;
  }
}

async function importClientes() {
  try {
    console.log('📥 Verificando si es necesario importar clientes...\n');
    
    const alreadyImported = await checkIfClientesImported();
    
    if (alreadyImported) {
      console.log('✅ Clientes ya importados, saltando importación automática');
      return;
    }

    console.log('📥 Iniciando importación automática de clientes...');
    
    // Ejecutar importación sin dry-run
    // Durante postinstall, el archivo debería estar disponible en el sistema de archivos
    try {
      execSync('node scripts/import-clientes-excel.js', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production'
        },
        timeout: 300000 // 5 minutos timeout para la importación
      });
      
      console.log('✅ Importación de clientes completada');
    } catch (execError) {
      // Si falla durante postinstall, no es crítico - se puede hacer manualmente
      console.log('⚠️  No se pudo importar automáticamente durante el deploy');
      console.log('💡 La importación se puede hacer manualmente desde /clienti → Botón "Importar"');
      console.log('   O ejecutando: node scripts/import-clientes-excel.js');
      // No lanzar error para no fallar el build
    }
  } catch (error) {
    console.log('⚠️  Error en importación automática de clientes:', error.message);
    console.log('💡 La importación puede hacerse manualmente desde la interfaz');
    // No hacer exit(1) para no fallar el install
  }
}

async function postInstallProduction() {
  try {
    // Verificar que estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' ||
                        process.env.DATABASE_URL?.includes('postgresql://');

    if (!isProduction) {
      console.log('💻 Entorno de desarrollo - saltando post-install');
      await prisma.$disconnect();
      return;
    }

    console.log('🌍 Entorno de producción detectado');
    console.log('🔧 Ejecutando configuración automática...\n');

    // Ejecutar configuración automática
    try {
      execSync('node scripts/auto-fix-production.js', { stdio: 'pipe' });
      console.log('✅ Auto-reparación completada');
    } catch (error) {
      console.log('⚠️  Auto-reparación con advertencias, continuando...');
    }

    // Importar clientes automáticamente
    await importClientes();

    console.log('\n✅ Post-install completado exitosamente!');

  } catch (error) {
    console.error('❌ Error en post-install:', error.message);
    // No hacer exit(1) para no fallar el install
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar post-install
postInstallProduction();
