import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { ventaId } = await request.json();

    if (!ventaId) {
      return NextResponse.json(
        { error: 'Venta ID is required' },
        { status: 400 }
      );
    }

    // Obtener la venta con todos los datos relacionados
    const venta = await prisma.ventaTourBus.findUnique({
      where: { id: ventaId },
      include: {
        acompanantes: true,
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
        },
        tourBus: {
          select: {
            titulo: true,
            fechaViaje: true
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json(
        { error: 'Venta not found' },
        { status: 404 }
      );
    }

    // Generar datos para la plantilla
    const agenteName = venta.creator 
      ? `${venta.creator.firstName || ''} ${venta.creator.lastName || ''}`.trim() || venta.creator.email
      : 'Usuario';

    // Generar fecha actual
    const fechaActual = new Date().toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Preparar array de pasajeros (cliente principal + acompañantes)
    const pasajerosData = [
      {
        nombre: venta.clienteNombre,
        fermata: venta.fermata,
        asiento: venta.numeroAsiento.toString()
      },
      ...venta.acompanantes.map(acomp => ({
        nombre: acomp.nombreCompleto,
        fermata: acomp.fermata,
        asiento: acomp.numeroAsiento.toString()
      }))
    ];

    // Combinar todas las fermate únicas
    const fermateUnicas = [...new Set([
      venta.fermata,
      ...venta.acompanantes.map(a => a.fermata)
    ])].join(', ');

    // Formatear método de pago
    let metodoPagamentoFormateado = venta.metodoPagamento || '';
    if (metodoPagamentoFormateado) {
      try {
        const metodoParsed = typeof venta.metodoPagamento === 'string' 
          ? JSON.parse(venta.metodoPagamento) 
          : venta.metodoPagamento;
        
        if (Array.isArray(metodoParsed)) {
          metodoPagamentoFormateado = metodoParsed.join(', ');
        } else {
          metodoPagamentoFormateado = String(metodoParsed);
        }
      } catch {
        metodoPagamentoFormateado = String(venta.metodoPagamento);
      }
    }

    // Formatear fecha de viaje si existe
    let fechaViajeFormateada = '';
    if (venta.tourBus?.fechaViaje) {
      fechaViajeFormateada = new Date(venta.tourBus.fechaViaje).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Preparar información de mascotas e infantes
    const infoMascotas = venta.tieneMascotas && venta.numeroMascotas 
      ? `Mascotas: ${venta.numeroMascotas}` 
      : '';
    const infoInfantes = venta.tieneInfantes && venta.numeroInfantes 
      ? `Infantes: ${venta.numeroInfantes}` 
      : '';
    const infoAdicional = [infoMascotas, infoInfantes].filter(Boolean).join(', ');

    const data = {
      // Datos del cliente
      cliente: venta.clienteNombre || '',
      codicefiscale: venta.codiceFiscale || 'No especificado',
      indirizzo: venta.indirizzo || 'No especificado',
      email: venta.email || '',
      telefono: venta.numeroTelefono || '',
      
      // Datos del tour
      servizio: venta.tourBus?.titulo || 'Tour Bus',
      itinerario: venta.tourBus?.titulo || 'Tour Bus',
      fermata: fermateUnicas,
      fechaViaje: fechaViajeFormateada,
      infoAdicional: infoAdicional,
      
      // Pasajeros
      pasajeros: pasajerosData,
      tienePasajeros: pasajerosData.length > 0,
      passeggero: venta.clienteNombre || '',
      
      // Agente
      agente: agenteName,
      
      // Datos financieros
      venduto: venta.totalAPagar?.toString() || '0',
      acconto: venta.acconto?.toString() || '0',
      daPagare: venta.daPagare?.toString() || '0',
      dapagare: venta.daPagare?.toString() || '0', // Para compatibilidad
      metodoPagamento: metodoPagamentoFormateado,
      
      // Fechas
      fecha: fechaActual,
      date: fechaActual,
      
      // Cuotas
      cuotas: (venta.cuotas || []).map(cuota => {
        let fechaFormateada = 'Sin fecha';
        if (cuota.fechaPago) {
          const fecha = new Date(cuota.fechaPago);
          if (!Number.isNaN(fecha.getTime())) {
            fechaFormateada = fecha.toLocaleDateString('it-IT');
          }
        }
        
        return {
          numero: cuota.numeroCuota || '',
          precio: cuota.precioPagar?.toString() || '0',
          fecha: fechaFormateada,
          fechaCuota: fechaFormateada,
          estado: cuota.isPagado ? 'Pagato' : 'Pendiente',
          statusClass: cuota.isPagado ? 'status-paid' : 'status-pending'
        };
      }),
      tieneCuotas: (venta.cuotas?.length || 0) > 0,
      
      // Nota di ricevuta
      notaDiRicevuta: (() => {
        let nota = venta.notaEsternaRicevuta || '';
        if (nota) {
          // Limpiar llaves HTML si están presentes
          nota = nota.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
          nota = nota.trim();
          
          // Remover llaves consecutivas al inicio
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
          
          // Eliminar todas las llaves restantes
          nota = nota.replace(/\{/g, '').replace(/\}/g, '');
        }
        return nota;
      })(),
      tieneNotaRicevuta: !!(venta.notaEsternaRicevuta && venta.notaEsternaRicevuta.trim() !== '')
    };

    // Leer la plantilla HTML
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template-tour-bus.html');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 500 }
      );
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    // Procesar pasajeros PRIMERO
    if (data.pasajeros && Array.isArray(data.pasajeros) && data.pasajeros.length > 0) {
      const nombresUnicosSet = new Set<string>();
      const nombresUnicos = pasajerosData
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
      
      // Reemplazar el bloque {{#pasajeros}}...{{/pasajeros}}
      html = html.replace(/\{\{#pasajeros\}\}([\s\S]*?)\{\{\/pasajeros\}\}/g, nombresUnidos);
      
      // Ocultar el fallback {{passeggero}} si hay pasajeros
      if (data.tienePasajeros) {
        html = html.replace(/<span id="passeggero-fallback">[\s\S]*?<\/span>/g, '');
        html = html.replace(/\{\{passeggero\}\}/g, '');
      }
    }
    
    // Procesar notaDiRicevuta
    if (data.notaDiRicevuta) {
      let notaValue = String(data.notaDiRicevuta || '');
      notaValue = notaValue.replace(/\{/g, '').replace(/\}/g, '');
      html = html.replace(/\{\{\{notaDiRicevuta\}\}\}/g, notaValue);
      html = html.replace(/\{\{notaDiRicevuta\}\}/g, notaValue);
    }
    
    // Procesar otros campos
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'cuotas' && Array.isArray(value)) {
        // Manejar arrays de cuotas
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
        // Ya procesado arriba
        return;
      } else if (key === 'tienePasajeros' && value) {
        html = html.replace(/\{\{#tienePasajeros\}\}/g, '');
        html = html.replace(/\{\{\/tienePasajeros\}\}/g, '');
        html = html.replace(/<span id="passeggero-fallback">[\s\S]*?<\/span>/g, '');
      } else if (key === 'tienePasajeros' && !value) {
        html = html.replace(/\{\{#tienePasajeros\}\}[\s\S]*?\{\{\/tienePasajeros\}\}/g, '');
      } else if (key === 'tieneCuotas' && value) {
        html = html.replace(/\{\{#tieneCuotas\}\}/g, '');
        html = html.replace(/\{\{\/tieneCuotas\}\}/g, '');
      } else if (key === 'tieneCuotas' && !value) {
        html = html.replace(/\{\{#tieneCuotas\}\}[\s\S]*?\{\{\/tieneCuotas\}\}/g, '');
      } else if (key === 'tieneNotaRicevuta' && value) {
        html = html.replace(/\{\{#tieneNotaRicevuta\}\}/g, '');
        html = html.replace(/\{\{\/tieneNotaRicevuta\}\}/g, '');
      } else if (key === 'tieneNotaRicevuta' && !value) {
        html = html.replace(/\{\{#tieneNotaRicevuta\}\}[\s\S]*?\{\{\/tieneNotaRicevuta\}\}/g, '');
      } else if (key === 'notaDiRicevuta') {
        // Ya procesado arriba
        return;
      } else if (key === 'fechaViaje' && value) {
        // Procesar fechaViaje condicional
        html = html.replace(/\{\{#fechaViaje\}\}/g, '');
        html = html.replace(/\{\{\/fechaViaje\}\}/g, '');
        html = html.replace(/\{\{fechaViaje\}\}/g, String(value));
      } else if (key === 'fechaViaje' && !value) {
        // Ocultar sección si no hay fecha de viaje
        html = html.replace(/\{\{#fechaViaje\}\}[\s\S]*?\{\{\/fechaViaje\}\}/g, '');
      } else if (key === 'infoAdicional' && value) {
        // Procesar infoAdicional condicional
        html = html.replace(/\{\{#infoAdicional\}\}/g, '');
        html = html.replace(/\{\{\/infoAdicional\}\}/g, '');
        html = html.replace(/\{\{infoAdicional\}\}/g, String(value));
      } else if (key === 'infoAdicional' && !value) {
        // Ocultar sección si no hay info adicional
        html = html.replace(/\{\{#infoAdicional\}\}[\s\S]*?\{\{\/infoAdicional\}\}/g, '');
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
      const fileName = `Ricevuta_TourBus_${venta.clienteNombre.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;

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

