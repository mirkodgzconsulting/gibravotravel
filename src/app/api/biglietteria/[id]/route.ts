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
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
  api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
});

// GET - Obtener un registro específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const record = await prisma.biglietteria.findUnique({
      where: { id },
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        pasajeros: {
          include: pasajeroServiciosInclude
        }
      }
    });

    if (!record) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error fetching biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar un registro existente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
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
    const accontoRaw = formData.get('acconto');
    const numeroPasajerosRaw = formData.get('numeroPasajeros');
    const numeroCuotasRaw = formData.get('numeroCuotas');
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

    const existingRecord = await prisma.biglietteria.findUnique({
      where: { id },
      include: {
        cuotas: true,
        pasajeros: {
          include: pasajeroServiciosInclude,
        },
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;

    let attachedFileUrl = existingRecord.attachedFile;
    let attachedFileName = existingRecord.attachedFileName;

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

    const record = await prisma.$transaction(async (tx) => {
      await tx.pasajeroBiglietteria.deleteMany({
        where: { biglietteriaId: id },
      });

      await tx.cuota.deleteMany({
        where: { biglietteriaId: id },
      });

      await tx.biglietteria.update({
        where: { id },
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
          acconto: accontoValue,
          daPagare,
          metodoPagamento,
          notaDiVendita: toNullableString(notaDiVendita),
          notaDiRicevuta: toNullableString(notaDiRicevuta),
          feeAgv,
          attachedFile: attachedFileUrl,
          attachedFileName: attachedFileName,
          numeroCuotas: numeroCuotas > 0 ? numeroCuotas : null,
          numeroPasajeros,
          netoPrincipal,
          vendutoTotal,
          updatedAt: new Date(),
        },
      });

      if (pasajerosParaCrear.length > 0) {
        for (const pasajeroData of pasajerosParaCrear) {
          const { serviciosDetalle, ...pasajeroCampos } = pasajeroData;
          await tx.pasajeroBiglietteria.create({
            data: {
              ...pasajeroCampos,
              biglietteriaId: id,
              serviciosDetalle,
            },
          });
        }
      }

      if (cuotasConArchivos.length > 0) {
        await tx.cuota.createMany({
          data: cuotasConArchivos.map((cuota) => ({
            ...cuota,
            biglietteriaId: id,
          })),
        });
      }

      return tx.biglietteria.findUnique({
        where: { id },
        include: {
          cuotas: {
            orderBy: {
              numeroCuota: 'asc',
            },
          },
          pasajeros: {
            include: pasajeroServiciosInclude,
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      record,
      message: 'Registro actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating biglietteria record:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PATCH - Actualización parcial de campos específicos
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el rol del usuario
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verificar que el registro existe
    const existingRecord = await prisma.biglietteria.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Validar restricciones de rol para el campo pagamento
    if (body.pagamento !== undefined) {
      // Si el usuario es USER, solo puede usar Acconto o Ricevuto
      if (user.role === 'USER') {
        if (body.pagamento !== 'Acconto' && body.pagamento !== 'Ricevuto') {
          return NextResponse.json({ 
            error: 'No tienes permisos para usar este valor de pagamento. Solo puedes usar "Acconto" o "Ricevuto".' 
          }, { status: 403 });
        }
      }
      // ADMIN y TI pueden usar cualquier valor
    }

    // Actualizar solo los campos proporcionados
    const record = await prisma.biglietteria.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        pasajeros: {
          include: pasajeroServiciosInclude
        }
      }
    });

    return NextResponse.json({ 
      record,
      message: 'Campo actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error patching biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar un registro (eliminación física)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el registro existe y obtener datos completos
    const existingRecord = await prisma.biglietteria.findUnique({
      where: { id },
      include: {
        pasajeros: true,
        cuotas: true
      }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Obtener información del usuario que elimina
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    // Obtener IP y User Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Registrar en auditoría ANTES de eliminar (si la tabla existe)
    try {
      await prisma.auditoriaEliminacion.create({
        data: {
          tipoVenta: 'biglietteria',
          registroId: id,
          nombreCliente: existingRecord.cliente,
          datosRegistro: {
            ...existingRecord,
            pasajeros: existingRecord.pasajeros,
            cuotas: existingRecord.cuotas
          } as any,
          usuarioId: userId,
          usuarioNombre: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
          usuarioEmail: user?.email || null,
          ipAddress,
          userAgent
        }
      });
    } catch (auditError: any) {
      // Si la tabla de auditoría no existe, solo registrar warning pero continuar con la eliminación
      console.warn('⚠️ No se pudo registrar en auditoría (tabla puede no existir):', auditError?.message);
    }

    // Eliminar el registro de la base de datos
    await prisma.biglietteria.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Registro eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

