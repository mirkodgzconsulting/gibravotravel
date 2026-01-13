import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import {
  buildPasajeroCreateInput,
  CuotaFormPayload,
  isPlainObject,
  normalizeCuota,
  parseDateOrNull,
  parseUploadResult,
  PasajeroFormPayload,
  toIntegerOrNull,
  toNumberOrNull,
  toNullableString,
} from '@/lib/biglietteria/parsers';

const pasajeroServiciosInclude = Prisma.validator<Prisma.PasajeroBiglietteriaInclude>()({
  serviciosDetalle: true
});

// Configurar Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userOnly = searchParams.get('userOnly') === 'true';
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const userIdParam = searchParams.get('userId'); // Para dashboard-viajes

    const whereCondition: Prisma.BiglietteriaWhereInput = { isActive: true };

    if (fechaDesde && fechaHasta) {
      whereCondition.data = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta)
      };
    }

    // Si viene userIdParam, usar ese para filtrar por user.id directamente
    if (userIdParam) {
      // userIdParam es el user.id (UUID/CUID), no clerkId
      whereCondition.creadoPor = userIdParam;
    } else if (userOnly) {
      // Para userOnly, necesitamos obtener el user.id del usuario actual
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true }
      });

      if (user) {
        whereCondition.creadoPor = user.id;
      }
    }

    const records = await prisma.biglietteria.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        pasajeros: {
          include: {
            serviciosDetalle: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const res = NextResponse.json({ records });
    // Cache privada y corta para acelerar navegación de ida y vuelta
    res.headers.set('Cache-Control', 'private, max-age=15, must-revalidate');
    return res;
  } catch (error) {
    console.error('Error fetching biglietteria records:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, firstName: true, lastName: true }
    });

    const createdBy = user ? user.id : 'Usuario';

    const formData = await request.formData();

    const getStringField = (key: string): string | null => {
      const value = formData.get(key);
      return typeof value === 'string' ? value : null;
    };

    const cliente = getStringField('cliente') ?? '';
    const codiceFiscale = getStringField('codiceFiscale') ?? '';
    const indirizzo = getStringField('indirizzo') ?? '';
    const email = getStringField('email') ?? '';
    const numeroTelefono = getStringField('numeroTelefono') ?? '';
    const pagamento = getStringField('pagamento') ?? '';
    const dataValue = getStringField('data');
    const pnr = getStringField('pnr');
    const itinerario = getStringField('itinerario') ?? '';
    const metodoPagamentoJson = getStringField('metodoPagamento');
    const notaDiVendita = getStringField('notaDiVendita');
    const notaDiRicevuta = getStringField('notaDiRicevuta');
    const numeroPasajerosRaw = formData.get('numeroPasajeros');
    const numeroCuotasRaw = formData.get('numeroCuotas');
    const accontoRaw = formData.get('acconto');
    const cuotasJson = getStringField('cuotas');
    const pasajerosJson = getStringField('pasajeros');

    const numeroPasajeros = toIntegerOrNull(numeroPasajerosRaw) ?? 1;
    const numeroCuotas = toIntegerOrNull(numeroCuotasRaw) ?? 0;

    const parseJsonArray = (value: string | null): unknown[] => {
      if (!value) {
        return [];
      }
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing JSON array:', error);
        return [];
      }
    };

    const pasajerosRaw = parseJsonArray(pasajerosJson);
    const pasajerosForm = pasajerosRaw
      .filter(isPlainObject)
      .map((pasajero) => pasajero as PasajeroFormPayload);

    const pasajerosConstruidos = pasajerosForm.map(buildPasajeroCreateInput);
    const pasajerosParaCrear = pasajerosConstruidos.map((item) => item.createInput);

    const netoPrincipal = pasajerosConstruidos.reduce(
      (acc, item) => acc + item.netoContribution,
      0
    );
    const vendutoTotal = pasajerosConstruidos.reduce(
      (acc, item) => acc + item.vendutoContribution,
      0
    );

    const accontoValue = toNumberOrNull(accontoRaw) ?? 0;
    const daPagare = vendutoTotal - accontoValue;
    const feeAgv = vendutoTotal - netoPrincipal;
    const fechaProcesada = parseDateOrNull(dataValue) ?? new Date();

    const metodoPagamento = (() => {
      if (!metodoPagamentoJson) {
        return '';
      }
      try {
        const parsed = JSON.parse(metodoPagamentoJson) as unknown;
        if (Array.isArray(parsed)) {
          const valores = parsed
            .map((valor) => toNullableString(valor))
            .filter((valor): valor is string => Boolean(valor));
          return valores.length > 0 ? JSON.stringify(valores) : '';
        }
      } catch {
        // ignorar y usar el valor original
      }
      return metodoPagamentoJson;
    })();

    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;
    let attachedFileUrl: string | null = null;
    let attachedFileName: string | null = null;

    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension ?? '');
        const resourceType = isImage ? 'image' : 'raw';

        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'gibravotravel/biglietteria',
                resource_type: resourceType,
              },
              parseUploadResult(resolve, reject)
            )
            .end(buffer);
        });

        attachedFileUrl = result.secure_url;
        attachedFileName = file.name;
      } catch (error) {
        console.error('Error uploading main file:', error);
      }
    }

    const cuotasRaw = parseJsonArray(cuotasJson)
      .filter(isPlainObject)
      .map((cuota) => cuota as CuotaFormPayload);

    const cuotasConArchivos: Prisma.CuotaCreateWithoutBiglietteriaInput[] = [];
    if (numeroCuotas > 0 && cuotasRaw.length > 0) {
      for (let i = 0; i < cuotasRaw.length; i += 1) {
        const cuotaPayload = cuotasRaw[i];
        const normalizedCuota = normalizeCuota(cuotaPayload, i + 1);

        const cuotaFileEntry = formData.get(`cuotaFile${i}`);
        const cuotaFile = cuotaFileEntry instanceof File ? cuotaFileEntry : null;
        let cuotaFileUrl = normalizedCuota.attachedFile;
        let cuotaFileName = normalizedCuota.attachedFileName;

        if (cuotaFile && cuotaFile.size > 0) {
          try {
            const bytes = await cuotaFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileExtension = cuotaFile.name.toLowerCase().split('.').pop();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension ?? '');
            const resourceType = isImage ? 'image' : 'raw';

            const result = await new Promise<UploadApiResponse>((resolve, reject) => {
              cloudinary.uploader
                .upload_stream(
                  {
                    folder: 'gibravotravel/biglietteria/cuotas',
                    resource_type: resourceType,
                  },
                  parseUploadResult(resolve, reject)
                )
                .end(buffer);
            });

            cuotaFileUrl = result.secure_url;
            cuotaFileName = cuotaFile.name;
          } catch (error) {
            console.error(`Error uploading cuota file ${i}:`, error);
          }
        }

        cuotasConArchivos.push({
          numeroCuota: normalizedCuota.numeroCuota,
          data: normalizedCuota.data,
          prezzo: normalizedCuota.prezzo,
          note: normalizedCuota.note,
          isPagato: normalizedCuota.isPagato,
          attachedFile: cuotaFileUrl,
          attachedFileName: cuotaFileName,
        });
      }
    }

    const record = await prisma.biglietteria.create({
      data: {
        cliente,
        codiceFiscale,
        indirizzo,
        email,
        numeroTelefono,
        pagamento,
        data: fechaProcesada,
        pnr,
        itinerario,
        metodoPagamento,
        notaDiVendita: toNullableString(notaDiVendita),
        notaDiRicevuta: toNullableString(notaDiRicevuta),
        numeroPasajeros,
        netoPrincipal,
        vendutoTotal,
        acconto: accontoValue,
        daPagare,
        feeAgv,
        creadoPor: createdBy,
        isActive: true,
        attachedFile: attachedFileUrl,
        attachedFileName: attachedFileName,
        numeroCuotas: numeroCuotas > 0 ? numeroCuotas : null,
        pasajeros: {
          create: pasajerosParaCrear,
        },
        cuotas:
          cuotasConArchivos.length > 0
            ? {
              create: cuotasConArchivos,
            }
            : undefined,
      },
      include: {
        cuotas: true,
        pasajeros: {
          include: pasajeroServiciosInclude,
        },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating biglietteria record:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Error desconocido'
            : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}