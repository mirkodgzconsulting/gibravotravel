const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function replicateLocalToProduction() {
  console.log('🔄 Replicando estructura local a producción...\n');

  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión a producción...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Obtener estructura actual de la BD local
    console.log('2. Obteniendo estructura de BD local...');
    
    // Obtener todas las tablas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`📊 Tablas encontradas: ${tables.length}`);
    tables.forEach(table => {
      console.log(`   • ${table.table_name}`);
    });

    // 3. Verificar usuarios existentes
    console.log('\n3. Verificando usuarios existentes...');
    const existingUsers = await prisma.user.findMany({
      select: { email: true, role: true, isActive: true }
    });
    
    console.log(`👥 Usuarios encontrados: ${existingUsers.length}`);
    existingUsers.forEach(user => {
      console.log(`   • ${user.email} (${user.role}) - Activo: ${user.isActive}`);
    });

    // 4. Crear usuarios de prueba si no existen
    console.log('\n4. Creando/actualizando usuarios de prueba...');
    
    const testUsers = [
      {
        id: 'user_ti_test',
        clerkId: 'user_33SQ3k9daADwzexJSS23utCpPqr',
        email: 'ti@test.com',
        firstName: 'TI',
        lastName: 'Test',
        role: 'TI',
        isActive: true
      },
      {
        id: 'user_admin_test',
        clerkId: 'user_33bf957OvyQP9DxufYeP7EeKWP8',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN',
        isActive: true
      },
      {
        id: 'user_user_test',
        clerkId: 'user_34Z5esFYazEGrGfCua4vMHBIcPj',
        email: 'user@test.com',
        firstName: 'User',
        lastName: 'Test',
        role: 'USER',
        isActive: true
      }
    ];

    for (const userData of testUsers) {
      try {
        // Eliminar usuario existente si existe
        await prisma.user.deleteMany({
          where: {
            OR: [
              { clerkId: userData.clerkId },
              { email: userData.email }
            ]
          }
        });

        // Crear usuario nuevo
        await prisma.user.create({
          data: userData
        });

        console.log(`   ✅ Usuario ${userData.email} (${userData.role}) creado/actualizado`);
      } catch (error) {
        console.log(`   ❌ Error con usuario ${userData.email}: ${error.message}`);
      }
    }

    // 5. Crear datos de referencia esenciales
    console.log('\n5. Creando datos de referencia esenciales...');
    
    const referenceData = {
      pagamento: [
        { id: 'ref_pag_1', pagamento: 'Efectivo', isActive: true },
        { id: 'ref_pag_2', pagamento: 'Transferencia', isActive: true },
        { id: 'ref_pag_3', pagamento: 'Tarjeta', isActive: true }
      ],
      metodo_pagamento: [
        { id: 'ref_met_1', metodoPagamento: 'Efectivo', isActive: true },
        { id: 'ref_met_2', metodoPagamento: 'Transferencia Bancaria', isActive: true },
        { id: 'ref_met_3', metodoPagamento: 'Tarjeta de Crédito', isActive: true },
        { id: 'ref_met_4', metodoPagamento: 'Tarjeta de Débito', isActive: true }
      ],
      servizio: [
        { id: 'ref_serv_1', servizio: 'Vuelo', isActive: true },
        { id: 'ref_serv_2', servizio: 'Hotel', isActive: true },
        { id: 'ref_serv_3', servizio: 'Transfer', isActive: true },
        { id: 'ref_serv_4', servizio: 'Excursión', isActive: true }
      ],
      iata: [
        { id: 'ref_iata_1', iata: 'FCO', isActive: true },
        { id: 'ref_iata_2', iata: 'MAD', isActive: true },
        { id: 'ref_iata_3', iata: 'BCN', isActive: true },
        { id: 'ref_iata_4', iata: 'LHR', isActive: true }
      ],
      fermata_bus: [
        { id: 'ref_ferm_1', fermata: 'Roma Termini', isActive: true },
        { id: 'ref_ferm_2', fermata: 'Fiumicino', isActive: true },
        { id: 'ref_ferm_3', fermata: 'Ciampino', isActive: true }
      ],
      stato_bus: [
        { id: 'ref_stato_1', stato: 'Libero', isActive: true },
        { id: 'ref_stato_2', stato: 'Ocupado', isActive: true },
        { id: 'ref_stato_3', stato: 'Reservado', isActive: true },
        { id: 'ref_stato_4', stato: 'Mantenimiento', isActive: true }
      ]
    };

    for (const [tableName, data] of Object.entries(referenceData)) {
      try {
        // Verificar si ya existen datos
        const existing = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${tableName}`;
        
        if (existing[0].count === 0) {
          // Insertar datos usando Prisma
          for (const item of data) {
            await prisma[tableName].create({
              data: item
            });
          }
          console.log(`   ✅ ${tableName}: ${data.length} registros creados`);
        } else {
          console.log(`   ⚠️  ${tableName}: Ya tiene ${existing[0].count} registros`);
        }
      } catch (error) {
        console.log(`   ❌ Error en ${tableName}: ${error.message}`);
      }
    }

    // 6. Aplicar índices de rendimiento
    console.log('\n6. Aplicando índices de rendimiento...');
    try {
      execSync('node scripts/apply-db-optimizations.js', { stdio: 'pipe' });
      console.log('   ✅ Índices aplicados');
    } catch (error) {
      console.log(`   ⚠️  Error aplicando índices: ${error.message}`);
    }

    // 7. Verificación final
    console.log('\n7. Verificación final...');
    
    const finalUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { email: true, role: true }
    });
    
    console.log(`   📊 Usuarios activos: ${finalUsers.length}`);
    finalUsers.forEach(user => {
      console.log(`   • ${user.email} (${user.role})`);
    });

    // Verificar APIs principales
    console.log('\n8. Verificando APIs principales...');
    const apiTests = [
      { name: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'Clients', query: 'SELECT COUNT(*) as count FROM clients' },
      { name: 'Biglietteria', query: 'SELECT COUNT(*) as count FROM biglietteria' },
      { name: 'Tour Bus', query: 'SELECT COUNT(*) as count FROM tour_bus' },
      { name: 'Tour Aereo', query: 'SELECT COUNT(*) as count FROM tour_aereo' }
    ];

    for (const test of apiTests) {
      try {
        const result = await prisma.$queryRaw`${test.query}`;
        console.log(`   ✅ ${test.name}: ${result[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ ${test.name}: Error - ${error.message}`);
      }
    }

    console.log('\n✅ Replicación completada exitosamente!');
    console.log('\n🎉 La base de datos de producción está lista para usar');

  } catch (error) {
    console.error('❌ Error durante replicación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

replicateLocalToProduction();
