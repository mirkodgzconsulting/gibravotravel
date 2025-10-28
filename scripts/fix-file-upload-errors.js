const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixFileUploadErrors() {
  console.log('🔧 Corrigiendo errores de subida de archivos y generación de PDFs...\n');

  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 1. Crear directorios necesarios
    console.log('1. Creando directorios necesarios...');
    const directories = [
      'public/uploads',
      'public/uploads/templates',
      'public/uploads/users',
      'public/uploads/tour-aereo',
      'public/uploads/tour-bus',
      'public/uploads/biglietteria',
      'public/templates'
    ];

    for (const dir of directories) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`   ✅ ${dir}: Creado`);
        } else {
          console.log(`   ✅ ${dir}: Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ ${dir}: Error - ${error.message}`);
      }
    }

    // 2. Crear archivo .gitkeep para mantener directorios
    console.log('\n2. Creando archivos .gitkeep...');
    for (const dir of directories) {
      const gitkeepPath = path.join(dir, '.gitkeep');
      try {
        if (!fs.existsSync(gitkeepPath)) {
          fs.writeFileSync(gitkeepPath, '');
          console.log(`   ✅ ${gitkeepPath}: Creado`);
        }
      } catch (error) {
        console.log(`   ❌ ${gitkeepPath}: Error - ${error.message}`);
      }
    }

    // 3. Verificar y crear plantilla de recibo si no existe
    console.log('\n3. Verificando plantilla de recibo...');
    const ricevutaTemplate = 'public/templates/ricevuta-template.html';
    if (!fs.existsSync(ricevutaTemplate)) {
      console.log('   ⚠️  Plantilla de recibo no encontrada, creando...');
      
      const templateContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ricevuta</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .info { margin-bottom: 10px; }
        .total { font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RICEVUTA</h1>
        <p>Documento generato automaticamente - Gibravo Travel</p>
    </div>
    
    <div class="info">
        <p><strong>Cliente:</strong> {{cliente}}</p>
        <p><strong>Passeggero:</strong> {{passeggero}}</p>
        <p><strong>PNR:</strong> {{pnr}}</p>
        <p><strong>Itinerario:</strong> {{itinerario}}</p>
        <p><strong>Servizio:</strong> {{servizio}}</p>
        <p><strong>Metodo di Pagamento:</strong> {{metodoPagamento}}</p>
        <p><strong>Agente:</strong> {{agente}}</p>
    </div>
    
    <div class="total">
        <p><strong>Neto:</strong> €{{neto}}</p>
        <p><strong>Venduto:</strong> €{{venduto}}</p>
        <p><strong>Acconto:</strong> €{{acconto}}</p>
        <p><strong>Da Pagare:</strong> €{{daPagare}}</p>
        <p><strong>Fee/AGV:</strong> €{{feeAgv}}</p>
    </div>
</body>
</html>`;
      
      try {
        fs.writeFileSync(ricevutaTemplate, templateContent);
        console.log(`   ✅ ${ricevutaTemplate}: Creada`);
      } catch (error) {
        console.log(`   ❌ ${ricevutaTemplate}: Error - ${error.message}`);
      }
    } else {
      console.log(`   ✅ ${ricevutaTemplate}: Existe`);
    }

    // 4. Verificar configuración de Cloudinary
    console.log('\n4. Verificando configuración de Cloudinary...');
    const cloudinaryVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY', 
      'CLOUDINARY_API_SECRET'
    ];

    let cloudinaryConfigured = true;
    cloudinaryVars.forEach(varName => {
      if (!process.env[varName]) {
        console.log(`   ❌ ${varName}: No configurado`);
        cloudinaryConfigured = false;
      } else {
        console.log(`   ✅ ${varName}: Configurado`);
      }
    });

    if (!cloudinaryConfigured) {
      console.log('   ⚠️  Cloudinary no está completamente configurado');
      console.log('   📝 Configura las siguientes variables en Vercel:');
      console.log('      • CLOUDINARY_CLOUD_NAME');
      console.log('      • CLOUDINARY_API_KEY');
      console.log('      • CLOUDINARY_API_SECRET');
    }

    // 5. Verificar Puppeteer
    console.log('\n5. Verificando Puppeteer...');
    try {
      const puppeteer = require('puppeteer');
      console.log('   ✅ Puppeteer: Instalado');
    } catch (error) {
      console.log('   ❌ Puppeteer: No instalado');
      console.log('   📝 Instala Puppeteer: npm install puppeteer');
    }

    // 6. Crear archivo de configuración para archivos
    console.log('\n6. Creando configuración de archivos...');
    const fileConfig = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      uploadPaths: {
        templates: 'public/uploads/templates',
        users: 'public/uploads/users',
        tourAereo: 'public/uploads/tour-aereo',
        tourBus: 'public/uploads/tour-bus',
        biglietteria: 'public/uploads/biglietteria'
      }
    };

    try {
      fs.writeFileSync('file-config.json', JSON.stringify(fileConfig, null, 2));
      console.log('   ✅ file-config.json: Creado');
    } catch (error) {
      console.log(`   ❌ file-config.json: Error - ${error.message}`);
    }

    // 7. Verificar permisos de escritura
    console.log('\n7. Verificando permisos de escritura...');
    const testFiles = [
      'public/uploads/test-write.txt',
      'public/templates/test-template.html'
    ];

    for (const testFile of testFiles) {
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log(`   ✅ ${testFile}: Permisos OK`);
      } catch (error) {
        console.log(`   ❌ ${testFile}: Error permisos - ${error.message}`);
      }
    }

    // 8. Verificar datos de prueba
    console.log('\n8. Verificando datos de prueba...');
    try {
      const biglietteriaCount = await prisma.biglietteria.count();
      console.log(`   📊 Registros de Biglietteria: ${biglietteriaCount}`);
      
      if (biglietteriaCount === 0) {
        console.log('   ⚠️  No hay registros de Biglietteria para probar generación de PDFs');
      }
    } catch (error) {
      console.log(`   ❌ Error verificando Biglietteria: ${error.message}`);
    }

    console.log('\n✅ Corrección de errores de archivos completada!');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('   1. Verificar que las variables de Cloudinary estén configuradas en Vercel');
    console.log('   2. Instalar Puppeteer si no está instalado');
    console.log('   3. Probar la subida de archivos en Tour Aereo');
    console.log('   4. Probar la generación de recibos en Biglietteria');

  } catch (error) {
    console.error('❌ Error durante corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFileUploadErrors();
