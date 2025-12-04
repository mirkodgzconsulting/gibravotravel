import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteerCore from 'puppeteer-core';
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

    // Preparar array de pasajeros para el template - eliminar duplicados
    const nombresUnicos = new Set<string>();
    const pasajerosData = todosPasajeros
      .map(pasajero => ({
        nombre: pasajero.nombrePasajero || '',
        servizio: pasajero.servizio || ''
      }))
      .filter(p => {
        // Filtrar duplicados por nombre (case-insensitive)
        const nombreLower = p.nombre.toLowerCase().trim();
        if (nombresUnicos.has(nombreLower)) {
          return false;
        }
        nombresUnicos.add(nombreLower);
        return true;
      });

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

    // Formatear método de pago correctamente
    let metodoPagamentoFormateado = '';
    if (record.metodoPagamento) {
      try {
        // Intentar parsear si es JSON string
        const metodoParsed = typeof record.metodoPagamento === 'string' 
          ? JSON.parse(record.metodoPagamento) 
          : record.metodoPagamento;
        
        // Si es un array, unir con comas
        if (Array.isArray(metodoParsed)) {
          metodoPagamentoFormateado = metodoParsed.join(', ');
        } else {
          metodoPagamentoFormateado = String(metodoParsed);
        }
      } catch {
        // Si no es JSON, usar como string
        metodoPagamentoFormateado = String(record.metodoPagamento);
      }
    }

    const data = {
      // Datos del cliente
      cliente: record.cliente || '',
      passeggero: nombresPasajeros || primerPasajero?.nombrePasajero || '',
      pnr: record.pnr || '',
      itinerario: record.itinerario || '',
      servizio: servizioCombinado || primerPasajero?.servizio || '',
      metodoPagamento: metodoPagamentoFormateado,
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
          const fecha = new Date(cuota.data);
          if (!Number.isNaN(fecha.getTime())) {
            fechaFormateada = fecha.toLocaleDateString('it-IT');
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
      
      // Note di ricevuta - limpiar llaves HTML si están presentes
      notaDiRicevuta: (() => {
        let nota = record.notaDiRicevuta || '';
        if (nota) {
          // Método robusto: eliminar todas las llaves { } del contenido
          // Primero decodificar entidades HTML si existen
          nota = nota.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
          
          // Remover llaves al inicio y final
          nota = nota.trim();
          
          // Remover llaves consecutivas al inicio (puede estar en texto o HTML)
          while (nota.startsWith('{') || nota.match(/^<[^>]*>\s*\{/)) {
            if (nota.startsWith('{')) {
              nota = nota.substring(1).trim();
            } else {
              const match = nota.match(/^(<[^>]*>)\s*\{/);
              if (match) {
                nota = nota.substring(match[0].length).trim();
              } else {
                break;
              }
            }
          }
          
          // Remover llaves consecutivas al final
          while (nota.endsWith('}') || nota.match(/\}\s*<\/[^>]*>$/)) {
            if (nota.endsWith('}')) {
              nota = nota.substring(0, nota.length - 1).trim();
            } else {
              const match = nota.match(/\}\s*(<\/[^>]*>)$/);
              if (match) {
                nota = nota.substring(0, nota.length - match[0].length).trim();
              } else {
                break;
              }
            }
          }
          
          // Eliminar TODAS las llaves restantes en cualquier parte del contenido
          // Esto garantiza que no queden llaves en ningún lugar
          nota = nota.replace(/\{/g, '').replace(/\}/g, '');
        }
        return nota;
      })(),
      tieneNotaRicevuta: !!(record.notaDiRicevuta && record.notaDiRicevuta.trim() !== ''),
      isTourAereo: false,
      isBiglietteria: true,
    };

    // Leer la plantilla HTML
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template-v3.html');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 500 }
      );
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Reemplazar placeholders con datos
    // IMPORTANTE: Procesar en orden específico para evitar conflictos
    // 1. Primero procesar arrays (cuotas, pasajeros)
    // 2. Luego procesar condicionales
    // 3. Finalmente procesar campos simples
    
    // Procesar pasajeros PRIMERO para evitar duplicados
    if (data.pasajeros && Array.isArray(data.pasajeros) && data.pasajeros.length > 0) {
      const pasajerosArray = data.pasajeros.filter((p): p is { nombre: string; servizio: string } => 
        typeof p === 'object' && p !== null && 'nombre' in p
      );
      const nombresUnicosSet = new Set<string>();
      const nombresUnicos = pasajerosArray
        .map(p => p.nombre || '')
        .filter(n => {
          const nombreLower = n.trim().toLowerCase();
          if (nombreLower && !nombresUnicosSet.has(nombreLower)) {
            nombresUnicosSet.add(nombreLower);
            return true;
          }
          return false;
        });
      const nombresUnidos = nombresUnicos.join(', ');
      
      // Reemplazar el bloque {{#pasajeros}}...{{/pasajeros}} con los nombres unidos
      html = html.replace(/\{\{#pasajeros\}\}([\s\S]*?)\{\{\/pasajeros\}\}/g, nombresUnidos);
      
      // Ocultar el fallback {{passeggero}} si hay pasajeros
      if (data.tienePasajeros) {
        html = html.replace(/<span id="passeggero-fallback">[\s\S]*?<\/span>/g, '');
        // También reemplazar directamente el placeholder {{passeggero}} si existe
        html = html.replace(/\{\{passeggero\}\}/g, '');
      }
    }
    
    // Procesar notaDiRicevuta con limpieza de llaves ANTES del loop
    if (data.notaDiRicevuta) {
      let notaValue = String(data.notaDiRicevuta || '');
      // Limpieza agresiva de llaves - eliminar TODAS las llaves
      notaValue = notaValue.replace(/\{/g, '').replace(/\}/g, '');
      // Reemplazar tanto triple {{{notaDiRicevuta}}} como doble {{notaDiRicevuta}}
      html = html.replace(/\{\{\{notaDiRicevuta\}\}\}/g, notaValue);
      html = html.replace(/\{\{notaDiRicevuta\}\}/g, notaValue);
    }
    
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
      } else if (key === 'pasajeros') {
        // Ya procesado arriba, saltar
        return;
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
      } else if (key === 'notaDiRicevuta') {
        // Ya procesado arriba, saltar
        return;
      } else if (key === 'isTourAereo') {
        if (value) {
          html = html.replace(/\{\{#isTourAereo\}\}/g, '');
          html = html.replace(/\{\{\/isTourAereo\}\}/g, '');
          // Ocultar bloque de BIGLIETTERIA
          html = html.replace(/\{\{#isBiglietteria\}\}[\s\S]*?\{\{\/isBiglietteria\}\}/g, '');
        } else {
          html = html.replace(/\{\{#isTourAereo\}\}[\s\S]*?\{\{\/isTourAereo\}\}/g, '');
        }
      } else if (key === 'isBiglietteria') {
        if (value) {
          html = html.replace(/\{\{#isBiglietteria\}\}/g, '');
          html = html.replace(/\{\{\/isBiglietteria\}\}/g, '');
          // Ocultar bloque de TOUR AEREO
          html = html.replace(/\{\{#isTourAereo\}\}[\s\S]*?\{\{\/isTourAereo\}\}/g, '');
        } else {
          html = html.replace(/\{\{#isBiglietteria\}\}[\s\S]*?\{\{\/isBiglietteria\}\}/g, '');
        }
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

    // Generar PDF con Puppeteer (local y producción)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    let browser: import('puppeteer-core').Browser | null = null;

    try {
      if (isProduction) {
        const executablePath = await chromium.executablePath();
        if (!executablePath) {
          throw new Error('Chromium executable path not found in production environment');
        }

        browser = await puppeteerCore.launch({
          args: chromium.args,
          executablePath,
          headless: true,
        });
      } else {
        const { default: puppeteer } = await import('puppeteer');
        const executablePath = process.env.CHROME_EXECUTABLE_PATH || undefined;

        browser = await puppeteer.launch({
          headless: true,
          executablePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
          ],
        }) as unknown as import('puppeteer-core').Browser;
      }

      if (!browser) {
        throw new Error('Unable to launch browser instance for PDF generation');
      }

      const page = await browser.newPage();

      // Configurar viewport
      await page.setViewport({ width: 1200, height: 800 });

      // Establecer contenido HTML
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        printBackground: true,
        timeout: 30000,
      });

      // Crear el nombre del archivo
      const fileName = `Ricevuta_${record.cliente.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;

      // Retornar el documento como respuesta
      const pdfArray = new Uint8Array(pdfBuffer);

      return new NextResponse(pdfArray, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });

    } finally {
      if (browser) {
        try {
          await browser.close();
          browser = null;
        } catch (closeError) {
          console.error('Error closing browser after ricevuta generation:', closeError);
        }
      }
    }

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