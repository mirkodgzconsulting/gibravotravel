const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function createProductionSchema() {
  console.log('🏗️  Creando esquema de producción desde local...\n');

  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Crear migración inicial si no existe
    console.log('2. Creando migración inicial...');
    try {
      execSync('npx prisma migrate dev --name init --create-only', { stdio: 'pipe' });
      console.log('   ✅ Migración inicial creada');
    } catch (error) {
      console.log('   ⚠️  Migración ya existe o error: ' + error.message);
    }

    // 3. Aplicar migración
    console.log('\n3. Aplicando migración...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'pipe' });
      console.log('   ✅ Migración aplicada');
    } catch (error) {
      console.log('   ⚠️  Error aplicando migración: ' + error.message);
    }

    // 4. Generar cliente de Prisma
    console.log('\n4. Generando cliente de Prisma...');
    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('   ✅ Cliente generado');
    } catch (error) {
      console.log('   ❌ Error generando cliente: ' + error.message);
    }

    // 5. Verificar estructura creada
    console.log('\n5. Verificando estructura creada...');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`📊 Tablas creadas: ${tables.length}`);
    tables.forEach(table => {
      console.log(`   • ${table.table_name}`);
    });

    // 6. Crear usuarios de prueba
    console.log('\n6. Creando usuarios de prueba...');
    
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
        // Eliminar si existe
        await prisma.user.deleteMany({
          where: {
            OR: [
              { clerkId: userData.clerkId },
              { email: userData.email }
            ]
          }
        });

        // Crear nuevo
        await prisma.user.create({
          data: userData
        });

        console.log(`   ✅ Usuario ${userData.email} (${userData.role}) creado`);
      } catch (error) {
        console.log(`   ❌ Error con usuario ${userData.email}: ${error.message}`);
      }
    }

    // 7. Crear datos de referencia
    console.log('\n7. Creando datos de referencia...');
    
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
          // Insertar datos
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

    console.log('\n✅ Esquema de producción creado exitosamente!');
    console.log('\n🎉 La base de datos está lista para usar');

  } catch (error) {
    console.error('❌ Error creando esquema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProductionSchema();
