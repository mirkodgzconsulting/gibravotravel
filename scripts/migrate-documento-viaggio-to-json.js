const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateDocumentoViaggio() {
  console.log('🔄 Migrando documentoViaggio a formato JSON...\n');

  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión a base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Verificar estado actual
    console.log('2. Verificando estado actual de la tabla...');
    const currentStructure = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tour_aereo' 
      AND column_name IN ('documentoViaggio', 'documentoViaggioName', 'documentoViaggio_json')
      ORDER BY column_name
    `;
    
    console.log('📊 Columnas actuales:');
    currentStructure.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type}`);
    });
    console.log('');

    // 3. Verificar si ya existe la columna JSON
    const hasJsonColumn = currentStructure.some(col => col.column_name === 'documentoViaggio_json');
    const hasOldColumns = currentStructure.some(col => col.column_name === 'documentoViaggio' && col.data_type === 'text');

    if (!hasOldColumns && !hasJsonColumn) {
      console.log('⚠️  No se encontraron las columnas esperadas. Verificando si la migración ya se aplicó...');
      const hasNewColumn = currentStructure.some(col => col.column_name === 'documentoViaggio' && col.data_type === 'jsonb');
      if (hasNewColumn) {
        console.log('✅ La migración ya fue aplicada. La columna documentoViaggio es JSONB.');
        return;
      }
    }

    // 4. Contar registros con documentoViaggio
    console.log('3. Contando registros con documentoViaggio...');
    const countWithDoc = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM tour_aereo 
      WHERE "documentoViaggio" IS NOT NULL
    `;
    console.log(`   📝 Registros con documentoViaggio: ${countWithDoc[0].count}\n`);

    // 5. Ejecutar migración paso a paso
    console.log('4. Ejecutando migración...\n');

    // Paso 1: Agregar columna temporal JSON
    console.log('   Paso 1: Agregando columna temporal JSONB...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "tour_aereo" 
        ADD COLUMN IF NOT EXISTS "documentoViaggio_json" JSONB
      `);
      console.log('   ✅ Columna temporal creada\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  Columna temporal ya existe (continuando...)\n');
      } else {
        throw error;
      }
    }

    // Paso 2: Migrar datos existentes
    console.log('   Paso 2: Migrando datos existentes a formato JSON...');
    await prisma.$executeRawUnsafe(`
      UPDATE "tour_aereo"
      SET "documentoViaggio_json" = jsonb_build_array(
        jsonb_build_object(
          'url', "documentoViaggio",
          'name', COALESCE("documentoViaggioName", 'documento')
        )
      )
      WHERE "documentoViaggio" IS NOT NULL
    `);
    console.log('   ✅ Datos migrados\n');

    // Paso 3: Actualizar registros sin documentoViaggio
    console.log('   Paso 3: Actualizando registros sin documentoViaggio...');
    await prisma.$executeRawUnsafe(`
      UPDATE "tour_aereo"
      SET "documentoViaggio_json" = NULL
      WHERE "documentoViaggio" IS NULL
    `);
    console.log('   ✅ Registros actualizados\n');

    // Paso 4: Renombrar columnas (preservar datos antiguos como respaldo)
    console.log('   Paso 4: Renombrando columnas (preservando datos antiguos)...');
    
    // Verificar si las columnas antiguas ya fueron renombradas
    const hasOldBackup = currentStructure.some(col => col.column_name === 'documentoViaggio_old');
    
    if (!hasOldBackup) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "tour_aereo" 
        RENAME COLUMN "documentoViaggio" TO "documentoViaggio_old"
      `);
      console.log('   ✅ Columna documentoViaggio renombrada a documentoViaggio_old');
    } else {
      console.log('   ⚠️  Columna documentoViaggio_old ya existe (omitiendo...)');
    }

    if (!currentStructure.some(col => col.column_name === 'documentoViaggioName_old')) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "tour_aereo" 
        RENAME COLUMN "documentoViaggioName" TO "documentoViaggioName_old"
      `);
      console.log('   ✅ Columna documentoViaggioName renombrada a documentoViaggioName_old');
    } else {
      console.log('   ⚠️  Columna documentoViaggioName_old ya existe (omitiendo...)');
    }

    // Renombrar la columna JSON a documentoViaggio
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "tour_aereo" 
      RENAME COLUMN "documentoViaggio_json" TO "documentoViaggio"
    `);
    console.log('   ✅ Columna JSON renombrada a documentoViaggio\n');

    // 6. Verificar resultado
    console.log('5. Verificando resultado de la migración...');
    const finalStructure = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tour_aereo' 
      AND column_name LIKE '%documentoViaggio%'
      ORDER BY column_name
    `;
    
    console.log('📊 Estructura final:');
    finalStructure.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type}`);
    });

    // Verificar datos migrados
    const migratedData = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM tour_aereo 
      WHERE "documentoViaggio" IS NOT NULL
    `;
    console.log(`\n📝 Registros con documentoViaggio (JSON): ${migratedData[0].count}`);

    // Verificar un ejemplo
    const example = await prisma.$queryRaw`
      SELECT "documentoViaggio" 
      FROM tour_aereo 
      WHERE "documentoViaggio" IS NOT NULL 
      LIMIT 1
    `;
    if (example.length > 0) {
      console.log('\n📄 Ejemplo de dato migrado:');
      console.log(JSON.stringify(example[0].documentoViaggio, null, 2));
    }

    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n📌 NOTA: Las columnas antiguas (documentoViaggio_old y documentoViaggioName_old)');
    console.log('   se mantienen como respaldo. Puedes eliminarlas manualmente después de verificar');
    console.log('   que todo funciona correctamente.\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    console.error('\n⚠️  La migración se detuvo. Revisa el error y vuelve a intentar.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateDocumentoViaggio()
  .then(() => {
    console.log('\n🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

