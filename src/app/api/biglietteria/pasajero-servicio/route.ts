import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const formatDateToISO = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString();
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const searchTerm = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const offset = (page - 1) * pageSize;
    const servicioFilter = searchParams.get('servicio');
    const estadoFilter = searchParams.get('estado');
    const fechaDesde = parseDate(searchParams.get('fechaDesde'));
    const fechaHasta = parseDate(searchParams.get('fechaHasta'));
    const fechaActivacionDesde = parseDate(searchParams.get('fechaActivacionDesde'));
    const fechaActivacionHasta = parseDate(searchParams.get('fechaActivacionHasta'));
    const fechaPagoDesde = parseDate(searchParams.get('fechaPagoDesde'));
    const fechaPagoHasta = parseDate(searchParams.get('fechaPagoHasta'));

    const biglietteriaFilter: Prisma.BiglietteriaWhereInput = {
      isActive: true,
    };

    const pasajeroFilter: Prisma.PasajeroBiglietteriaWhereInput = {
      biglietteria: {
        is: biglietteriaFilter,
      },
    };

    const whereConditions: Prisma.PasajeroServicioBiglietteriaWhereInput = {
      pasajero: {
        is: pasajeroFilter,
      },
    };

    if (servicioFilter) {
      whereConditions.servicio = {
        contains: servicioFilter,
        mode: 'insensitive',
      };
    }

    if (estadoFilter) {
      whereConditions.estado = {
        equals: estadoFilter,
      };
    }

    if (searchTerm) {
      whereConditions.OR = [
        { pasajero: { nombrePasajero: { contains: searchTerm, mode: 'insensitive' } } },
        { pasajero: { biglietteria: { cliente: { contains: searchTerm, mode: 'insensitive' } } } },
        { pasajero: { biglietteria: { pnr: { contains: searchTerm, mode: 'insensitive' } } } },
        { pasajero: { biglietteria: { itinerario: { contains: searchTerm, mode: 'insensitive' } } } },
        { servicio: { contains: searchTerm, mode: 'insensitive' } },
        { iata: { contains: searchTerm, mode: 'insensitive' } },
        { metodoDiAcquisto: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (fechaDesde || fechaHasta) {
      biglietteriaFilter.createdAt = {
        ...(fechaDesde ? { gte: fechaDesde } : {}),
        ...(fechaHasta ? { lte: fechaHasta } : {}),
      };
    }

    if (fechaActivacionDesde || fechaActivacionHasta) {
      whereConditions.fechaActivacion = {
        ...(fechaActivacionDesde ? { gte: fechaActivacionDesde } : {}),
        ...(fechaActivacionHasta ? { lte: fechaActivacionHasta } : {}),
      };
    }

    if (fechaPagoDesde || fechaPagoHasta) {
      whereConditions.fechaPago = {
        ...(fechaPagoDesde ? { gte: fechaPagoDesde } : {}),
        ...(fechaPagoHasta ? { lte: fechaPagoHasta } : {}),
      };
    }

    const [count, detalles] = await Promise.all([
      prisma.pasajeroServicioBiglietteria.count({
        where: whereConditions,
      }),
      prisma.pasajeroServicioBiglietteria.findMany({
        where: whereConditions,
        include: {
          pasajero: {
            select: {
              id: true,
              nombrePasajero: true,
              andata: true,
              ritorno: true,
              estado: true,
              fechaPago: true,
              fechaActivacion: true,
              notas: true,
              biglietteria: {
                select: {
                  id: true,
                  data: true,
                  cliente: true,
                  pnr: true,
                  itinerario: true,
                  pagamento: true,
                  metodoPagamento: true,
                  createdAt: true,
                  creator: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { pasajero: { biglietteria: { createdAt: 'desc' } } },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: pageSize,
      }),
    ]);

    const data = detalles.map((detalle) => {
      const { pasajero } = detalle;
      const { biglietteria } = pasajero;

      return {
        id: detalle.id,
        pasajeroServicioId: detalle.id,
        pasajeroId: pasajero.id,
        biglietteriaId: biglietteria.id,
        cliente: biglietteria.cliente,
        pasajero: pasajero.nombrePasajero,
        servicio: detalle.servicio,
        metodoDiAcquisto: detalle.metodoDiAcquisto,
        andata: (() => {
          const servicioLower = (detalle.servicio || '').toLowerCase();
          const isVolo = servicioLower.includes('volo') || servicioLower.includes('biglietteria');
          if (detalle.andata) return formatDateToISO(detalle.andata);
          if (isVolo) return formatDateToISO(pasajero.andata);
          return null;
        })(),
        ritorno: (() => {
          const servicioLower = (detalle.servicio || '').toLowerCase();
          const isVolo = servicioLower.includes('volo') || servicioLower.includes('biglietteria');
          if (detalle.ritorno) return formatDateToISO(detalle.ritorno);
          if (isVolo) return formatDateToISO(pasajero.ritorno);
          return null;
        })(),
        dataRegistro: formatDateToISO(biglietteria.data),
        iata: detalle.iata,
        neto: detalle.neto,
        venduto: detalle.venduto,
        estado: (() => {
          if (detalle.estado) return detalle.estado;
          const servicioLower = (detalle.servicio || '').toLowerCase();
          const isVolo = servicioLower.includes('volo') || servicioLower.includes('biglietteria');
          if (isVolo && pasajero.estado) return pasajero.estado;
          return 'Pendiente';
        })(),
        fechaPago: (() => {
          if (detalle.fechaPago) return formatDateToISO(detalle.fechaPago);
          const servicioLower = (detalle.servicio || '').toLowerCase();
          const isVolo = servicioLower.includes('volo') || servicioLower.includes('biglietteria');
          if (isVolo) return formatDateToISO(pasajero.fechaPago);
          return null;
        })(),
        fechaActivacion: (() => {
          if (detalle.fechaActivacion) return formatDateToISO(detalle.fechaActivacion);
          const servicioLower = (detalle.servicio || '').toLowerCase();
          const isVolo = servicioLower.includes('volo') || servicioLower.includes('biglietteria');
          if (isVolo) return formatDateToISO(pasajero.fechaActivacion);
          return null;
        })(),
        notas: (() => {
          if (detalle.notas !== undefined && detalle.notas !== null) return detalle.notas;
          const servicioLower = (detalle.servicio || '').toLowerCase();
          const isVolo = servicioLower.includes('volo') || servicioLower.includes('biglietteria');
          if (isVolo) return pasajero.notas ?? null;
          return null;
        })(),
        pnr: biglietteria.pnr,
        itinerario: biglietteria.itinerario,
        pagamento: biglietteria.pagamento,
        metodoPag: (() => {
          try {
            const metodo = JSON.parse(biglietteria.metodoPagamento || '[]');
            return Array.isArray(metodo) ? metodo.join(', ') : biglietteria.metodoPagamento;
          } catch {
            return biglietteria.metodoPagamento;
          }
        })(),
        creador: biglietteria.creator
          ? `${biglietteria.creator.firstName || ''} ${biglietteria.creator.lastName || ''}`.trim() ||
          biglietteria.creator.email
          : biglietteria.id,
      };
    });

    return NextResponse.json({
      page,
      pageSize,
      total: count,
      data,
    });
  } catch (error) {
    console.error('Error fetching detalles pasajero-servicio:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

