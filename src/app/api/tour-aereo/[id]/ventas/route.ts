import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Función para recalcular feeAgv de un tour aéreo
async function recalcularFeeAgvAereo(tourId: string) {
  try {
    const tour = await prisma.tourAereo.findUnique({
      where: { id: tourId },
      include: {
        ventas: true
      }
    });

    if (!tour) return;

    // Calcular FEE/AGV total de todas las ventas
    let totalFeeAgv = 0;
    
    for (const venta of tour.ventas) {
      // Calcular costos totales de esta venta
      const costosTotales = (venta.transfer || 0) + (tour.guidaLocale || 0) + 
                          (tour.coordinatore || 0) + (tour.transporte || 0) + (tour.hotel || 0);
      
      // Calcular FEE/AGV de esta venta: VENDUTO - COSTOS TOTALES
      const feeAgvVenta = (venta.venduto || 0) - costosTotales;
      totalFeeAgv += feeAgvVenta;
    }

    // Actualizar el tour
    await prisma.tourAereo.update({
      where: { id: tourId },
      data: { feeAgv: totalFeeAgv }
    });

    return totalFeeAgv;
  } catch (error) {
    console.error('Error recalculating feeAgv for tour aereo:', error);
    return 0;
  }
}

// Configurar Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
    api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
  });
}

// GET - Listar todas las ventas de un tour aéreo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: tourId } = await params;

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el tour existe y el usuario tiene acceso
    const tour = await prisma.tourAereo.findUnique({
      where: { id: tourId },
      select: { id: true, createdBy: true }
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Los usuarios USER pueden ver todas las ventas para realizar ventas

    const ventas = await prisma.ventaTourAereo.findMany({
      where: { tourAereoId: tourId },
      include: {
        tourAereo: {
          select: {
            id: true,
            titulo: true,
            meta: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        cuotas: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ ventas });

  } catch (error) {
    console.error('Error fetching ventas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear una nueva venta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: tourId } = await params;
    
    // Obtener FormData para manejar archivos
    const formData = await request.formData();

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el tour existe y el usuario tiene acceso
    const tour = await prisma.tourAereo.findUnique({
      where: { id: tourId },
      select: { id: true, createdBy: true, meta: true, hotel: true }
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Los usuarios USER pueden vender en todos los tours

    // Extraer datos del FormData
    const pasajero = formData.get('pasajero') as string;
    const codiceFiscale = formData.get('codiceFiscale') as string;
    const indirizzo = formData.get('indirizzo') as string;
    const email = formData.get('email') as string;
    const numeroTelefono = formData.get('numeroTelefono') as string;
    const paisOrigen = formData.get('paisOrigen') as string;
    const iata = formData.get('iata') as string;
    const pnr = formData.get('pnr') as string;
    const transfer = formData.get('transfer') as string;
    const venduto = formData.get('venduto') as string;
    const acconto = formData.get('acconto') as string;
    const metodoPagamento = formData.get('metodoPagamento') as string;
    const metodoCompra = formData.get('metodoCompra') as string;
    const stato = formData.get('stato') as string;
    const clienteId = formData.get('clienteId') as string;
    const cuotasJson = formData.get('cuotas') as string;
    
    // Procesar archivo principal
    const file = formData.get('file') as File | null;
    let attachedFileUrl = null;
    let attachedFileName = null;
    
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
        const resourceType = isImage ? 'image' : 'raw';
        
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'gibravotravel/tour-aereo',
              resource_type: resourceType
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        attachedFileUrl = result.secure_url;
        attachedFileName = file.name;
      } catch (error) {
        console.error('Error uploading main file:', error);
      }
    }

    // Validar solo campos realmente requeridos
    // Nota: codiceFiscale, indirizzo, email, numeroTelefono, paisOrigen ahora son opcionales (se autocompletan)
    if (!pasajero || !iata || !venduto || !metodoPagamento || !stato) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Calcular daPagare
    const daPagare = parseFloat(venduto) - parseFloat(acconto || '0');

    // Procesar cuotas con archivos
    const cuotas = cuotasJson ? JSON.parse(cuotasJson) : [];
    const cuotasConArchivos = [];
    
    if (cuotas && cuotas.length > 0) {
      for (let i = 0; i < cuotas.length; i++) {
        const cuota = cuotas[i];
        let cuotaAttachedFile = null;
        let cuotaAttachedFileName = null;
        
        // Procesar archivo de la cuota si existe
        const cuotaFile = formData.get(`cuotaFile${i}`) as File | null;
        if (cuotaFile && cuotaFile.size > 0) {
          try {
            const bytes = await cuotaFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const fileExtension = cuotaFile.name.toLowerCase().split('.').pop();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
            const resourceType = isImage ? 'image' : 'raw';
            
            const result = await new Promise<any>((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                {
                  folder: 'gibravotravel/tour-aereo/cuotas',
                  resource_type: resourceType
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              ).end(buffer);
            });
            
            cuotaAttachedFile = result.secure_url;
            cuotaAttachedFileName = cuotaFile.name;
          } catch (error) {
            console.error(`Error uploading cuota file ${i}:`, error);
          }
        }
        
        const cuotaData = {
          numeroCuota: cuota.numeroCuota,
          fechaPago: new Date(cuota.fechaPago),
          monto: parseFloat(cuota.monto),
          nota: cuota.nota || null,
          estado: cuota.estado || "Pendiente",
          attachedFile: cuotaAttachedFile,
          attachedFileName: cuotaAttachedFileName
        };
        cuotasConArchivos.push(cuotaData);
      }
    }

    // Crear la venta con cuotas
    const venta = await prisma.ventaTourAereo.create({
      data: {
        tourAereoId: tourId,
        clienteId: clienteId || null,
        pasajero,
        codiceFiscale: codiceFiscale || '',
        indirizzo: indirizzo || '',
        email: email || '',
        numeroTelefono: numeroTelefono || '',
        paisOrigen: paisOrigen || '',
        iata,
        pnr: pnr || null,
        hotel: tour?.hotel ?? null,
        transfer: transfer ? parseFloat(transfer) : null,
        venduto: parseFloat(venduto),
        acconto: parseFloat(acconto || '0'),
        daPagare,
        metodoPagamento,
        metodoCompra: metodoCompra || null,
        stato,
        attachedFile: attachedFileUrl,
        attachedFileName: attachedFileName,
        createdBy: user.id,
        cuotas: {
          create: cuotasConArchivos
        }
      },
      include: {
        tourAereo: {
          select: {
            id: true,
            titulo: true,
            meta: true
          }
        },
        cuotas: true
      }
    });


    // Obtener información del creador
    // Nota: createdBy almacena el id del usuario, no el clerkId
    const creator = await prisma.user.findUnique({
      where: { id: venta.createdBy },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const ventaConCreador = {
      ...venta,
      creator
    };

    // Recalcular feeAgv del tour
    try {
      await recalcularFeeAgvAereo(tourId);
    } catch (error) {
      console.error('Error recalculating feeAgv:', error);
      // No fallar la venta por este error
    }

    return NextResponse.json({ venta: ventaConCreador }, { status: 201 });

  } catch (error) {
    console.error('Error creating venta:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
