import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  console.log('🧪 [TEST RICEVUTA] ===== INICIANDO PRUEBA SIMPLE =====');
  
  try {
    // 1. Verificar entorno
    console.log('🔍 [TEST RICEVUTA] Verificando entorno...');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   VERCEL:', process.env.VERCEL);
    console.log('   process.cwd():', process.cwd());

    // 2. Verificar base de datos
    console.log('🔍 [TEST RICEVUTA] Verificando base de datos...');
    const recordCount = await prisma.biglietteria.count();
    console.log('   Registros en biglietteria:', recordCount);

    // 3. Verificar plantilla
    console.log('🔍 [TEST RICEVUTA] Verificando plantilla...');
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');
    console.log('   Ruta de plantilla:', templatePath);
    console.log('   Existe:', fs.existsSync(templatePath));
    
    if (fs.existsSync(templatePath)) {
      const content = fs.readFileSync(templatePath, 'utf-8');
      console.log('   Tamaño:', content.length, 'caracteres');
    }

    // 4. Verificar logo
    console.log('🔍 [TEST RICEVUTA] Verificando logo...');
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Logo_gibravo.svg');
    console.log('   Ruta de logo:', logoPath);
    console.log('   Existe:', fs.existsSync(logoPath));

    // 5. Verificar Puppeteer
    console.log('🔍 [TEST RICEVUTA] Verificando Puppeteer...');
    try {
      const puppeteer = require('puppeteer');
      console.log('   Puppeteer disponible:', !!puppeteer);
    } catch (puppeteerError) {
      console.log('   Error con Puppeteer:', puppeteerError.message);
    }

    // 6. Obtener un registro de prueba
    console.log('🔍 [TEST RICEVUTA] Obteniendo registro de prueba...');
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
      console.log('   Registro encontrado:', testRecord.id);
      console.log('   Cliente:', testRecord.cliente);
      console.log('   Pasajeros:', testRecord.pasajeros?.length || 0);
    } else {
      console.log('   No hay registros de prueba');
    }

    console.log('✅ [TEST RICEVUTA] Prueba completada exitosamente');

    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        cwd: process.cwd()
      },
      database: {
        recordCount
      },
      files: {
        template: {
          path: templatePath,
          exists: fs.existsSync(templatePath),
          size: fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf-8').length : 0
        },
        logo: {
          path: logoPath,
          exists: fs.existsSync(logoPath),
          size: fs.existsSync(logoPath) ? fs.readFileSync(logoPath).length : 0
        }
      },
      testRecord: testRecord ? {
        id: testRecord.id,
        cliente: testRecord.cliente,
        pasajeros: testRecord.pasajeros?.length || 0,
        cuotas: testRecord.cuotas?.length || 0
      } : null
    });

  } catch (error) {
    console.error('❌ [TEST RICEVUTA] Error durante la prueba:', error);
    console.error('❌ [TEST RICEVUTA] Stack trace:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
