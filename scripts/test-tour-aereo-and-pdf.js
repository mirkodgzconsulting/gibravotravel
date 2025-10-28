const { PrismaClient } = require('@prisma/client');
const { v2 as cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
  api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
});

async function testTourAereoAndPdf() {
  console.log('🧪 Probando TOUR AEREO y generación de PDFs...\n');

  try {
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa\n');

    // 1. Probar configuración de Cloudinary
    console.log('1. Probando configuración de Cloudinary...');
    try {
      const testResult = await cloudinary.api.ping();
      console.log('   ✅ Cloudinary: Conexión exitosa');
      console.log(`   📊 Status: ${testResult.status}`);
    } catch (error) {
      console.log(`   ❌ Cloudinary: Error - ${error.message}`);
    }

    // 2. Probar subida de archivo de prueba a Cloudinary
    console.log('\n2. Probando subida de archivo a Cloudinary...');
    try {
      // Crear un archivo de prueba
      const testContent = 'Test file for TOUR AEREO upload';
      const testFilePath = 'test-tour-aereo.txt';
      fs.writeFileSync(testFilePath, testContent);

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'gibravotravel/test/tour-aereo',
            resource_type: 'raw'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(Buffer.from(testContent));
      });

      console.log('   ✅ Archivo subido exitosamente');
      console.log(`   📁 URL: ${result.secure_url}`);
      
      // Limpiar archivo de prueba
      fs.unlinkSync(testFilePath);
    } catch (error) {
      console.log(`   ❌ Error subiendo archivo: ${error.message}`);
    }

    // 3. Verificar datos de Biglietteria para PDFs
    console.log('\n3. Verificando datos de Biglietteria...');
    try {
      const biglietteriaRecords = await prisma.biglietteria.findMany({
        take: 3,
        select: {
          id: true,
          pnr: true,
          passeggero: true,
          itinerario: true,
          metodoPagamento: true,
          neto: true,
          venduto: true,
          acconto: true,
          daPagare: true,
          feeAgv: true,
          createdBy: true
        }
      });

      console.log(`   📊 Registros de Biglietteria: ${biglietteriaRecords.length}`);
      
      if (biglietteriaRecords.length > 0) {
        console.log('   📋 Ejemplos:');
        biglietteriaRecords.forEach((record, index) => {
          console.log(`      ${index + 1}. PNR: ${record.pnr}, Passeggero: ${record.passeggero}`);
          console.log(`         Neto: €${record.neto}, Venduto: €${record.venduto}`);
        });
      } else {
        console.log('   ⚠️  No hay registros de Biglietteria para probar PDFs');
      }
    } catch (error) {
      console.log(`   ❌ Error verificando Biglietteria: ${error.message}`);
    }

    // 4. Verificar plantilla de recibo
    console.log('\n4. Verificando plantilla de recibo...');
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'ricevuta-template.html');
    
    if (fs.existsSync(templatePath)) {
      console.log('   ✅ Plantilla de recibo: Existe');
      
      // Verificar contenido de la plantilla
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const requiredPlaceholders = [
        '{{cliente}}', '{{passeggero}}', '{{pnr}}', '{{itinerario}}',
        '{{servizio}}', '{{metodoPagamento}}', '{{agente}}',
        '{{neto}}', '{{venduto}}', '{{acconto}}', '{{daPagare}}', '{{feeAgv}}'
      ];

      let missingPlaceholders = [];
      requiredPlaceholders.forEach(placeholder => {
        if (!templateContent.includes(placeholder)) {
          missingPlaceholders.push(placeholder);
        }
      });

      if (missingPlaceholders.length === 0) {
        console.log('   ✅ Plantilla: Todos los placeholders presentes');
      } else {
        console.log(`   ⚠️  Plantilla: Faltan placeholders: ${missingPlaceholders.join(', ')}`);
      }
    } else {
      console.log('   ❌ Plantilla de recibo: No existe');
    }

    // 5. Verificar Puppeteer
    console.log('\n5. Verificando Puppeteer...');
    try {
      const puppeteer = require('puppeteer');
      console.log('   ✅ Puppeteer: Instalado');
      
      // Probar lanzamiento de browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent('<html><body><h1>Test PDF</h1></body></html>');
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true
      });
      
      await browser.close();
      
      console.log(`   ✅ Puppeteer: PDF generado exitosamente (${pdfBuffer.length} bytes)`);
    } catch (error) {
      console.log(`   ❌ Puppeteer: Error - ${error.message}`);
    }

    // 6. Probar generación de PDF con datos reales
    console.log('\n6. Probando generación de PDF con datos reales...');
    try {
      const testRecord = await prisma.biglietteria.findFirst({
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

      if (testRecord) {
        console.log(`   📊 Usando registro de prueba: ${testRecord.pnr}`);
        
        // Simular datos para la plantilla
        const data = {
          cliente: testRecord.passeggero || 'Cliente Test',
          passeggero: testRecord.passeggero || 'Passeggero Test',
          pnr: testRecord.pnr || 'TEST123',
          itinerario: testRecord.itinerario || 'Itinerario Test',
          servizio: testRecord.servizio || 'Servizio Test',
          metodoPagamento: testRecord.metodoPagamento || 'Efectivo',
          agente: testRecord.createdBy || 'Agente Test',
          neto: testRecord.neto || 0,
          venduto: testRecord.venduto || 0,
          acconto: testRecord.acconto || 0,
          daPagare: testRecord.daPagare || 0,
          feeAgv: testRecord.feeAgv || 0
        };

        // Leer plantilla
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        let html = templateContent;

        // Reemplazar placeholders
        Object.entries(data).forEach(([key, value]) => {
          html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value || ''));
        });

        // Generar PDF
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(html);
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true
        });
        
        await browser.close();

        console.log(`   ✅ PDF generado exitosamente: ${pdfBuffer.length} bytes`);
      } else {
        console.log('   ⚠️  No hay registros de Biglietteria para probar PDF');
      }
    } catch (error) {
      console.log(`   ❌ Error generando PDF: ${error.message}`);
    }

    // 7. Verificar directorios de uploads
    console.log('\n7. Verificando directorios de uploads...');
    const uploadDirs = [
      'public/uploads',
      'public/uploads/tour-aereo',
      'public/uploads/tour_aereo',
      'public/templates'
    ];

    for (const dir of uploadDirs) {
      if (fs.existsSync(dir)) {
        console.log(`   ✅ ${dir}: Existe`);
      } else {
        console.log(`   ❌ ${dir}: No existe`);
        try {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`   ✅ ${dir}: Creado`);
        } catch (error) {
          console.log(`   ❌ ${dir}: Error creando - ${error.message}`);
        }
      }
    }

    console.log('\n✅ Pruebas completadas!');
    console.log('\n📋 RESUMEN:');
    console.log('   • Si Cloudinary falla: Verificar variables de entorno');
    console.log('   • Si Puppeteer falla: Instalar puppeteer');
    console.log('   • Si PDF falla: Verificar plantilla y datos');
    console.log('   • Si TOUR AEREO falla: Verificar configuración de Cloudinary');

  } catch (error) {
    console.error('❌ Error durante pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTourAereoAndPdf();
