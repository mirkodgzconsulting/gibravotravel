const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('📦 Post-install detectado...\n');

async function checkIfClientesImported() {
  try {
    // Verificar si ya hay clientes importados (con email sinemail)
    // Consideramos que está completo si hay más de 4000 clientes (esperamos ~4121)
    const clientesCount = await prisma.client.count({
      where: {
        email: {
          startsWith: 'sinemail'
        }
      }
    });
    
    console.log(`📊 Clientes sinemail encontrados: ${clientesCount}`);
    
    // Si hay más de 4000, consideramos que la importación está completa
    return clientesCount >= 4000;
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
      console.log('✅ Clientes ya importados (más de 4000 encontrados), saltando importación automática');
      return;
    }

    console.log('📥 Iniciando importación automática de clientes...');
    console.log('⏱️  Esta operación puede tardar varios minutos (4,121 clientes)...\n');
    
    // Ejecutar importación sin dry-run
    // Durante postinstall, el archivo debería estar disponible en el sistema de archivos
    try {
      execSync('node scripts/import-clientes-excel.js', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production'
        },
        timeout: 600000 // 10 minutos timeout para la importación (batch insert es más rápido)
      });
      
      // Verificar el resultado
      const finalCount = await prisma.client.count({
        where: {
          email: {
            startsWith: 'sinemail'
          }
        }
      });
      
      console.log(`\n✅ Importación de clientes completada: ${finalCount} clientes importados`);
      
      if (finalCount < 4000) {
        console.log('⚠️  Parece que la importación fue parcial. Puedes ejecutarla nuevamente desde la interfaz.');
      }
    } catch (execError) {
      // Si falla durante postinstall, no es crítico - se puede hacer manualmente
      console.log('\n⚠️  No se pudo importar automáticamente durante el deploy');
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
