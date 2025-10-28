const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listConfigTables() {
  console.log('📊 Listando tablas de configuración en base de datos local...\n');

  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 1. Verificar tablas de configuración/referencia usando Prisma
    console.log('1. Tablas de configuración/referencia:');
    
    // Pagamento
    try {
      const pagamento = await prisma.pagamento.findMany();
      console.log(`   ✅ pagamento: ${pagamento.length} registros`);
      if (pagamento.length > 0) {
        console.log(`      Ejemplos: ${pagamento.slice(0, 3).map(p => p.pagamento).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ pagamento: Error - ${error.message}`);
    }

    // MetodoPagamento
    try {
      const metodoPagamento = await prisma.metodoPagamento.findMany();
      console.log(`   ✅ metodoPagamento: ${metodoPagamento.length} registros`);
      if (metodoPagamento.length > 0) {
        console.log(`      Ejemplos: ${metodoPagamento.slice(0, 3).map(m => m.metodoPagamento).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ metodoPagamento: Error - ${error.message}`);
    }

    // Servizio
    try {
      const servizio = await prisma.servizio.findMany();
      console.log(`   ✅ servizio: ${servizio.length} registros`);
      if (servizio.length > 0) {
        console.log(`      Ejemplos: ${servizio.slice(0, 3).map(s => s.servizio).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ servizio: Error - ${error.message}`);
    }

    // Iata
    try {
      const iata = await prisma.iata.findMany();
      console.log(`   ✅ iata: ${iata.length} registros`);
      if (iata.length > 0) {
        console.log(`      Ejemplos: ${iata.slice(0, 3).map(i => i.iata).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ iata: Error - ${error.message}`);
    }

    // FermataBus
    try {
      const fermataBus = await prisma.fermataBus.findMany();
      console.log(`   ✅ fermataBus: ${fermataBus.length} registros`);
      if (fermataBus.length > 0) {
        console.log(`      Ejemplos: ${fermataBus.slice(0, 3).map(f => f.fermata).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ fermataBus: Error - ${error.message}`);
    }

    // StatoBus
    try {
      const statoBus = await prisma.statoBus.findMany();
      console.log(`   ✅ statoBus: ${statoBus.length} registros`);
      if (statoBus.length > 0) {
        console.log(`      Ejemplos: ${statoBus.slice(0, 3).map(s => s.stato).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ statoBus: Error - ${error.message}`);
    }

    // 2. Verificar tablas de plantillas
    console.log('\n2. Tablas de plantillas:');
    
    // Info
    try {
      const info = await prisma.info.findMany();
      console.log(`   ✅ info: ${info.length} registros`);
      if (info.length > 0) {
        console.log(`      Ejemplos: ${info.slice(0, 3).map(i => i.title).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ info: Error - ${error.message}`);
    }

    // Routes
    try {
      const routes = await prisma.route.findMany();
      console.log(`   ✅ routes: ${routes.length} registros`);
      if (routes.length > 0) {
        console.log(`      Ejemplos: ${routes.slice(0, 3).map(r => r.title).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ routes: Error - ${error.message}`);
    }

    // Stops
    try {
      const stops = await prisma.stop.findMany();
      console.log(`   ✅ stops: ${stops.length} registros`);
      if (stops.length > 0) {
        console.log(`      Ejemplos: ${stops.slice(0, 3).map(s => s.title).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ stops: Error - ${error.message}`);
    }

    // 3. Verificar usuarios
    console.log('\n3. Usuarios:');
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

    // 4. Verificar clientes
    console.log('\n4. Clientes:');
    try {
      const clients = await prisma.client.findMany();
      console.log(`   👥 Total clientes: ${clients.length}`);
      if (clients.length > 0) {
        console.log(`      Ejemplos: ${clients.slice(0, 3).map(c => c.nombre).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ Error verificando clientes: ${error.message}`);
    }

    // 5. Resumen
    console.log('\n📋 RESUMEN DE TABLAS DE CONFIGURACIÓN:');
    console.log('   🔧 Datos de referencia (necesarios para formularios):');
    console.log('      • pagamento - Tipos de pago');
    console.log('      • metodoPagamento - Métodos de pago');
    console.log('      • servizio - Servicios disponibles');
    console.log('      • iata - Códigos de aeropuertos');
    console.log('      • fermataBus - Paradas de autobús');
    console.log('      • statoBus - Estados de autobús');
    console.log('   📄 Plantillas (para generar documentos):');
    console.log('      • info - Plantillas de información');
    console.log('      • routes - Plantillas de rutas');
    console.log('      • stops - Plantillas de paradas');
    console.log('   👥 Usuarios y datos:');
    console.log('      • user - Usuarios del sistema');
    console.log('      • client - Clientes registrados');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listConfigTables();
