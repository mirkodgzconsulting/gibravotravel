const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarIndices() {
  console.log('🔍 Verificando índices en la base de datos...\n');

  try {
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // Listar índices que empiezan con idx_
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `;

    console.log(`📊 Total de índices encontrados: ${indexes.length}\n`);

    if (indexes.length === 0) {
      console.log('❌ NO SE ENCONTRARON ÍNDICES!');
      console.log('⚠️  Los índices no se han aplicado aún.');
      console.log('\n🔧 Posibles causas:');
      console.log('   1. El deploy aún no se ha completado');
      console.log('   2. El postinstall no se ejecutó correctamente');
      console.log('   3. Hay un error en la conexión a la BD');
      console.log('\n📋 Resumen:');
      console.log('   - Índices encontrados: 0');
      return;
    }

    console.log('✅ ÍNDICES ENCONTRADOS:\n');

    // Agrupar por tabla
    const porTabla = {};
    indexes.forEach(idx => {
      if (!porTabla[idx.tablename]) {
        porTabla[idx.tablename] = [];
      }
      porTabla[idx.tablename].push(idx);
    });

    // Mostrar por tabla
    Object.entries(porTabla).forEach(([tabla, indices]) => {
      console.log(`📁 ${tabla}:`);
      indices.forEach(idx => {
        console.log(`   ✅ ${idx.indexname}`);
      });
      console.log('');
    });

    // Verificar índices críticos
    console.log('🎯 Verificando índices críticos:\n');
    
    const indicesCriticos = [
      'idx_biglietteria_created_by',
      'idx_biglietteria_active_data',
      'idx_tour_bus_fecha_viaje',
      'idx_tour_bus_active_fecha',
      'idx_tour_aereo_fecha_viaje',
      'idx_tour_aereo_active_fecha'
    ];

    const indicesEncontrados = indexes.map(idx => idx.indexname);
    
    let faltantes = 0;
    indicesCriticos.forEach(nombre => {
      if (indicesEncontrados.includes(nombre)) {
        console.log(`   ✅ ${nombre}`);
      } else {
        console.log(`   ❌ ${nombre} - FALTANTE`);
        faltantes++;
      }
    });

    if (faltantes > 0) {
      console.log(`\n⚠️  Faltan ${faltantes} índices críticos`);
    } else {
      console.log('\n✅ Todos los índices críticos están presentes');
    }

    // Test de performance
    console.log('\n⚡ Test de performance:\n');
    
    try {
      const start = Date.now();
      await prisma.biglietteria.findMany({
        where: { isActive: true },
        take: 10
      });
      const time = Date.now() - start;
      console.log(`   📊 Query Biglietteria: ${time}ms`);
      
      if (time < 50) {
        console.log('   ✅ EXCELENTE: < 50ms (con índices)');
      } else if (time < 200) {
        console.log('   ✅ BUENO: < 200ms');
      } else {
        console.log('   ⚠️  LENTO: > 200ms (posiblemente sin índices)');
      }
    } catch (error) {
      console.log('   ⚠️  Error en test de performance:', error.message);
    }

    console.log('\n📋 Resumen:');
    console.log(`   - Índices encontrados: ${indexes.length}`);
    console.log(`   - Tablas indexadas: ${Object.keys(porTabla).length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔧 Verifica:');
    console.error('   1. Que la conexión a la BD esté correcta');
    console.error('   2. Que estés en el entorno correcto (producción)');
    console.error('   3. Que DATABASE_URL esté configurado');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificacion
verificarIndices()
  .then(() => {
    console.log('\n✅ Verificación completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error durante verificación:', error.message);
    process.exit(1);
  });
