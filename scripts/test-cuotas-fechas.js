const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCuotasFechas() {
  console.log('🧪 PROBANDO FECHAS DE CUOTAS');
  console.log('================================');

  try {
    // 1. Buscar un registro con cuotas
    console.log('\n1. Buscando registro con cuotas...');
    const record = await prisma.biglietteria.findFirst({
      where: {
        cuotas: {
          some: {}
        }
      },
      include: {
        pasajeros: true,
        cuotas: {
          orderBy: {
            numeroCuota: 'asc',
          },
        },
        creator: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!record) {
      console.log('   ❌ No se encontró registro con cuotas');
      return;
    }

    console.log(`   ✅ Registro encontrado: ID ${record.id}, Cliente: ${record.cliente}`);
    console.log(`   📊 Cuotas: ${record.cuotas.length}`);

    // 2. Analizar cada cuota
    console.log('\n2. Analizando cuotas...');
    record.cuotas.forEach((cuota, index) => {
      console.log(`\n   Cuota ${index + 1}:`);
      console.log(`   - ID: ${cuota.id}`);
      console.log(`   - Número: ${cuota.numeroCuota}`);
      console.log(`   - Precio: ${cuota.prezzo}`);
      console.log(`   - Data (raw): ${cuota.data}`);
      console.log(`   - Data type: ${typeof cuota.data}`);
      console.log(`   - IsPagato: ${cuota.isPagato}`);
      
      if (cuota.data) {
        try {
          const fecha = new Date(cuota.data);
          console.log(`   - Fecha parseada: ${fecha}`);
          console.log(`   - Fecha válida: ${!isNaN(fecha.getTime())}`);
          if (!isNaN(fecha.getTime())) {
            console.log(`   - Fecha formateada (it-IT): ${fecha.toLocaleDateString('it-IT')}`);
          }
        } catch (error) {
          console.log(`   - Error parseando fecha: ${error.message}`);
        }
      } else {
        console.log('   - ⚠️  Data es null/undefined');
      }
    });

    // 3. Simular la lógica del API
    console.log('\n3. Simulando lógica del API...');
    const cuotasMapeadas = record.cuotas.map(cuota => {
      console.log(`\n   Procesando cuota ${cuota.numeroCuota}:`);
      console.log(`   - Data original: ${cuota.data}`);
      
      let fechaFormateada = 'Sin fecha';
      if (cuota.data) {
        try {
          const fecha = new Date(cuota.data);
          if (!isNaN(fecha.getTime())) {
            fechaFormateada = fecha.toLocaleDateString('it-IT');
            console.log(`   - ✅ Fecha formateada: ${fechaFormateada}`);
          } else {
            console.log(`   - ❌ Fecha inválida`);
          }
        } catch (error) {
          console.log(`   - ❌ Error formateando fecha: ${error.message}`);
        }
      } else {
        console.log(`   - ⚠️  Data es null/undefined`);
      }
      
      return {
        numero: cuota.numeroCuota || '',
        precio: cuota.prezzo?.toString() || '0',
        fecha: fechaFormateada,
        estado: cuota.isPagato ? 'Pagato' : 'Pendiente',
        statusClass: cuota.isPagato ? 'status-paid' : 'status-pending'
      };
    });

    console.log('\n4. Resultado final de cuotas mapeadas:');
    console.log(JSON.stringify(cuotasMapeadas, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCuotasFechas();
