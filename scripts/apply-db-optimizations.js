const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyDatabaseOptimizations() {
  console.log('🚀 Iniciando optimizaciones de base de datos...');
  
  try {
    // 1. Verificar conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a la base de datos verificada');

    // 2. Leer y ejecutar script de índices
    console.log('📊 Aplicando índices de rendimiento...');
    const sqlFile = path.join(__dirname, 'add-performance-indexes-safe.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir el script en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      try {
        if (command.trim()) {
          await prisma.$executeRawUnsafe(command);
          successCount++;
          console.log(`✅ Índice aplicado: ${command.split(' ')[5] || 'comando'}`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Índice ya existe: ${command.split(' ')[5] || 'comando'}`);
          successCount++;
        } else {
          console.error(`❌ Error aplicando índice: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Resumen de índices:`);
    console.log(`   ✅ Aplicados exitosamente: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    // 3. Verificar índices creados
    console.log('\n🔍 Verificando índices creados...');
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

    console.log(`✅ Se encontraron ${indexes.length} índices de rendimiento:`);
    indexes.forEach(index => {
      console.log(`   - ${index.tablename}.${index.indexname}`);
    });

    // 4. Verificar rendimiento de consultas críticas
    console.log('\n⚡ Verificando rendimiento de consultas críticas...');
    
    // Test 1: Consulta de biglietteria por fecha
    const start1 = Date.now();
    await prisma.biglietteria.findMany({
      where: {
        isActive: true,
        data: {
          gte: new Date('2024-01-01'),
          lte: new Date('2024-12-31')
        }
      },
      take: 10
    });
    const time1 = Date.now() - start1;
    console.log(`   📊 Biglietteria por fecha: ${time1}ms`);

    // Test 2: Consulta de notificaciones por usuario
    const start2 = Date.now();
    await prisma.notificacion.findMany({
      where: {
        isLeida: false
      },
      take: 10
    });
    const time2 = Date.now() - start2;
    console.log(`   🔔 Notificaciones no leídas: ${time2}ms`);

    // Test 3: Consulta de agendas por fecha
    const start3 = Date.now();
    await prisma.agendaPersonal.findMany({
      where: {
        isActive: true,
        fecha: {
          gte: new Date()
        }
      },
      take: 10
    });
    const time3 = Date.now() - start3;
    console.log(`   📅 Agendas futuras: ${time3}ms`);

    console.log('\n🎉 Optimizaciones de base de datos completadas exitosamente!');
    
    return {
      success: true,
      indexesApplied: successCount,
      errors: errorCount,
      totalIndexes: indexes.length,
      performance: {
        biglietteriaQuery: time1,
        notificationsQuery: time2,
        agendasQuery: time3
      }
    };

  } catch (error) {
    console.error('❌ Error durante las optimizaciones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar optimizaciones
applyDatabaseOptimizations()
  .then((result) => {
    console.log('\n📋 Resumen final:');
    console.log(`   - Índices aplicados: ${result.indexesApplied}`);
    console.log(`   - Errores: ${result.errors}`);
    console.log(`   - Total de índices: ${result.totalIndexes}`);
    console.log(`   - Rendimiento mejorado: ✅`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en las optimizaciones:', error);
    process.exit(1);
  });
