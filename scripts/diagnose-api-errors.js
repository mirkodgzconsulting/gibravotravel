const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseApiErrors() {
  console.log('🔍 Diagnóstico detallado de errores de API...\n');

  try {
    // 1. Verificar conexión básica
    console.log('1. Verificando conexión a base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Verificar variables de entorno
    console.log('2. Verificando variables de entorno...');
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Configurado' : 'No configurado',
      NODE_ENV: process.env.NODE_ENV || 'No definido',
      VERCEL: process.env.VERCEL || 'No definido'
    };
    
    console.log('📊 Variables de entorno:');
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });

    // 3. Verificar estructura de tablas críticas
    console.log('\n3. Verificando estructura de tablas críticas...');
    
    const criticalTables = [
      'users', 'clients', 'biglietteria', 'tour_bus', 'tour_aereo',
      'ventas_tour_bus', 'ventas_tour_aereo', 'agendas_personales',
      'info', 'routes', 'stops'
    ];

    for (const table of criticalTables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${table}`;
        console.log(`   ✅ ${table}: ${count[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      }
    }

    // 4. Verificar usuarios y roles
    console.log('\n4. Verificando usuarios y roles...');
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          clerkId: true,
          email: true,
          role: true,
          isActive: true
        }
      });
      
      console.log(`👥 Usuarios encontrados: ${users.length}`);
      users.forEach(user => {
        console.log(`   • ${user.email} (${user.role}) - Activo: ${user.isActive}`);
      });

      if (users.length === 0) {
        console.log('   ⚠️  No hay usuarios - esto puede causar errores de autenticación');
      }
    } catch (error) {
      console.log(`   ❌ Error verificando usuarios: ${error.message}`);
    }

    // 5. Verificar datos de referencia
    console.log('\n5. Verificando datos de referencia...');
    const referenceTables = [
      'pagamento', 'metodo_pagamento', 'servizio', 'iata',
      'fermata_bus', 'stato_bus'
    ];

    for (const table of referenceTables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${table}`;
        if (count[0].count === 0) {
          console.log(`   ⚠️  ${table}: Sin datos - esto puede causar errores en formularios`);
        } else {
          console.log(`   ✅ ${table}: ${count[0].count} registros`);
        }
      } catch (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      }
    }

    // 6. Verificar índices
    console.log('\n6. Verificando índices de rendimiento...');
    try {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
      `;
      console.log(`📊 Índices encontrados: ${indexes.length}`);
      if (indexes.length === 0) {
        console.log('   ⚠️  No hay índices - esto puede causar lentitud en consultas');
      }
    } catch (error) {
      console.log(`   ❌ Error verificando índices: ${error.message}`);
    }

    // 7. Probar consultas específicas que pueden estar fallando
    console.log('\n7. Probando consultas específicas...');
    
    const testQueries = [
      {
        name: 'Usuarios activos',
        query: () => prisma.user.findMany({ where: { isActive: true } })
      },
      {
        name: 'Clientes activos',
        query: () => prisma.client.findMany({ where: { isActive: true } })
      },
      {
        name: 'Tours de bus activos',
        query: () => prisma.tourBus.findMany({ where: { isActive: true } })
      },
      {
        name: 'Tours aéreos activos',
        query: () => prisma.tourAereo.findMany({ where: { isActive: true } })
      },
      {
        name: 'Plantillas de info',
        query: () => prisma.info.findMany({ where: { isDeleted: false } })
      },
      {
        name: 'Plantillas de rutas',
        query: () => prisma.route.findMany({ where: { isDeleted: false } })
      },
      {
        name: 'Plantillas de paradas',
        query: () => prisma.stop.findMany({ where: { isDeleted: false } })
      }
    ];

    for (const test of testQueries) {
      try {
        const result = await test.query();
        console.log(`   ✅ ${test.name}: ${result.length} registros`);
      } catch (error) {
        console.log(`   ❌ ${test.name}: Error - ${error.message}`);
      }
    }

    // 8. Verificar configuración de Prisma
    console.log('\n8. Verificando configuración de Prisma...');
    try {
      const prismaVersion = require('@prisma/client').PrismaClient.name;
      console.log(`   📦 Prisma Client: ${prismaVersion}`);
      
      // Verificar si el cliente está generado correctamente
      const client = new PrismaClient();
      console.log(`   🔧 Cliente Prisma: Creado correctamente`);
    } catch (error) {
      console.log(`   ❌ Error en configuración de Prisma: ${error.message}`);
    }

    console.log('\n✅ Diagnóstico completado');
    console.log('\n📋 RESUMEN:');
    console.log('   • Si hay errores en tablas críticas, la BD no está bien configurada');
    console.log('   • Si no hay usuarios, las APIs de autenticación fallarán');
    console.log('   • Si no hay datos de referencia, los formularios fallarán');
    console.log('   • Si no hay índices, las consultas serán lentas');

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseApiErrors();
