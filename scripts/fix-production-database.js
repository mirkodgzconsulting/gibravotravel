const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function fixProductionDatabase() {
  console.log('🔧 Reparando base de datos de producción...\n');

  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Recrear usuarios de prueba con roles correctos
    console.log('2. Recreando usuarios de prueba...');
    
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

        console.log(`   ✅ Usuario ${userData.email} (${userData.role}) creado`);
      } catch (error) {
        console.log(`   ❌ Error con usuario ${userData.email}: ${error.message}`);
      }
    }

    // 3. Crear datos de referencia si no existen
    console.log('\n3. Creando datos de referencia...');
    
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
            await prisma.$queryRaw`
              INSERT INTO ${tableName} (id, ${Object.keys(item).filter(k => k !== 'id').join(', ')}, "createdAt", "updatedAt")
              VALUES (${item.id}, ${Object.values(item).filter((_, i) => i !== 0).map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')}, NOW(), NOW())
              ON CONFLICT (id) DO NOTHING
            `;
          }
          console.log(`   ✅ ${tableName}: ${data.length} registros creados`);
        } else {
          console.log(`   ⚠️  ${tableName}: Ya tiene ${existing[0].count} registros`);
        }
      } catch (error) {
        console.log(`   ❌ Error en ${tableName}: ${error.message}`);
      }
    }

    // 4. Aplicar índices de rendimiento
    console.log('\n4. Aplicando índices de rendimiento...');
    try {
      execSync('node scripts/apply-db-optimizations.js', { stdio: 'pipe' });
      console.log('   ✅ Índices aplicados');
    } catch (error) {
      console.log(`   ⚠️  Error aplicando índices: ${error.message}`);
    }

    // 5. Verificar configuración final
    console.log('\n5. Verificando configuración final...');
    
    const finalUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { email: true, role: true }
    });
    
    console.log(`   📊 Usuarios activos: ${finalUsers.length}`);
    finalUsers.forEach(user => {
      console.log(`   • ${user.email} (${user.role})`);
    });

    console.log('\n✅ Reparación completada exitosamente!');
    console.log('\n🎉 La base de datos de producción está lista para usar');

  } catch (error) {
    console.error('❌ Error durante reparación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionDatabase();
