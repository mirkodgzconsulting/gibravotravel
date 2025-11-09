import { Prisma, PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL no está definido. Saltando migración de Biglietteria.');
  console.log('ℹ️  Ejecuta este script con la conexión configurada para aplicar los cambios.');
  process.exit(0);
}

const prisma = new PrismaClient();

type PassengerWithParent = Prisma.PasajeroBiglietteriaGetPayload<{
  include: {
    biglietteria: {
      select: {
        id: true;
        acconto: true;
      };
    };
  };
}>;

interface ServiceDetailPayload {
  servicio: string;
  metodoDiAcquisto?: string | null;
  andata?: Date | null;
  ritorno?: Date | null;
  iata?: string | null;
  neto?: number | null;
  venduto?: number | null;
  estado?: string | null;
  fechaPago?: Date | null;
  fechaActivacion?: Date | null;
  notas?: string | null;
}

interface DynamicServicePayload {
  [key: string]: unknown;
}

interface TotalsAccumulator {
  neto: number;
  venduto: number;
  acconto: number;
}

const OPTIONAL_COLUMNS: Array<{ name: string; type: string; defaultClause?: string }> = [
  { name: 'estado', type: 'TEXT', defaultClause: "DEFAULT 'Pendiente'" },
  { name: 'fechaPago', type: 'TIMESTAMP' },
  { name: 'fechaActivacion', type: 'TIMESTAMP' },
  { name: 'notas', type: 'TEXT' },
];

async function ensurePasajeroServicioStructure() {
  const [{ exists }] = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'pasajero_servicio_biglietteria'
    ) as "exists";
  `;

  if (!exists) {
    console.log('➡️  Creando tabla pasajero_servicio_biglietteria...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "pasajero_servicio_biglietteria" (
        "id" TEXT PRIMARY KEY DEFAULT cuid(),
        "pasajeroId" TEXT NOT NULL REFERENCES "pasajeros_biglietteria"("id") ON DELETE CASCADE,
        "servicio" TEXT NOT NULL,
        "metodoDiAcquisto" TEXT,
        "andata" TIMESTAMP,
        "ritorno" TIMESTAMP,
        "iata" TEXT,
        "neto" DOUBLE PRECISION,
        "venduto" DOUBLE PRECISION,
        "estado" TEXT DEFAULT 'Pendiente',
        "fechaPago" TIMESTAMP,
        "fechaActivacion" TIMESTAMP,
        "notas" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  } else {
    console.log('ℹ️  Tabla pasajero_servicio_biglietteria existente, ajustando columnas opcionales…');
    for (const column of OPTIONAL_COLUMNS) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "pasajero_servicio_biglietteria"
        ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type} ${column.defaultClause ?? ''};
      `);
      if (column.name === 'estado') {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "pasajero_servicio_biglietteria"
          ALTER COLUMN "estado" SET DEFAULT 'Pendiente';
        `);
      }
    }
  }

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_pasajero_servicio_biglietteria_pasajero_id"
    ON "pasajero_servicio_biglietteria" ("pasajeroId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_pasajero_servicio_biglietteria_servicio"
    ON "pasajero_servicio_biglietteria" ("servicio");
  `);
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function prettifyServiceName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Servizio';
  return trimmed
    .split(/\s|_/)
    .filter(Boolean)
    .map((fragment) => fragment.charAt(0).toUpperCase() + fragment.slice(1))
    .join(' ');
}

function safeParseJSON<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return null;
  }
}

function collectDynamicServices(notes: unknown): Record<string, DynamicServicePayload> {
  if (!notes || typeof notes !== 'object') return {};
  const raw = (notes as Record<string, unknown>).serviciosDinamicos;
  if (!raw || typeof raw !== 'object') return {};
  return raw as Record<string, DynamicServicePayload>;
}

function extractNotasUsuario(notes: unknown): string | null {
  if (!notes || typeof notes !== 'object') return null;
  const value = (notes as Record<string, unknown>).notasUsuario;
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

function buildServiceDetails(pasajero: PassengerWithParent): ServiceDetailPayload[] {
  const services: ServiceDetailPayload[] = [];
  const parsedNotas = safeParseJSON<Record<string, unknown>>(pasajero.notas ?? undefined);
  const dynamicServices = collectDynamicServices(parsedNotas);
  const notasUsuario = extractNotasUsuario(parsedNotas);

  const baseEstado = pasajero.estado ?? 'Pendiente';
  const baseFechaPago = pasajero.fechaPago ? new Date(pasajero.fechaPago) : null;
  const baseFechaActivacion = pasajero.fechaActivacion ? new Date(pasajero.fechaActivacion) : null;

  const pushService = (
    serviceName: string,
    payload: Partial<ServiceDetailPayload> & { force?: boolean }
  ) => {
    const { force, ...data } = payload;
    const normalizedName = prettifyServiceName(serviceName);
    const neto = toNumber(data.neto);
    const venduto = toNumber(data.venduto);
    const andata = toDate(data.andata);
    const ritorno = toDate(data.ritorno);
    const fechaPago = toDate(data.fechaPago ?? baseFechaPago ?? undefined);
    const fechaActivacion = toDate(data.fechaActivacion ?? baseFechaActivacion ?? undefined);
    const estado = (data.estado ?? baseEstado ?? 'Pendiente').trim() || 'Pendiente';
    const notas = data.notas ?? notasUsuario ?? null;

    const hasRelevantData =
      neto !== null ||
      venduto !== null ||
      !!data.metodoDiAcquisto ||
      !!andata ||
      !!ritorno ||
      !!data.iata ||
      !!notasUsuario ||
      !!data.notas;

    if (!hasRelevantData && !force) {
      return;
    }

    services.push({
      servicio: normalizedName,
      metodoDiAcquisto: data.metodoDiAcquisto ?? null,
      andata,
      ritorno,
      iata: data.iata ?? null,
      neto,
      venduto,
      estado,
      fechaPago,
      fechaActivacion,
      notas,
    });
  };

  // Servicio principal (volo)
  const servicioPrincipal = pasajero.servizio || 'Volo';
  pushService(servicioPrincipal, {
    neto: pasajero.netoBiglietteria ?? undefined,
    venduto: pasajero.vendutoBiglietteria ?? undefined,
    iata: pasajero.iata ?? undefined,
    andata: pasajero.andata ?? undefined,
    ritorno: pasajero.ritorno ?? undefined,
    force: true,
  });

  if (pasajero.tieneExpress || pasajero.netoExpress !== null || pasajero.vendutoExpress !== null) {
    pushService('Express', {
      neto: pasajero.netoExpress ?? undefined,
      venduto: pasajero.vendutoExpress ?? undefined,
    });
  }

  if (pasajero.tienePolizza || pasajero.netoPolizza !== null || pasajero.vendutoPolizza !== null) {
    pushService('Polizza', {
      neto: pasajero.netoPolizza ?? undefined,
      venduto: pasajero.vendutoPolizza ?? undefined,
    });
  }

  if (pasajero.tieneLetteraInvito || pasajero.netoLetteraInvito !== null || pasajero.vendutoLetteraInvito !== null) {
    pushService('Lettera Invito', {
      neto: pasajero.netoLetteraInvito ?? undefined,
      venduto: pasajero.vendutoLetteraInvito ?? undefined,
    });
  }

  if (pasajero.tieneHotel || pasajero.netoHotel !== null || pasajero.vendutoHotel !== null) {
    pushService('Hotel', {
      neto: pasajero.netoHotel ?? undefined,
      venduto: pasajero.vendutoHotel ?? undefined,
    });
  }

  Object.entries(dynamicServices).forEach(([rawName, rawData]) => {
    const data = rawData as Record<string, unknown>;
    const neto = toNumber(data.neto);
    const venduto = toNumber(data.venduto);
    const andata = toDate(data.andata);
    const ritorno = toDate(data.ritorno);
    const fechaPago = toDate(data.fechaPago);
    const fechaActivacion = toDate(data.fechaActivacion);
    const notasServicio =
      typeof data.notas === 'string' && data.notas.trim() ? data.notas.trim() : notasUsuario;

    pushService(rawName, {
      neto,
      venduto,
      metodoDiAcquisto:
        typeof data.metodoDiAcquisto === 'string' ? data.metodoDiAcquisto : undefined,
      andata,
      ritorno,
      iata: typeof data.iata === 'string' ? data.iata : undefined,
      estado: typeof data.estado === 'string' ? data.estado : undefined,
      fechaPago,
      fechaActivacion,
      notas: notasServicio ?? undefined,
    });
  });

  return services;
}

async function migratePasajeros() {
  const existingCount = await prisma.pasajeroServicioBiglietteria.count();
  if (existingCount > 0 && process.env.FORCE_REIMPORT !== '1') {
    console.error(
      `❌ La tabla pasajero_servicio_biglietteria ya contiene ${existingCount} registros. ` +
        'Establece FORCE_REIMPORT=1 si deseas limpiar e importar de nuevo.'
    );
    process.exit(1);
  }

  if (existingCount > 0 && process.env.FORCE_REIMPORT === '1') {
    console.warn('⚠️  Eliminando registros existentes de pasajero_servicio_biglietteria...');
    await prisma.$executeRawUnsafe('DELETE FROM "pasajero_servicio_biglietteria";');
  }

  const pasajeros = await prisma.pasajeroBiglietteria.findMany({
    include: {
      biglietteria: {
        select: {
          id: true,
          acconto: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`➡️  Migrando ${pasajeros.length} pasajeros a la tabla detallada de servicios…`);

  const totalsByBiglietteria = new Map<string, TotalsAccumulator>();
  let totalServicesCreated = 0;

  for (const pasajero of pasajeros) {
    const services = buildServiceDetails(pasajero);
    if (services.length === 0) {
      continue;
    }

    await prisma.pasajeroServicioBiglietteria.createMany({
      data: services.map((service) => ({
        pasajeroId: pasajero.id,
        servicio: service.servicio,
        metodoDiAcquisto: service.metodoDiAcquisto ?? null,
        andata: service.andata ?? null,
        ritorno: service.ritorno ?? null,
        iata: service.iata ?? null,
        neto: service.neto ?? null,
        venduto: service.venduto ?? null,
        estado: service.estado ?? 'Pendiente',
        fechaPago: service.fechaPago ?? null,
        fechaActivacion: service.fechaActivacion ?? null,
        notas: service.notas ?? null,
      })),
    });

    totalServicesCreated += services.length;

    const biglietteriaId = pasajero.biglietteriaId;
    if (!totalsByBiglietteria.has(biglietteriaId)) {
      totalsByBiglietteria.set(biglietteriaId, {
        neto: 0,
        venduto: 0,
        acconto: pasajero.biglietteria?.acconto ?? 0,
      });
    }
    const accumulator = totalsByBiglietteria.get(biglietteriaId)!;
    services.forEach((service) => {
      accumulator.neto += service.neto ?? 0;
      accumulator.venduto += service.venduto ?? 0;
    });
  }

  console.log(`✅  Se generaron ${totalServicesCreated} servicios individuales.`);

  console.log('➡️  Actualizando totales en tabla biglietteria…');
  for (const [biglietteriaId, totals] of totalsByBiglietteria.entries()) {
    const neto = Number(totals.neto.toFixed(2));
    const venduto = Number(totals.venduto.toFixed(2));
    const acconto = Number((totals.acconto ?? 0).toFixed(2));
    const daPagare = Math.max(Number((venduto - acconto).toFixed(2)), 0);

    await prisma.biglietteria.update({
      where: { id: biglietteriaId },
      data: {
        netoPrincipal: neto,
        vendutoTotal: venduto,
        daPagare,
      },
    });
  }

  console.log('✅  Totales de biglietteria actualizados.');
}

async function main() {
  console.log('🚀 Iniciando migración Biglietteria → servicios individuales…');
  await ensurePasajeroServicioStructure();
  await migratePasajeros();
  console.log('🎉 Migración completada.');
}

main()
  .catch((error) => {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
