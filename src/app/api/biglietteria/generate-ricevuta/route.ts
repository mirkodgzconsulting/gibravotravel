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

    // Obtener todos los pasajeros
    const todosPasajeros = record.pasajeros || [];
    const primerPasajero = todosPasajeros[0];
    
    // Generar fecha actual
    const fechaActual = new Date().toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Preparar array de pasajeros para el template
    const pasajerosData = todosPasajeros.map(pasajero => ({
      nombre: pasajero.nombrePasajero || '',
      servizio: pasajero.servizio || ''
    }));

    // Combinar todos los servicios únicos de todos los pasajeros
    // Extraer todos los servicios de todos los pasajeros
    const serviciosExtraidos = todosPasajeros
      .map(p => p.servizio || '')
      .filter(s => s && s.trim() !== '')
      .flatMap(s => {
        // Dividir por comas y limpiar cada servicio
        return s.split(',')
          .map(serv => serv.trim())
          .filter(serv => serv && serv.length > 0);
      });
    
    // Eliminar duplicados manteniendo el orden (case-insensitive pero preservando el formato original)
    const serviciosUnicos: string[] = [];
    const serviciosVistos = new Set<string>();
    
    serviciosExtraidos.forEach(servicio => {
      // Normalizar para comparación (sin espacios extras, lowercase)
      const servicioNormalizado = servicio.toLowerCase().trim();
      
      // Si no lo hemos visto antes, agregarlo
      if (!serviciosVistos.has(servicioNormalizado)) {
        serviciosUnicos.push(servicio); // Mantener formato original
        serviciosVistos.add(servicioNormalizado);
      }
    });
    
    const servizioCombinado = serviciosUnicos.join(', ');

    // Combinar todos los nombres de pasajeros
    const nombresPasajeros = todosPasajeros
      .map(p => p.nombrePasajero)
      .filter(n => n && n.trim() !== '')
      .join(', ');

    const data = {
      // Datos del cliente
      cliente: record.cliente || '',
      passeggero: nombresPasajeros || primerPasajero?.nombrePasajero || '',
      pnr: record.pnr || '',
      itinerario: record.itinerario || '',
      servizio: servizioCombinado || primerPasajero?.servizio || '',
      metodoPagamento: record.metodoPagamento || '',
      agente: agenteName,
      
      // Array de pasajeros para iterar en el template
      pasajeros: pasajerosData,
      tienePasajeros: pasajerosData.length > 0,
      
      // Datos financieros
      neto: primerPasajero?.netoBiglietteria?.toString() || '0',
      venduto: record.vendutoTotal?.toString() || '0',
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
      tieneCuotas: (record.cuotas?.length || 0) > 0,
      
      // Note di ricevuta
      notaDiRicevuta: record.notaDiRicevuta || '',
      tieneNotaRicevuta: !!(record.notaDiRicevuta && record.notaDiRicevuta.trim() !== '')
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
      } else if (key === 'pasajeros' && Array.isArray(value)) {
        // Manejar arrays de pasajeros con loop de Handlebars-like
        html = html.replace(/\{\{#pasajeros\}\}([\s\S]*?)\{\{\/pasajeros\}\}/g, (match, content) => {
          if (value.length === 0) return '';
          return value.map(pasajero => {
            let itemHtml = content;
            Object.entries(pasajero).forEach(([pKey, pValue]) => {
              itemHtml = itemHtml.replace(new RegExp(`\\{\\{${pKey}\\}\\}`, 'g'), String(pValue));
            });
            return itemHtml;
          }).join('');
        });
      } else if (key === 'tienePasajeros' && value) {
        // Manejar condicional {{#tienePasajeros}} - dejar el contenido visible y ocultar fallback
        html = html.replace(/\{\{#tienePasajeros\}\}/g, '');
        html = html.replace(/\{\{\/tienePasajeros\}\}/g, '');
        // Ocultar el fallback si hay pasajeros
        html = html.replace(/<span id="passeggero-fallback">[\s\S]*?<\/span>/g, '');
      } else if (key === 'tienePasajeros' && !value) {
        // Remover contenido si no hay pasajeros - el fallback se mostrará
        html = html.replace(/\{\{#tienePasajeros\}\}[\s\S]*?\{\{\/tienePasajeros\}\}/g, '');
      } else if (key === 'tieneCuotas' && value) {
        // Manejar condicional {{#tieneCuotas}}
        html = html.replace(/\{\{#tieneCuotas\}\}/g, '');
        html = html.replace(/\{\{\/tieneCuotas\}\}/g, '');
      } else if (key === 'tieneCuotas' && !value) {
        // Remover contenido si no hay cuotas
        html = html.replace(/\{\{#tieneCuotas\}\}[\s\S]*?\{\{\/tieneCuotas\}\}/g, '');
      } else if (key === 'tieneNotaRicevuta' && value) {
        // Manejar condicional {{#tieneNotaRicevuta}}
        html = html.replace(/\{\{#tieneNotaRicevuta\}\}/g, '');
        html = html.replace(/\{\{\/tieneNotaRicevuta\}\}/g, '');
      } else if (key === 'tieneNotaRicevuta' && !value) {
        // Remover contenido si no hay nota di ricevuta
        html = html.replace(/\{\{#tieneNotaRicevuta\}\}[\s\S]*?\{\{\/tieneNotaRicevuta\}\}/g, '');
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