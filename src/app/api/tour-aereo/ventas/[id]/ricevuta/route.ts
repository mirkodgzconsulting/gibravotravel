import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ventaId } = await request.json();
    const { id } = await params;

    const targetId = ventaId || id;

    if (!targetId) {
      return NextResponse.json(
        { error: 'ventaId is required' },
        { status: 400 }
      );
    }

    const venta = await prisma.ventaTourAereo.findUnique({
      where: { id: targetId },
      include: {
        tourAereo: true,
        cuotas: {
          orderBy: { numeroCuota: 'asc' }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    const agenteName = venta.creator
      ? `${venta.creator.firstName || ''} ${venta.creator.lastName || ''}`.trim() || venta.creator.email
      : 'Usuario';

    const fechaActual = new Date().toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Parse metodoPagamento to human readable string
    let metodoPagamentoFormateado = '';
    if (venta.metodoPagamento) {
      try {
        const parsed = typeof venta.metodoPagamento === 'string'
          ? JSON.parse(venta.metodoPagamento)
          : venta.metodoPagamento;

        if (Array.isArray(parsed)) {
          metodoPagamentoFormateado = parsed.join(', ');
        } else {
          metodoPagamentoFormateado = String(parsed);
        }
      } catch {
        metodoPagamentoFormateado = String(venta.metodoPagamento);
      }
    }

    const notasRicevuta = (() => {
      let nota = venta.notaEsternaRicevuta || '';
      if (!nota) return '';

      nota = nota.replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

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

      return nota.replace(/\{/g, '').replace(/\}/g, '');
    })();

    const cuotasData = (venta.cuotas || []).map(cuota => {
      let fechaFormateada = 'Sin fecha';
      if (cuota.fechaPago) {
        const fecha = new Date(cuota.fechaPago);
        if (!Number.isNaN(fecha.getTime())) {
          fechaFormateada = fecha.toLocaleDateString('it-IT');
        }
      }

      const estadoLower = (cuota.estado || '').toLowerCase();
      const isPagado = ['pagato', 'pagata', 'pagado', 'pagada', 'paid'].includes(estadoLower);
      const estadoLabel = cuota.estado || (isPagado ? 'Pagato' : 'Pendiente');

      return {
        numero: cuota.numeroCuota || '',
        precio: (cuota.monto ?? 0).toString(),
        fecha: fechaFormateada,
        fechaCuota: fechaFormateada,
        estado: estadoLabel,
        statusClass: isPagado ? 'status-paid' : 'status-pending'
      };
    });

    const data = {
      cliente: venta.pasajero || '',
      passeggero: venta.pasajero || '',
      pnr: venta.pnr || '',
      itinerario: '',
      servizio: venta.tourAereo?.titulo || 'Tour Aéreo',
      metodoPagamento: metodoPagamentoFormateado || 'N/D',
      agente: agenteName,
      pasajeros: venta.pasajero ? [{ nombre: venta.pasajero, servizio: venta.tourAereo?.titulo || '' }] : [],
      tienePasajeros: !!venta.pasajero,
      venduto: (venta.venduto ?? 0).toString(),
      acconto: (venta.acconto ?? 0).toString(),
      daPagare: (venta.daPagare ?? 0).toString(),
      fecha: fechaActual,
      date: fechaActual,
      indirizzo: venta.indirizzo || 'No especificato',
      codicefiscale: venta.codiceFiscale || 'No especificato',
      cuotas: cuotasData,
      tieneCuotas: cuotasData.length > 0,
      notaDiRicevuta: notasRicevuta,
      tieneNotaRicevuta: !!(notasRicevuta && notasRicevuta.trim() !== ''),
      isTourAereo: true,
      isBiglietteria: false,
    };

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template-v3.html');

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 500 }
      );
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    if (data.pasajeros && data.pasajeros.length > 0) {
      const nombresUnidos = Array.from(new Set(data.pasajeros.map(p => (p.nombre || '').trim().toLowerCase())))
        .map(nombreLower => {
          const pasajero = data.pasajeros?.find(p => p.nombre && p.nombre.trim().toLowerCase() === nombreLower);
          return pasajero?.nombre || '';
        })
        .filter(Boolean)
        .join(', ');

      html = html.replace(/\{\{#pasajeros\}\}([\s\S]*?)\{\{\/pasajeros\}\}/g, nombresUnidos);
      if (data.tienePasajeros) {
        html = html.replace(/<span id="passeggero-fallback">[\s\S]*?<\/span>/g, '');
        html = html.replace(/\{\{passeggero\}\}/g, '');
      }
    }

    if (data.notaDiRicevuta) {
      let notaValue = String(data.notaDiRicevuta || '')
        .replace(/\{/g, '')
        .replace(/\}/g, '');

      html = html.replace(/\{\{\{notaDiRicevuta\}\}\}/g, notaValue);
      html = html.replace(/\{\{notaDiRicevuta\}\}/g, notaValue);
    }

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'cuotas' && Array.isArray(value)) {
        html = html.replace(/\{\{#cuotas\}\}([\s\S]*?)\{\{\/cuotas\}\}/g, (match, content) => {
          if (value.length === 0) return '';
          return value.map(cuota => {
            let itemHtml = content;
            Object.entries(cuota).forEach(([cKey, cValue]) => {
              itemHtml = itemHtml.replace(new RegExp(`\{\{${cKey}\}\}`, 'g'), String(cValue));
            });
            return itemHtml;
          }).join('');
        });
      } else if (key === 'pasajeros' || key === 'notaDiRicevuta') {
        return;
      } else if (key === 'tienePasajeros') {
        if (value) {
          html = html.replace(/\{\{#tienePasajeros\}\}/g, '');
          html = html.replace(/\{\{\/tienePasajeros\}\}/g, '');
        } else {
          html = html.replace(/\{\{#tienePasajeros\}\}[\s\S]*?\{\{\/tienePasajeros\}\}/g, '');
        }
      } else if (key === 'tieneCuotas') {
        if (value) {
          html = html.replace(/\{\{#tieneCuotas\}\}/g, '');
          html = html.replace(/\{\{\/tieneCuotas\}\}/g, '');
        } else {
          html = html.replace(/\{\{#tieneCuotas\}\}[\s\S]*?\{\{\/tieneCuotas\}\}/g, '');
        }
      } else if (key === 'tieneNotaRicevuta') {
        if (value) {
          html = html.replace(/\{\{#tieneNotaRicevuta\}\}/g, '');
          html = html.replace(/\{\{\/tieneNotaRicevuta\}\}/g, '');
        } else {
          html = html.replace(/\{\{#tieneNotaRicevuta\}\}[\s\S]*?\{\{\/tieneNotaRicevuta\}\}/g, '');
        }
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
        html = html.replace(new RegExp(`\{\{${key}\}\}`, 'g'), String(value || ''));
      }
    });

    if (!data.itinerario || String(data.itinerario).trim() === '') {
      html = html.replace(/<tr>\s*<td class="label">Itinerario:<\/td>\s*<td class="value">[\s\S]*?<\/td>\s*<\/tr>/, '');
    }

    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Logo_gibravo.svg');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/svg+xml;base64,${logoBuffer.toString('base64')}`;
      html = html.replace('src="logo.png"', `src="${logoBase64}"`);
    }

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
      await page.setViewport({ width: 1200, height: 800 });
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          bottom: '0mm',
          left: '0mm',
          right: '0mm',
        }
      });

      await browser.close();

      const pdf = Buffer.from(pdfBuffer);
      return new NextResponse(pdf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Ricevuta_${venta.pasajero || 'tour_aereo'}_${Date.now()}.pdf"`
        }
      });
    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating tour aereo ricevuta:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error interno durante la generazione della ricevuta'
    }, { status: 500 });
  }
}
