const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testApiProductionSimulation() {
  console.log('🧪 SIMULANDO API DE PRODUCCIÓN EXACTO');
  console.log('=====================================');

  try {
    const recordId = 'cmh6i0x7r0004v1fk7kthucpb';
    
    console.log(`\n1. Obteniendo registro ID: ${recordId}`);
    const record = await prisma.biglietteria.findUnique({
      where: { id: recordId },
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
      console.log('❌ Registro no encontrado');
      return;
    }

    console.log(`✅ Registro encontrado: ${record.cliente}`);
    console.log(`📊 Cuotas: ${record.cuotas.length}`);

    // 2. Simular EXACTAMENTE la lógica del API
    console.log('\n2. Simulando lógica EXACTA del API...');
    
    const agenteName = record.creator
      ? `${record.creator.firstName || ''} ${record.creator.lastName || ''}`.trim() || record.creator.email
      : 'Usuario';

    const primerPasajero = record.pasajeros?.[0];

    const fechaActual = new Date().toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log('🔍 Datos del registro:');
    console.log(`   - Cliente: ${record.cliente}`);
    console.log(`   - Pasajeros: ${record.pasajeros?.length || 0}`);
    console.log(`   - Cuotas: ${record.cuotas?.length || 0}`);
    console.log(`   - Fecha actual: ${fechaActual}`);

    // 3. Mapear cuotas EXACTAMENTE como en el API
    console.log('\n3. Mapeando cuotas (lógica exacta del API)...');
    const cuotasMapeadas = (record.cuotas || []).map(cuota => {
      console.log(`\n   🔍 Procesando cuota ${cuota.numeroCuota}:`);
      console.log(`   - Data original: ${cuota.data}`);
      console.log(`   - Data type: ${typeof cuota.data}`);
      
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
        fechaCuota: fechaFormateada, // Para evitar conflicto con fecha actual
        estado: cuota.isPagato ? 'Pagato' : 'Pendiente',
        statusClass: cuota.isPagato ? 'status-paid' : 'status-pending'
      };
    });

    console.log('\n4. Cuotas mapeadas:');
    console.log(JSON.stringify(cuotasMapeadas, null, 2));

    // 4. Generar datos completos como en el API
    const data = {
      cliente: record.cliente || '',
      passeggero: primerPasajero?.nombrePasajero || '',
      pnr: record.pnr || '',
      itinerario: record.itinerario || '',
      servizio: primerPasajero?.servizio || '',
      metodoPagamento: record.metodoPagamento || '',
      agente: agenteName,

      neto: primerPasajero?.netoBiglietteria?.toString() || '0',
      venduto: primerPasajero?.vendutoBiglietteria?.toString() || '0',
      acconto: record.acconto?.toString() || '0',
      daPagare: record.daPagare?.toString() || '0',
      dapagare: record.daPagare?.toString() || '0',
      feeAgv: record.feeAgv?.toString() || '0',

      fecha: fechaActual,
      date: fechaActual,

      indirizzo: record.indirizzo || 'No especificado',
      codicefiscale: record.codiceFiscale || 'No especificado',

      cuotas: cuotasMapeadas,
      tieneCuotas: (record.cuotas?.length || 0) > 0
    };

    console.log('\n5. Datos completos generados:');
    console.log('Cuotas en data:', JSON.stringify(data.cuotas, null, 2));

    // 5. Procesar plantilla
    console.log('\n6. Procesando plantilla...');
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Reemplazar placeholders EXACTAMENTE como en el API
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'cuotas' && Array.isArray(value)) {
        html = html.replace(/\{\{#cuotas\}\}([\s\S]*?)\{\{\/cuotas\}\}/g, (match, content) => {
          if (value.length === 0) return '';
          return value.map(cuota => {
            let itemHtml = content;
            Object.entries(cuota).forEach(([cKey, cValue]) => {
              itemHtml = itemHtml.replace(new RegExp(`\\{\\{${cKey}\\}\\}`, 'g'), String(cValue));
            });
            return itemHtml;
          }).join('');
        });
      } else if (key === 'tieneCuotas' && value) {
        html = html.replace(/\{\{#tieneCuotas\}\}/g, '');
        html = html.replace(/\{\{\/tieneCuotas\}\}/g, '');
      } else if (key === 'tieneCuotas' && !value) {
        html = html.replace(/\{\{#tieneCuotas\}\}[\s\S]*?\{\{\/tieneCuotas\}\}/g, '');
      } else {
        html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      }
    });

    // 6. Verificar que las fechas estén en el HTML
    console.log('\n7. Verificando HTML generado...');
    const cuotasMatch = html.match(/\{\{#cuotas\}\}([\s\S]*?)\{\{\/cuotas\}\}/);
    if (cuotasMatch) {
      console.log('❌ Las cuotas no se reemplazaron correctamente');
      console.log('HTML de cuotas:', cuotasMatch[0]);
    } else {
      console.log('✅ Las cuotas se reemplazaron correctamente');
      
      // Buscar las fechas en el HTML
      const fechaMatches = html.match(/<span[^>]*>(\d{1,2}\/\d{1,2}\/\d{4})<\/span>/g);
      if (fechaMatches) {
        console.log('📅 Fechas encontradas en HTML:', fechaMatches);
      } else {
        console.log('❌ No se encontraron fechas en el HTML');
      }
    }

    // 7. Guardar HTML para inspección
    fs.writeFileSync('debug-html.html', html);
    console.log('\n8. HTML guardado como: debug-html.html');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiProductionSimulation();
