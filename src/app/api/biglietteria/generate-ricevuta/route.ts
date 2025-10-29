import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  console.log('🔍 [RICEVUTA API] Iniciando generación de recibo...');
  
  try {
    const { recordId } = await request.json();
    console.log(`🔍 [RICEVUTA API] Record ID: ${recordId}`);

    if (!recordId) {
      console.log('❌ [RICEVUTA API] Record ID is required');
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Obtener el registro de la base de datos con todos los pasajeros y cuotas
    console.log('🔍 [RICEVUTA API] Obteniendo registro de la base de datos...');
    const record = await prisma.biglietteria.findUnique({
      where: { id: recordId },
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

    if (!record) {
      console.log('❌ [RICEVUTA API] Record not found');
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [RICEVUTA API] Registro encontrado: ${record.cliente}`);

    // Función para normalizar servicios (eliminar duplicados y estandarizar)
    const normalizeServizi = (servizi: string[]): string[] => {
      if (!Array.isArray(servizi)) return [];
      
      const uniqueServizi = [...new Set(servizi)];
      return uniqueServizi.filter(s => s && s.trim() !== '');
    };

    // Generar datos para la plantilla
    console.log('🔍 [RICEVUTA API] Generando datos para la plantilla...');
    const agenteName = record.creator 
      ? `${record.creator.firstName || ''} ${record.creator.lastName || ''}`.trim() || record.creator.email
      : 'Usuario';

    // Obtener datos del primer pasajero (como en el frontend)
    const primerPasajero = record.pasajeros?.[0];
    
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
      feeAgv: record.feeAgv?.toString() || '0',
      cuotas: record.cuotas || [],
      tieneCuotas: (record.cuotas?.length || 0) > 0
    };

    console.log('✅ [RICEVUTA API] Datos generados');

    // Leer la plantilla HTML
    console.log('🔍 [RICEVUTA API] Leyendo plantilla...');
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');
    console.log(`🔍 [RICEVUTA API] Ruta de plantilla: ${templatePath}`);
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ [RICEVUTA API] Template file not found');
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 500 }
      );
    }

    let html = fs.readFileSync(templatePath, 'utf-8');
    console.log(`✅ [RICEVUTA API] Plantilla leída (${html.length} caracteres)`);

    // Reemplazar placeholders con datos
    console.log('🔍 [RICEVUTA API] Reemplazando placeholders...');
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'cuotas' && Array.isArray(value)) {
        // Manejar arrays de cuotas con loop de Handlebars-like
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
        // Manejar condicional {{#tieneCuotas}}
        html = html.replace(/\{\{#tieneCuotas\}\}/g, '');
        html = html.replace(/\{\{\/tieneCuotas\}\}/g, '');
      } else if (key === 'tieneCuotas' && !value) {
        // Remover contenido si no hay cuotas
        html = html.replace(/\{\{#tieneCuotas\}\}[\s\S]*?\{\{\/tieneCuotas\}\}/g, '');
      } else {
        html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value || ''));
      }
    });

    console.log('✅ [RICEVUTA API] Placeholders reemplazados');

    // Convertir logo a base64
    console.log('🔍 [RICEVUTA API] Procesando logo...');
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Logo_gibravo.svg');
    console.log(`🔍 [RICEVUTA API] Ruta de logo: ${logoPath}`);
    
    let logoBase64 = '';
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`;
      html = html.replace('src="logo.png"', `src="${logoBase64}"`);
      console.log('✅ [RICEVUTA API] Logo procesado');
    } else {
      console.log('⚠️ [RICEVUTA API] Logo no encontrado');
    }

    // Generar PDF con Puppeteer
    console.log('🔍 [RICEVUTA API] Iniciando Puppeteer...');
    
    // Configuración optimizada para Vercel
    const puppeteerConfig = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    };

    console.log('🔍 [RICEVUTA API] Configuración de Puppeteer:', puppeteerConfig);
    
    const browser = await puppeteer.launch(puppeteerConfig);
    console.log('✅ [RICEVUTA API] Browser lanzado');
    
    const page = await browser.newPage();
    console.log('✅ [RICEVUTA API] Página creada');
    
    // Configurar viewport
    await page.setViewport({ width: 1200, height: 800 });
    
    // Establecer contenido HTML
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    console.log('✅ [RICEVUTA API] Contenido establecido');
    
    // Generar PDF
    console.log('🔍 [RICEVUTA API] Generando PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      timeout: 30000
    });
    console.log(`✅ [RICEVUTA API] PDF generado (${pdfBuffer.length} bytes)`);
    
    await browser.close();
    console.log('✅ [RICEVUTA API] Browser cerrado');

    // Crear el nombre del archivo
    const fileName = `Ricevuta_${record.cliente.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    console.log(`✅ [RICEVUTA API] Nombre de archivo: ${fileName}`);

    // Retornar el documento como respuesta
    console.log('✅ [RICEVUTA API] Enviando respuesta');
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('❌ [RICEVUTA API] Error generating ricevuta:', error);
    console.error('❌ [RICEVUTA API] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ [RICEVUTA API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Error generating document', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}