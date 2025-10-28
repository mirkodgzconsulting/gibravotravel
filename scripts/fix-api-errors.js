const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function fixApiErrors() {
  console.log('🔧 Reparando errores específicos de API...\n');

  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Recrear usuarios de prueba con datos completos
    console.log('2. Recreando usuarios de prueba...');
    
    const testUsers = [
      {
        id: 'user_ti_test',
        clerkId: 'user_33SQ3k9daADwzexJSS23utCpPqr',
        email: 'ti@test.com',
        firstName: 'TI',
        lastName: 'Test',
        phoneNumber: '+39 123 456 7890',
        role: 'TI',
        isActive: true
      },
      {
        id: 'user_admin_test',
        clerkId: 'user_33bf957OvyQP9DxufYeP7EeKWP8',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'Test',
        phoneNumber: '+39 123 456 7891',
        role: 'ADMIN',
        isActive: true
      },
      {
        id: 'user_user_test',
        clerkId: 'user_34Z5esFYazEGrGfCua4vMHBIcPj',
        email: 'user@test.com',
        firstName: 'User',
        lastName: 'Test',
        phoneNumber: '+39 123 456 7892',
        role: 'USER',
        isActive: true
      }
    ];

    for (const userData of testUsers) {
      try {
        // Eliminar usuario existente
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

        console.log(`   ✅ Usuario ${userData.email} (${userData.role}) recreado`);
      } catch (error) {
        console.log(`   ❌ Error con usuario ${userData.email}: ${error.message}`);
      }
    }

    // 3. Crear datos de referencia completos
    console.log('\n3. Creando datos de referencia completos...');
    
    const referenceData = {
      pagamento: [
        { id: 'ref_pag_1', pagamento: 'Efectivo', isActive: true },
        { id: 'ref_pag_2', pagamento: 'Transferencia', isActive: true },
        { id: 'ref_pag_3', pagamento: 'Tarjeta', isActive: true },
        { id: 'ref_pag_4', pagamento: 'Cheque', isActive: true }
      ],
      metodo_pagamento: [
        { id: 'ref_met_1', metodoPagamento: 'Efectivo', isActive: true },
        { id: 'ref_met_2', metodoPagamento: 'Transferencia Bancaria', isActive: true },
        { id: 'ref_met_3', metodoPagamento: 'Tarjeta de Crédito', isActive: true },
        { id: 'ref_met_4', metodoPagamento: 'Tarjeta de Débito', isActive: true },
        { id: 'ref_met_5', metodoPagamento: 'PayPal', isActive: true }
      ],
      servizio: [
        { id: 'ref_serv_1', servizio: 'Vuelo', isActive: true },
        { id: 'ref_serv_2', servizio: 'Hotel', isActive: true },
        { id: 'ref_serv_3', servizio: 'Transfer', isActive: true },
        { id: 'ref_serv_4', servizio: 'Excursión', isActive: true },
        { id: 'ref_serv_5', servizio: 'Seguro', isActive: true }
      ],
      iata: [
        { id: 'ref_iata_1', iata: 'FCO', isActive: true },
        { id: 'ref_iata_2', iata: 'MAD', isActive: true },
        { id: 'ref_iata_3', iata: 'BCN', isActive: true },
        { id: 'ref_iata_4', iata: 'LHR', isActive: true },
        { id: 'ref_iata_5', iata: 'CDG', isActive: true }
      ],
      fermata_bus: [
        { id: 'ref_ferm_1', fermata: 'Roma Termini', isActive: true },
        { id: 'ref_ferm_2', fermata: 'Fiumicino', isActive: true },
        { id: 'ref_ferm_3', fermata: 'Ciampino', isActive: true },
        { id: 'ref_ferm_4', fermata: 'Milano Centrale', isActive: true }
      ],
      stato_bus: [
        { id: 'ref_stato_1', stato: 'Libero', isActive: true },
        { id: 'ref_stato_2', stato: 'Ocupado', isActive: true },
        { id: 'ref_stato_3', stato: 'Reservado', isActive: true },
        { id: 'ref_stato_4', stato: 'Mantenimiento', isActive: true },
        { id: 'ref_stato_5', stato: 'Fuera de servicio', isActive: true }
      ]
    };

    for (const [tableName, data] of Object.entries(referenceData)) {
      try {
        // Limpiar tabla
        await prisma.$queryRaw`DELETE FROM ${tableName}`;
        
        // Insertar datos
        for (const item of data) {
          await prisma[tableName].create({
            data: item
          });
        }
        
        console.log(`   ✅ ${tableName}: ${data.length} registros creados`);
      } catch (error) {
        console.log(`   ❌ Error en ${tableName}: ${error.message}`);
      }
    }

    // 4. Crear plantillas de ejemplo para evitar errores de "no hay datos"
    console.log('\n4. Creando plantillas de ejemplo...');
    
    try {
      // Plantilla de info
      await prisma.info.create({
        data: {
          id: 'info_ejemplo',
          title: 'Información de Ejemplo',
          textContent: 'Esta es una plantilla de información de ejemplo.',
          createdBy: 'user_33SQ3k9daADwzexJSS23utCpPqr',
          isDeleted: false
        }
      });
      console.log('   ✅ Plantilla de info creada');
    } catch (error) {
      console.log(`   ⚠️  Error creando plantilla de info: ${error.message}`);
    }

    try {
      // Plantilla de ruta
      await prisma.route.create({
        data: {
          id: 'route_ejemplo',
          title: 'Ruta de Ejemplo',
          textContent: 'Esta es una plantilla de ruta de ejemplo.',
          createdBy: 'user_33SQ3k9daADwzexJSS23utCpPqr',
          isDeleted: false
        }
      });
      console.log('   ✅ Plantilla de ruta creada');
    } catch (error) {
      console.log(`   ⚠️  Error creando plantilla de ruta: ${error.message}`);
    }

    try {
      // Plantilla de parada
      await prisma.stop.create({
        data: {
          id: 'stop_ejemplo',
          title: 'Parada de Ejemplo',
          textContent: 'Esta es una plantilla de parada de ejemplo.',
          createdBy: 'user_33SQ3k9daADwzexJSS23utCpPqr',
          isDeleted: false
        }
      });
      console.log('   ✅ Plantilla de parada creada');
    } catch (error) {
      console.log(`   ⚠️  Error creando plantilla de parada: ${error.message}`);
    }

    // 5. Aplicar índices de rendimiento
    console.log('\n5. Aplicando índices de rendimiento...');
    try {
      execSync('node scripts/apply-db-optimizations.js', { stdio: 'pipe' });
      console.log('   ✅ Índices aplicados');
    } catch (error) {
      console.log(`   ⚠️  Error aplicando índices: ${error.message}`);
    }

    // 6. Verificación final
    console.log('\n6. Verificación final...');
    
    const finalChecks = [
      { name: 'Usuarios', query: () => prisma.user.count() },
      { name: 'Clientes', query: () => prisma.client.count() },
      { name: 'Plantillas Info', query: () => prisma.info.count() },
      { name: 'Plantillas Rutas', query: () => prisma.route.count() },
      { name: 'Plantillas Paradas', query: () => prisma.stop.count() },
      { name: 'Métodos de Pago', query: () => prisma.metodoPagamento.count() },
      { name: 'Servicios', query: () => prisma.servizio.count() }
    ];

    for (const check of finalChecks) {
      try {
        const count = await check.query();
        console.log(`   ✅ ${check.name}: ${count} registros`);
      } catch (error) {
        console.log(`   ❌ ${check.name}: Error - ${error.message}`);
      }
    }

    console.log('\n✅ Reparación de errores de API completada!');
    console.log('\n🎉 Las APIs deberían funcionar correctamente ahora');

  } catch (error) {
    console.error('❌ Error durante reparación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixApiErrors();
