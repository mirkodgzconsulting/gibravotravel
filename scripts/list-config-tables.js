const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listConfigTables() {
  console.log('📊 Listando tablas de configuración en base de datos local...\n');

  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 1. Obtener todas las tablas
    console.log('1. Todas las tablas en la base de datos:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });

    // 2. Identificar tablas de configuración/referencia
    console.log('\n2. Tablas de configuración/referencia identificadas:');
    
    const configTables = [
      'pagamento',
      'metodo_pagamento', 
      'servizio',
      'iata',
      'fermata_bus',
      'stato_bus'
    ];

    for (const tableName of configTables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
        console.log(`   ✅ ${tableName}: ${count[0].count} registros`);
        
        // Mostrar algunos registros de ejemplo
        if (count[0].count > 0) {
          const sample = await prisma.$queryRaw`SELECT * FROM ${tableName} LIMIT 3`;
          console.log(`      Ejemplos:`, sample);
        }
      } catch (error) {
        console.log(`   ❌ ${tableName}: Error - ${error.message}`);
      }
    }

    // 3. Verificar tablas de plantillas
    console.log('\n3. Tablas de plantillas:');
    
    const templateTables = ['info', 'routes', 'stops'];
    
    for (const tableName of templateTables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
        console.log(`   ✅ ${tableName}: ${count[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: Error - ${error.message}`);
      }
    }

    // 4. Verificar usuarios
    console.log('\n4. Usuarios:');
    try {
      const users = await prisma.user.findMany({
        select: {
          email: true,
          role: true,
          isActive: true
        }
      });
      console.log(`   👥 Total usuarios: ${users.length}`);
      users.forEach(user => {
        console.log(`      • ${user.email} (${user.role}) - Activo: ${user.isActive}`);
      });
    } catch (error) {
      console.log(`   ❌ Error verificando usuarios: ${error.message}`);
    }

    // 5. Resumen de tablas de configuración
    console.log('\n📋 RESUMEN DE TABLAS DE CONFIGURACIÓN:');
    console.log('   🔧 Datos de referencia:');
    console.log('      • pagamento - Tipos de pago');
    console.log('      • metodo_pagamento - Métodos de pago');
    console.log('      • servizio - Servicios disponibles');
    console.log('      • iata - Códigos de aeropuertos');
    console.log('      • fermata_bus - Paradas de autobús');
    console.log('      • stato_bus - Estados de autobús');
    console.log('   📄 Plantillas:');
    console.log('      • info - Plantillas de información');
    console.log('      • routes - Plantillas de rutas');
    console.log('      • stops - Plantillas de paradas');
    console.log('   👥 Usuarios:');
    console.log('      • user - Usuarios del sistema');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listConfigTables();
