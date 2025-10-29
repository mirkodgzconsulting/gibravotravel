const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testRicevutaSimple() {
  console.log('🧪 PROBANDO GENERACIÓN DE RECIBOS LOCAL');
  console.log('=======================================');

  try {
    // 1. Obtener registro con cuotas
    console.log('\n1. Obteniendo registro...');
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
      console.log('❌ No se encontró registro con cuotas');
      return;
    }

    console.log(`✅ Registro encontrado: ${record.cliente}`);

    // 2. Simular la lógica del API
    console.log('\n2. Generando datos...');
    const agenteName = record.creator
      ? `${record.creator.firstName || ''} ${record.creator.lastName || ''}`.trim() || record.creator.email
      : 'Usuario';

    const primerPasajero = record.pasajeros?.[0];

    const fechaActual = new Date().toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

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

      cuotas: (record.cuotas || []).map(cuota => {
        console.log(`🔍 Procesando cuota ${cuota.numeroCuota}:`);
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
      }),
      tieneCuotas: (record.cuotas?.length || 0) > 0
    };

    console.log('\n3. Datos de cuotas generados:');
    console.log(JSON.stringify(data.cuotas, null, 2));

    // 3. Leer plantilla
    console.log('\n4. Procesando plantilla...');
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Reemplazar placeholders
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

    // 4. Procesar logo
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Logo_gibravo.svg');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`;
      html = html.replace('src="logo.png"', `src="${logoBase64}"`);
    }

    // 5. Generar PDF
    console.log('\n5. Generando PDF...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '5mm',
        right: '5mm',
        bottom: '5mm',
        left: '5mm'
      },
      printBackground: true
    });

    await browser.close();

    // 6. Guardar PDF
    const fileName = `test-ricevuta-local-${Date.now()}.pdf`;
    fs.writeFileSync(fileName, pdfBuffer);
    console.log(`✅ PDF generado: ${fileName} (${pdfBuffer.length} bytes)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRicevutaSimple();
