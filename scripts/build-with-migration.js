const { execSync } = require('child_process');
const fs = require('fs');

console.log('🏗️  Iniciando build con migración automática...\n');

async function buildWithMigration() {
  try {
    // 1. Verificar si estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' ||
                        process.env.DATABASE_URL?.includes('postgresql://');

    if (isProduction) {
      console.log('🌍 Detectado entorno de producción');
      console.log('📊 Ejecutando migración de base de datos...\n');
      
      try {
        // Crear esquema de producción desde local
        console.log('\n🏗️  Creando esquema de producción...');
        try {
          execSync('node scripts/create-production-schema.js', { stdio: 'inherit' });
          console.log('   ✅ Esquema creado exitosamente');
        } catch (schemaError) {
          console.log('   ⚠️  Error creando esquema, intentando replicación...');
          try {
            execSync('node scripts/replicate-local-to-production.js', { stdio: 'inherit' });
            console.log('   ✅ Replicación completada');
          } catch (replicateError) {
            console.log('   ❌ Error en replicación, continuando con build...');
          }
        }
        
        console.log('\n🎉 Configuración y reparación automática completada');
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
    execSync('npm run build', { stdio: 'inherit' });

    console.log('\n✅ Build completado exitosamente!');

  } catch (error) {
    console.error('❌ Error durante el build:', error.message);
    process.exit(1);
  }
}

buildWithMigration();
