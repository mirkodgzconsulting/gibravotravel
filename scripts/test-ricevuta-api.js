const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testRicevutaApi() {
  console.log('🧪 PROBANDO API DE GENERACIÓN DE RECIBOS');
  console.log('========================================\n');

  try {
    // 1. Verificar entorno
    console.log('1. Verificando entorno...');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   VERCEL: ${process.env.VERCEL}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurada' : 'NO configurada'}`);

    // 2. Simular la lógica del API
    console.log('\n2. Simulando lógica del API...');
    
    // Obtener un registro de prueba
    const records = await prisma.biglietteria.findMany({
      take: 1,
      include: {
        pasajeros: true,
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (records.length === 0) {
      console.log('   ❌ No hay registros para probar');
      return;
    }

    const record = records[0];
    console.log(`   ✅ Registro encontrado: ID ${record.id}, Cliente: ${record.cliente}`);

    // 3. Verificar plantilla
    console.log('\n3. Verificando plantilla...');
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');
    
    if (!fs.existsSync(templatePath)) {
      console.log('   ❌ Plantilla no encontrada');
      return;
    }
    
    console.log('   ✅ Plantilla encontrada');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');

    // 4. Generar datos (como en el API)
    console.log('\n4. Generando datos...');
    const agenteName = record.creator 
      ? `${record.creator.firstName || ''} ${record.creator.lastName || ''}`.trim() || record.creator.email
      : 'Usuario';

    // Obtener datos del primer pasajero (como en el frontend)
    const primerPasajero = record.pasajeros?.[0];
    
    // Generar fecha actual
    const fechaActual = new Date().toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const data = {
      // Datos del cliente
      cliente: record.cliente || '',
      passeggero: primerPasajero?.nombrePasajero || '',
      pnr: record.pnr || '',
      itinerario: record.itinerario || '',
      servizio: primerPasajero?.servizio || '',
      metodoPagamento: record.metodoPagamento || '',
      agente: agenteName,
      
      // Datos financieros
      neto: primerPasajero?.netoBiglietteria?.toString() || '0',
      venduto: primerPasajero?.vendutoBiglietteria?.toString() || '0',
      acconto: record.acconto?.toString() || '0',
      daPagare: record.daPagare?.toString() || '0',
      feeAgv: record.feeAgv?.toString() || '0',
      
      // Fechas
      fecha: fechaActual,
      date: fechaActual,
      
      // Datos adicionales del cliente (placeholders)
      indirizzo: record.indirizzo || 'No especificado',
      codicefiscale: record.codicefiscale || 'No especificado',
      
      // Cuotas
      cuotas: record.cuotas || [],
      tieneCuotas: (record.cuotas?.length || 0) > 0
    };

    console.log('   ✅ Datos generados');

    // 5. Procesar plantilla
    console.log('\n5. Procesando plantilla...');
    let html = templateContent;
    
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
        html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value || ''));
      }
    });

    console.log('   ✅ Plantilla procesada');

    // 6. Procesar logo
    console.log('\n6. Procesando logo...');
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Logo_gibravo.svg');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`;
      html = html.replace('src="logo.png"', `src="${logoBase64}"`);
      console.log('   ✅ Logo procesado');
    } else {
      console.log('   ⚠️  Logo no encontrado');
    }

    // 7. Probar Puppeteer con diferentes configuraciones
    console.log('\n7. Probando Puppeteer...');
    
    const puppeteerConfigs = [
      {
        name: 'Configuración básica',
        config: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      },
      {
        name: 'Configuración para Vercel',
        config: {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: true,
        }
      }
    ];

    for (const { name, config } of puppeteerConfigs) {
      try {
        console.log(`   Probando: ${name}...`);
        const browser = await puppeteer.launch(config);
        const page = await browser.newPage();
        
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          margin: {
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
            left: '10mm'
          },
          printBackground: true
        });
        
        await browser.close();
        
        console.log(`   ✅ ${name}: PDF generado (${pdfBuffer.length} bytes)`);
        
        // Guardar PDF de prueba
        const testPdfPath = path.join(process.cwd(), `test-ricevuta-${name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
        fs.writeFileSync(testPdfPath, pdfBuffer);
        console.log(`   📄 Guardado en: ${testPdfPath}`);
        
        break; // Si funciona, no probar las demás configuraciones
        
      } catch (puppeteerError) {
        console.log(`   ❌ ${name}: ${puppeteerError.message}`);
      }
    }

    console.log('\n🎉 Prueba del API completada!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testRicevutaApi();
