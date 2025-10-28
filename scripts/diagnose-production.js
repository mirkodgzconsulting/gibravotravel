const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseProduction() {
  console.log('🔍 Diagnóstico de producción...\n');

  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Verificar usuarios
    console.log('2. Verificando usuarios...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    
    console.log(`📊 Usuarios encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`   • ${user.email} (${user.role}) - Activo: ${user.isActive}`);
    });

    // 3. Verificar tablas principales
    console.log('\n3. Verificando tablas principales...');
    const tables = [
      'users', 'clients', 'biglietteria', 'tour_bus', 'tour_aereo',
      'ventas_tour_bus', 'ventas_tour_aereo', 'agendas_personales'
    ];

    for (const table of tables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${table}`;
        console.log(`   ✅ ${table}: ${count[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      }
    }

    // 4. Verificar datos de referencia
    console.log('\n4. Verificando datos de referencia...');
    const referenceTables = [
      'pagamento', 'metodo_pagamento', 'servizio', 'iata', 
      'fermata_bus', 'stato_bus'
    ];

    for (const table of referenceTables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${table}`;
        console.log(`   ${table}: ${count[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      }
    }

    // 5. Verificar índices
    console.log('\n5. Verificando índices...');
    try {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
      `;
      console.log(`   📊 Índices encontrados: ${indexes.length}`);
      indexes.forEach(idx => {
        console.log(`   • ${idx.tablename}: ${idx.indexname}`);
      });
    } catch (error) {
      console.log(`   ❌ Error verificando índices: ${error.message}`);
    }

    console.log('\n✅ Diagnóstico completado');

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseProduction();
