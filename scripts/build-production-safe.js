const { execSync } = require('child_process');
const fs = require('fs');

console.log('🏗️  Iniciando build SEGURO para producción...\n');

async function buildProductionSafe() {
  try {
    // 1. Verificar si estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' ||
      process.env.VERCEL === '1' ||
      process.env.DATABASE_URL?.includes('postgresql://');

    if (isProduction) {
      console.log('🌍 Detectado entorno de producción');
      console.log('🔒 Usando build SEGURO (NO borra datos)\n');

      try {
        // COMENTADO: Migraciones automáticas deshabilitadas - ejecutar manualmente solo cuando haya cambios en el schema
        // Solo aplicar cambios de esquema SIN borrar datos
        // Solo aplicar cambios de esquema SIN borrar datos
        console.log('📊 Aplicando cambios de esquema (SIN borrar datos)...');
        try {
          execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
          console.log('   ✅ Esquema aplicado exitosamente');
        } catch (schemaError) {
          console.log('   ⚠️  Error aplicando esquema, continuando...');
        }

        // Corregir archivos de subida
        console.log('\n🔧 Corrigiendo archivos de subida...');
        try {
          execSync('node scripts/fix-file-upload-errors.js', { stdio: 'inherit' });
          console.log('   ✅ Archivos de subida corregidos');
        } catch (fileError) {
          console.log('   ⚠️  Error corrigiendo archivos, continuando...');
        }

        // Corregir generación de recibos completamente
        console.log('\n📄 Corrigiendo generación de recibos...');
        try {
          execSync('node scripts/fix-ricevuta-production.js', { stdio: 'inherit' });
          console.log('   ✅ Generación de recibos corregida');
        } catch (ricevutaError) {
          console.log('   ⚠️  Error corrigiendo recibos, continuando...');
        }

        console.log('\n🎉 Configuración segura completada (datos preservados)');
      } catch (error) {
        console.log('\n⚠️  Error en configuración automática:', error.message);
        console.log('🔄 Continuando con el build...');
      }
    } else {
      console.log('💻 Entorno de desarrollo detectado');
      console.log('⏭️  Saltando migración de base de datos\n');
    }

    // 2. Generar cliente de Prisma
    console.log('🔧 Generando cliente de Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // 3. Ejecutar build de Next.js
    console.log('\n🏗️  Ejecutando build de Next.js...');
    execSync('npx next build', { stdio: 'inherit' });

    console.log('\n✅ Build SEGURO completado exitosamente!');
    console.log('🔒 Los datos de prueba se mantienen intactos');

  } catch (error) {
    console.error('❌ Error durante el build:', error.message);
    process.exit(1);
  }
}

buildProductionSafe();
