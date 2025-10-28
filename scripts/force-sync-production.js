const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceSyncProduction() {
  console.log('🔄 Forzando sincronización completa con producción...\n');

  try {
    // 1. Forzar reseteo y aplicación del esquema
    console.log('1. Forzando reseteo de base de datos y aplicando esquema...');
    try {
      execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
      console.log('✅ Esquema aplicado exitosamente');
    } catch (error) {
      console.log(`❌ Error aplicando esquema: ${error.message}`);
      return;
    }

    // 2. Generar Prisma Client
    console.log('\n2. Generando Prisma Client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma Client generado');
    } catch (error) {
      console.log(`❌ Error generando cliente: ${error.message}`);
      return;
    }

    // 3. Conectar y verificar
    console.log('\n3. Verificando conexión...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa');

    // 4. Crear usuarios de prueba
    console.log('\n4. Creando usuarios de prueba...');
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
        await prisma.user.create({
          data: userData
        });
        console.log(`   ✅ Usuario ${userData.email} (${userData.role}) creado`);
      } catch (error) {
        console.log(`   ❌ Error con usuario ${userData.email}: ${error.message}`);
      }
    }

    // 5. Crear datos de referencia
    console.log('\n5. Creando datos de referencia...');
    
    const referenceData = {
      pagamento: [
        { id: 'ref_pag_1', pagamento: 'Efectivo', isActive: true },
        { id: 'ref_pag_2', pagamento: 'Transferencia', isActive: true },
        { id: 'ref_pag_3', pagamento: 'Tarjeta', isActive: true }
      ],
      metodoPagamento: [
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
      fermataBus: [
        { id: 'ref_ferm_1', fermata: 'Roma Termini', isActive: true },
        { id: 'ref_ferm_2', fermata: 'Fiumicino', isActive: true },
        { id: 'ref_ferm_3', fermata: 'Ciampino', isActive: true }
      ],
      statoBus: [
        { id: 'ref_stato_1', stato: 'Libero', isActive: true },
        { id: 'ref_stato_2', stato: 'Ocupado', isActive: true },
        { id: 'ref_stato_3', stato: 'Reservado', isActive: true },
        { id: 'ref_stato_4', stato: 'Mantenimiento', isActive: true }
      ]
    };

    for (const [tableName, data] of Object.entries(referenceData)) {
      try {
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

    // 6. Crear plantillas de ejemplo
    console.log('\n6. Creando plantillas de ejemplo...');
    
    try {
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

    // 7. Verificación final
    console.log('\n7. Verificación final...');
    
    const finalChecks = [
      { name: 'Usuarios', query: () => prisma.user.count() },
      { name: 'Plantillas Info', query: () => prisma.info.count() },
      { name: 'Plantillas Rutas', query: () => prisma.route.count() },
      { name: 'Plantillas Paradas', query: () => prisma.stop.count() },
      { name: 'Métodos de Pago', query: () => prisma.metodoPagamento.count() }
    ];

    for (const check of finalChecks) {
      try {
        const count = await check.query();
        console.log(`   ✅ ${check.name}: ${count} registros`);
      } catch (error) {
        console.log(`   ❌ ${check.name}: Error - ${error.message}`);
      }
    }

    console.log('\n✅ Sincronización forzada completada!');
    console.log('\n🎉 La base de datos de producción debería funcionar correctamente ahora');

  } catch (error) {
    console.error('❌ Error durante sincronización forzada:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceSyncProduction();
