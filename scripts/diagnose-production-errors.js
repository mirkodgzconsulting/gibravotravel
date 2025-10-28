const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function diagnoseProductionErrors() {
  console.log('🔍 Diagnosticando errores específicos de producción...\n');

  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 1. Verificar configuración de Cloudinary
    console.log('1. Verificando configuración de Cloudinary...');
    const cloudinaryConfig = {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'Configurado' : 'No configurado',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Configurado' : 'No configurado',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Configurado' : 'No configurado'
    };
    
    console.log('📊 Variables de Cloudinary:');
    Object.entries(cloudinaryConfig).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });

    // 2. Verificar configuración de Puppeteer (para generación de PDFs)
    console.log('\n2. Verificando configuración de Puppeteer...');
    try {
      const puppeteer = require('puppeteer');
      console.log('   ✅ Puppeteer instalado');
    } catch (error) {
      console.log('   ❌ Puppeteer no instalado:', error.message);
    }

    // 3. Verificar directorios de uploads
    console.log('\n3. Verificando directorios de uploads...');
    const uploadDirs = [
      'public/uploads',
      'public/uploads/templates',
      'public/uploads/users'
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

    // 4. Verificar datos de Biglietteria (para generación de recibos)
    console.log('\n4. Verificando datos de Biglietteria...');
    try {
      const biglietteria = await prisma.biglietteria.findMany({
        take: 3,
        select: {
          id: true,
          pnr: true,
          passeggero: true,
          itinerario: true,
          metodoPagamento: true,
          createdBy: true
        }
      });
      
      console.log(`   📊 Registros de Biglietteria: ${biglietteria.length}`);
      if (biglietteria.length > 0) {
        console.log('   📋 Ejemplos:');
        biglietteria.forEach((record, index) => {
          console.log(`      ${index + 1}. PNR: ${record.pnr}, Passeggero: ${record.passeggero}`);
        });
      } else {
        console.log('   ⚠️  No hay registros de Biglietteria para generar recibos');
      }
    } catch (error) {
      console.log(`   ❌ Error verificando Biglietteria: ${error.message}`);
    }

    // 5. Verificar datos de TourAereo (para subida de archivos)
    console.log('\n5. Verificando datos de TourAereo...');
    try {
      const tourAereo = await prisma.tourAereo.findMany({
        take: 3,
        select: {
          id: true,
          titulo: true,
          coverImage: true,
          pdfFile: true,
          createdBy: true
        }
      });
      
      console.log(`   📊 Registros de TourAereo: ${tourAereo.length}`);
      if (tourAereo.length > 0) {
        console.log('   📋 Ejemplos:');
        tourAereo.forEach((tour, index) => {
          console.log(`      ${index + 1}. Título: ${tour.titulo}`);
          console.log(`         Cover Image: ${tour.coverImage ? 'Sí' : 'No'}`);
          console.log(`         PDF File: ${tour.pdfFile ? 'Sí' : 'No'}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error verificando TourAereo: ${error.message}`);
    }

    // 6. Verificar permisos de archivos
    console.log('\n6. Verificando permisos de archivos...');
    try {
      const testFile = 'public/uploads/test-permissions.txt';
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('   ✅ Permisos de escritura: OK');
    } catch (error) {
      console.log(`   ❌ Permisos de escritura: Error - ${error.message}`);
    }

    // 7. Verificar configuración de Next.js
    console.log('\n7. Verificando configuración de Next.js...');
    try {
      const nextConfig = require('./next.config.ts');
      console.log('   ✅ next.config.ts: Cargado');
      
      if (nextConfig.images && nextConfig.images.remotePatterns) {
        console.log('   ✅ Configuración de imágenes: OK');
        console.log(`      Patrones remotos: ${nextConfig.images.remotePatterns.length}`);
      } else {
        console.log('   ⚠️  Configuración de imágenes: No encontrada');
      }
    } catch (error) {
      console.log(`   ❌ Error cargando next.config.ts: ${error.message}`);
    }

    // 8. Verificar variables de entorno críticas
    console.log('\n8. Verificando variables de entorno críticas...');
    const criticalEnvVars = [
      'DATABASE_URL',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    criticalEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`   ✅ ${varName}: Configurado`);
      } else {
        console.log(`   ❌ ${varName}: No configurado`);
      }
    });

    console.log('\n📋 RESUMEN DE DIAGNÓSTICO:');
    console.log('   🔧 Para "Error generating document":');
    console.log('      • Verificar configuración de Puppeteer');
    console.log('      • Verificar datos de Biglietteria');
    console.log('      • Verificar permisos de archivos');
    console.log('   📁 Para "Error de conexión" en archivos:');
    console.log('      • Verificar configuración de Cloudinary');
    console.log('      • Verificar directorios de uploads');
    console.log('      • Verificar permisos de escritura');

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseProductionErrors();
