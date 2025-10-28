import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';
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
    const normalizarServicios = (servicios: string[]) => {
      const serviciosNormalizados = servicios
        .map((servicio: string) => {
          // Normalizar a minúsculas para comparación
          const normalizado = servicio.toLowerCase().trim();
          // Mapear a nombres estándar
          switch (normalizado) {
            case 'biglietteria':
            case 'biglietto':
              return 'Biglietteria';
            case 'express':
              return 'Express';
            case 'polizza':
              return 'Polizza';
            case 'lettera d\'invito':
            case 'lettera invito':
              return 'Lettera d\'Invito';
            case 'hotel':
              return 'Hotel';
            default:
              return servicio; // Mantener original si no coincide
          }
        })
        .filter((servicio: string, index: number, arr: string[]) => arr.indexOf(servicio) === index); // Eliminar duplicados
      
      return serviciosNormalizados;
    };

    // Función para extraer servicios de un pasajero (evita duplicados)
    const extraerServiciosPasajero = (pasajero: any) => {
      const servicios: string[] = [];
      
      // Si el campo servizio ya contiene múltiples servicios separados por comas
      if (pasajero.servizio && pasajero.servizio.includes(',')) {
        // Usar solo el campo servizio y dividir por comas
        const serviciosDelCampo = pasajero.servizio.split(',').map((s: string) => s.trim());
        servicios.push(...serviciosDelCampo);
      } else {
        // Si el campo servizio es simple, usar campos booleanos también
        if (pasajero.servizio) servicios.push(pasajero.servizio);
        if (pasajero.tieneExpress) servicios.push('Express');
        if (pasajero.tienePolizza) servicios.push('Polizza');
        if (pasajero.tieneLetteraInvito) servicios.push('Lettera d\'Invito');
        if (pasajero.tieneHotel) servicios.push('Hotel');
      }
      
      return servicios;
    };

    // Generar lista de pasajeros dinámicamente con sus servicios
    const passeggeriList = record.pasajeros && record.pasajeros.length > 0 
      ? record.pasajeros.map((pasajero: any) => {
          const servicios = extraerServiciosPasajero(pasajero);
          const serviciosNormalizados = normalizarServicios(servicios);
          const serviciosStr = serviciosNormalizados.length > 0 ? ` (${serviciosNormalizados.join(', ')})` : '';
          return `${pasajero.nombrePasajero}${serviciosStr}`;
        }).join('\n')
      : '';

    // Generar lista de servicios adquiridos (consolidada)
    const serviciosAdquiridos = record.pasajeros && record.pasajeros.length > 0 
      ? record.pasajeros.flatMap((pasajero: any) => extraerServiciosPasajero(pasajero))
      : [];

    const serviciosNormalizados = normalizarServicios(serviciosAdquiridos);
    const servizioText = serviciosNormalizados.length > 0 
      ? serviciosNormalizados.join(', ')
      : '';

    // Generar nombre del agente
    const agenteName = record.creator 
      ? `${record.creator.firstName || ''} ${record.creator.lastName || ''}`.trim() || record.creator.email
      : record.creadoPor || '';

    // Formatear las cuotas para el recibo
    const formatearCuotas = () => {
      if (!record.cuotas || record.cuotas.length === 0) {
        return [];
      }
      
      return record.cuotas.map(cuota => {
        const fecha = cuota.data ? new Date(cuota.data).toLocaleDateString('it-IT') : 'N/A';
        const estado = cuota.isPagato ? '✓ Pagato' : 'Da pagare';
        return {
          numero: `Cuota ${cuota.numeroCuota}`,
          precio: `€${cuota.prezzo.toFixed(2)}`,
          fecha: fecha,
          estado: estado,
          statusClass: cuota.isPagato ? 'status-paid' : 'status-pending'
        };
      });
    };

    const cuotasFormateadas = formatearCuotas();

    // Preparar los datos para el recibo
    const data = {
      cliente: record.cliente || '',
      indirizzo: record.indirizzo || '',
      codicefiscale: record.codiceFiscale || '',
      fecha: record.data ? new Date(record.data).toLocaleDateString('it-IT') : '',
      date: record.data ? new Date(record.data).toLocaleDateString('it-IT') : '',
      servizio: servizioText,
      itinerario: record.itinerario || '',
      passeggero: passeggeriList,
      venduto: record.vendutoTotal ? `€${record.vendutoTotal.toFixed(2)}` : '€0.00',
      acconto: record.acconto ? `€${record.acconto.toFixed(2)}` : '€0.00',
      dapagare: record.daPagare ? `€${record.daPagare.toFixed(2)}` : '€0.00',
      cuotas: cuotasFormateadas,
      tieneCuotas: record.cuotas && record.cuotas.length > 0,
      pnr: record.pnr || '',
      agente: agenteName,
      metodoPagamento: record.metodoPagamento || '',
    };

    // Leer la plantilla HTML
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');
    
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
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true
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
      { error: 'Error generating document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

