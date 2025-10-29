const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const prisma = new PrismaClient();

async function diagnoseRicevutaProduction() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE GENERACIÓN DE RECIBOS EN PRODUCCIÓN');
  console.log('================================================================\n');

  try {
    // 1. Verificar entorno
    console.log('1. Verificando entorno...');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   VERCEL: ${process.env.VERCEL}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Configurada' : 'NO configurada'}`);

    // 2. Verificar plantilla
    console.log('\n2. Verificando plantilla de recibo...');
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');
    console.log(`   Ruta: ${templatePath}`);
    console.log(`   Existe: ${fs.existsSync(templatePath)}`);
    
    if (fs.existsSync(templatePath)) {
      const content = fs.readFileSync(templatePath, 'utf-8');
      console.log(`   Tamaño: ${content.length} caracteres`);
      
      // Verificar placeholders
      const requiredPlaceholders = [
        '{{cliente}}', '{{passeggero}}', '{{pnr}}', '{{itinerario}}',
        '{{servizio}}', '{{metodoPagamento}}', '{{agente}}',
        '{{neto}}', '{{venduto}}', '{{acconto}}', '{{daPagare}}', '{{feeAgv}}'
      ];

      let missingPlaceholders = [];
      requiredPlaceholders.forEach(placeholder => {
        if (!content.includes(placeholder)) {
          missingPlaceholders.push(placeholder);
        }
      });

      if (missingPlaceholders.length === 0) {
        console.log('   ✅ Todos los placeholders presentes');
      } else {
        console.log(`   ❌ Faltan placeholders: ${missingPlaceholders.join(', ')}`);
      }
    } else {
      console.log('   ❌ Plantilla NO encontrada');
    }

    // 3. Verificar logo
    console.log('\n3. Verificando logo...');
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Logo_gibravo.svg');
    console.log(`   Ruta: ${logoPath}`);
    console.log(`   Existe: ${fs.existsSync(logoPath)}`);
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      console.log(`   Tamaño: ${logoBuffer.length} bytes`);
    }

    // 4. Verificar Puppeteer
    console.log('\n4. Verificando Puppeteer...');
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('   ✅ Puppeteer funciona correctamente');
      await browser.close();
    } catch (puppeteerError) {
      console.log(`   ❌ Error con Puppeteer: ${puppeteerError.message}`);
    }

    // 5. Verificar base de datos
    console.log('\n5. Verificando base de datos...');
    try {
      const recordCount = await prisma.biglietteria.count();
      console.log(`   ✅ Conexión a BD: OK`);
      console.log(`   Registros en biglietteria: ${recordCount}`);
      
      if (recordCount > 0) {
        const sampleRecord = await prisma.biglietteria.findFirst({
          include: {
            pasajeros: true,
            cuotas: true,
            creator: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });
        
        console.log(`   Registro de muestra: ID ${sampleRecord.id}, Cliente: ${sampleRecord.cliente}`);
      }
    } catch (dbError) {
      console.log(`   ❌ Error de BD: ${dbError.message}`);
    }

    // 6. Probar generación completa
    console.log('\n6. Probando generación completa...');
    try {
      const records = await prisma.biglietteria.findMany({
        take: 1,
        include: {
          pasajeros: true,
          cuotas: true,
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
        console.log('   ⚠️  No hay registros para probar');
      } else {
        const record = records[0];
        console.log(`   Probando con registro: ${record.id}`);
        
        // Simular la lógica del API
        const agenteName = record.creator 
          ? `${record.creator.firstName || ''} ${record.creator.lastName || ''}`.trim() || record.creator.email
          : 'Usuario';

        const data = {
          cliente: record.cliente || '',
          passeggero: record.pasajeros?.[0]?.nombre || '',
          pnr: record.pnr || '',
          itinerario: record.itinerario || '',
          servizio: record.servizio || '',
          metodoPagamento: record.metodoPagamento || '',
          agente: agenteName,
          neto: record.neto?.toString() || '0',
          venduto: record.venduto?.toString() || '0',
          acconto: record.acconto?.toString() || '0',
          daPagare: record.daPagare?.toString() || '0',
          feeAgv: record.feeAgv?.toString() || '0',
          cuotas: record.cuotas || [],
          tieneCuotas: (record.cuotas?.length || 0) > 0
        };

        console.log('   ✅ Datos generados correctamente');

        // Probar reemplazo de placeholders
        if (fs.existsSync(templatePath)) {
          let html = fs.readFileSync(templatePath, 'utf-8');
          
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

          // Probar conversión de logo
          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`;
            html = html.replace('src="logo.png"', `src="${logoBase64}"`);
          }

          // Probar generación de PDF
          try {
            const browser = await puppeteer.launch({
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
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

            console.log(`   ✅ PDF generado exitosamente: ${pdfBuffer.length} bytes`);
            
            // Guardar PDF de prueba
            const testPdfPath = path.join(process.cwd(), 'test-ricevuta-production.pdf');
            fs.writeFileSync(testPdfPath, pdfBuffer);
            console.log(`   ✅ PDF de prueba guardado en: ${testPdfPath}`);
            
          } catch (pdfError) {
            console.log(`   ❌ Error generando PDF: ${pdfError.message}`);
          }
        }
      }
    } catch (testError) {
      console.log(`   ❌ Error en prueba: ${testError.message}`);
    }

    console.log('\n🎉 Diagnóstico completado!');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseRicevutaProduction();
