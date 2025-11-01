import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { recordId } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Obtener el registro de la base de datos con todos los pasajeros y cuotas
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
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    // Función para normalizar servicios (eliminar duplicados y estandarizar)
    const normalizeServizi = (servizi: string[]): string[] => {
      if (!Array.isArray(servizi)) return [];
      
      const uniqueServizi = [...new Set(servizi)];
      return uniqueServizi.filter(s => s && s.trim() !== '');
    };

    // Generar datos para la plantilla
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
      venduto: (primerPasajero?.vendutoBiglietteria || record.vendutoTotal || 0).toString(),
      acconto: record.acconto?.toString() || '0',
      daPagare: record.daPagare?.toString() || '0',
      dapagare: record.daPagare?.toString() || '0', // Para compatibilidad con plantilla
      feeAgv: record.feeAgv?.toString() || '0',
      
      // Fechas
      fecha: fechaActual,
      date: fechaActual,
      
      // Datos adicionales del cliente (placeholders)
      indirizzo: record.indirizzo || 'No especificado',
      codicefiscale: record.codiceFiscale || 'No especificado',
      
      // Cuotas - mapear campos correctamente
      cuotas: (record.cuotas || []).map(cuota => {
        let fechaFormateada = 'Sin fecha';
        if (cuota.data) {
          try {
            const fecha = new Date(cuota.data);
            if (!isNaN(fecha.getTime())) {
              fechaFormateada = fecha.toLocaleDateString('it-IT');
            }
          } catch (error) {
            // Error silencioso - usar fecha por defecto
          }
        }
        
        return {
          numero: cuota.numeroCuota || '',
          precio: cuota.prezzo?.toString() || '0',
          fecha: fechaFormateada,
          fechaCuota: fechaFormateada, // Para evitar conflicto con fecha actual
          estado: cuota.isPagato ? 'Pagato' : 'Pendiente',
          statusClass: cuota.isPagato ? 'status-paid' : 'status-pending'
        };
      }),
      tieneCuotas: (record.cuotas?.length || 0) > 0
    };

    // Leer la plantilla HTML
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template-v2.html');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 500 }
      );
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Reemplazar placeholders con datos
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

    // Convertir logo a base64
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Logo_gibravo.svg');
    
    let logoBase64 = '';
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`;
      html = html.replace('src="logo.png"', `src="${logoBase64}"`);
    }

    // Generar PDF con Puppeteer
    // Configuración optimizada para Vercel con Chrome incluido
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    const puppeteerConfig = isProduction ? {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    } : {
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
    
    const browser = await puppeteer.launch(puppeteerConfig);
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({ width: 1200, height: 800 });
    
    // Establecer contenido HTML
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Generar PDF
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
    
    await browser.close();

    // Crear el nombre del archivo
    const fileName = `Ricevuta_${record.cliente.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;

    // Retornar el documento como respuesta
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error generating ricevuta:', error);
    
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