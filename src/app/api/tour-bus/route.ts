import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Función para recalcular feeAgv de un tour
async function recalcularFeeAgv(tourId: string) {
  try {
    const tour = await prisma.tourBus.findUnique({
      where: { id: tourId },
      include: {
        ventasTourBus: true
      }
    });

    if (!tour) return;

    // Calcular SPESA TOTALE (suma de todos los costos)
    const spesaTotale = (tour.bus || 0) + (tour.pasti || 0) + (tour.parking || 0) + 
                       (tour.coordinatore1 || 0) + (tour.coordinatore2 || 0) + 
                       (tour.ztl || 0) + (tour.hotel || 0) + (tour.polizza || 0) + (tour.tkt || 0);

    // Calcular RICAVO TOTALE (suma de todos los accontos)
    const ricavoTotale = tour.ventasTourBus.reduce((sum, venta) => sum + (venta.acconto || 0), 0);

    // Calcular FEE/AGV
    const feeAgv = ricavoTotale - spesaTotale;

    // Actualizar el tour
    await prisma.tourBus.update({
      where: { id: tourId },
      data: { feeAgv }
    });

    return feeAgv;
  } catch (error) {
    console.error('Error recalculating feeAgv:', error);
    return 0;
  }
}

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
  api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
});

// GET - Listar todos los tours de bus
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

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let whereCondition: any = { isActive: true };
    
    // Agregar filtros de fecha si se proporcionan
    if (fechaDesde && fechaHasta) {
      whereCondition.fechaViaje = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta)
      };
      console.log('🔍 TOURS BUS - Filtros de fecha aplicados (fechaViaje):', whereCondition.fechaViaje);
    }

    // Los usuarios USER pueden ver todos los tours para realizar ventas

    const tours = await prisma.tourBus.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        asientos: true,
        ventasTourBus: {
          where: userIdParam ? { createdBy: userIdParam } : undefined,
          select: {
            id: true,
            acconto: true,
            createdAt: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            ventas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const res = NextResponse.json({ tours });
    // Cache privada corta para mejorar retorno a la vista
    res.headers.set('Cache-Control', 'private, max-age=15, must-revalidate');
    return res;

  } catch (error) {
    console.error('Error fetching tour buses:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo tour de bus
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const formData = await request.formData();
    const titulo = formData.get('titulo') as string;
    const precioAdulto = formData.get('precioAdulto') as string;
    const precioNino = formData.get('precioNino') as string;
    const fechaViaje = formData.get('fechaViaje') as string;
    const fechaFin = formData.get('fechaFin') as string;
    const acc = formData.get('acc') as string;
    
    // Debug logs
    console.log('🔍 TOUR BUS - Datos recibidos:');
    console.log('fechaViaje:', fechaViaje);
    console.log('fechaFin:', fechaFin);
    // Campos de costos
    const bus = formData.get('bus') as string;
    const pasti = formData.get('pasti') as string;
    const parking = formData.get('parking') as string;
    const coordinatore1 = formData.get('coordinatore1') as string;
    const coordinatore2 = formData.get('coordinatore2') as string;
    const ztl = formData.get('ztl') as string;
    const hotel = formData.get('hotel') as string;
    const polizza = formData.get('polizza') as string;
    const tkt = formData.get('tkt') as string;
    const autoservicio = formData.get('autoservicio') as string;
    // Archivos y descripción
    const descripcion = formData.get('descripcion') as string;
    const coverImage = formData.get('coverImage') as File;
    const pdfFile = formData.get('pdfFile') as File;

    // Validaciones
    if (!titulo || !precioAdulto || !precioNino) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Validar tamaños de archivos
    if (coverImage && coverImage.size > 0) {
      const maxImageSize = 10 * 1024 * 1024; // 10MB
      if (coverImage.size > maxImageSize) {
        return NextResponse.json(
          { error: 'La imagen es demasiado grande. Máximo 10MB.' },
          { status: 400 }
        );
      }
    }

    if (pdfFile && pdfFile.size > 0) {
      const maxPdfSize = 50 * 1024 * 1024; // 50MB
      if (pdfFile.size > maxPdfSize) {
        return NextResponse.json(
          { error: 'El archivo PDF es demasiado grande. Máximo 50MB.' },
          { status: 400 }
        );
      }
    }

    // Uploads paralelos a Cloudinary
    const uploadPromises = [];

    // Upload de imagen si existe
    if (coverImage && coverImage.size > 0) {
      const imageUploadPromise = (async () => {
        try {
          const bytes = await coverImage.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/tour-bus',
                resource_type: 'image',
                transformation: [
                  { width: 800, height: 600, crop: 'limit', quality: 'auto' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });

          return {
            type: 'image',
            url: (result as { secure_url: string }).secure_url,
            name: coverImage.name
          };
        } catch (error) {
          throw new Error(`Error uploading image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })();
      
      uploadPromises.push(imageUploadPromise);
    }

    // Upload de PDF si existe
    if (pdfFile && pdfFile.size > 0) {
      const pdfUploadPromise = (async () => {
        try {
          const bytes = await pdfFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/tour-bus',
                resource_type: 'raw'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });

          return {
            type: 'pdf',
            url: (result as { secure_url: string }).secure_url,
            name: pdfFile.name
          };
        } catch (error) {
          throw new Error(`Error uploading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })();
      
      uploadPromises.push(pdfUploadPromise);
    }

    // Ejecutar todos los uploads en paralelo
    let coverImageUrl = null;
    let coverImageName = null;
    let pdfFileUrl = null;
    let pdfFileName = null;

    if (uploadPromises.length > 0) {
      try {
        const uploadResults = await Promise.all(uploadPromises);
        
        uploadResults.forEach(result => {
          if (result.type === 'image') {
            coverImageUrl = result.url;
            coverImageName = result.name;
          } else if (result.type === 'pdf') {
            pdfFileUrl = result.url;
            pdfFileName = result.name;
          }
        });
      } catch (uploadError) {
        return NextResponse.json(
          { 
            error: 'Error subiendo archivos a Cloudinary',
            details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Cantidad de asientos fija: 53
    const cantidadAsientos = 53;

    // Debug: mostrar datos antes de crear
    console.log('🔍 TOUR BUS - Creando tour con:');
    console.log('fechaViaje:', fechaViaje ? new Date(fechaViaje) : null);
    console.log('fechaFin:', fechaFin ? new Date(fechaFin) : null);
    
    // Crear el tour de bus
    const tourBus = await prisma.tourBus.create({
      data: {
        titulo,
        precioAdulto: parseFloat(precioAdulto),
        precioNino: parseFloat(precioNino),
        cantidadAsientos: cantidadAsientos,
        fechaViaje: fechaViaje ? new Date(fechaViaje) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        acc: acc && acc.trim() !== '' ? acc : null,
        // Campos de costos
        bus: bus && bus.trim() !== '' ? parseFloat(bus) : null,
        pasti: pasti && pasti.trim() !== '' ? parseFloat(pasti) : null,
        parking: parking && parking.trim() !== '' ? parseFloat(parking) : null,
        coordinatore1: coordinatore1 && coordinatore1.trim() !== '' ? parseFloat(coordinatore1) : null,
        coordinatore2: coordinatore2 && coordinatore2.trim() !== '' ? parseFloat(coordinatore2) : null,
        ztl: ztl && ztl.trim() !== '' ? parseFloat(ztl) : null,
        hotel: hotel && hotel.trim() !== '' ? parseFloat(hotel) : null,
        polizza: polizza && polizza.trim() !== '' ? parseFloat(polizza) : null,
        tkt: tkt && tkt.trim() !== '' ? parseFloat(tkt) : null,
        autoservicio: autoservicio && autoservicio.trim() !== '' ? autoservicio : null,
        // Archivos
        coverImage: coverImageUrl,
        coverImageName,
        pdfFile: pdfFileUrl,
        pdfFileName,
        descripcion,
        createdBy: userId
      }
    });

    // Generar los 53 asientos automáticamente
    const asientos = [];
    
    for (let i = 1; i <= cantidadAsientos; i++) {
      const fila = Math.ceil(i / 4);
      const posicionEnFila = ((i - 1) % 4) + 1;
      let columna = '';
      
      // Distribución 2+2: A, B, C, D
      switch (posicionEnFila) {
        case 1: columna = 'A'; break;
        case 2: columna = 'B'; break;
        case 3: columna = 'C'; break;
        case 4: columna = 'D'; break;
      }

      // Marcar asientos especiales
      let tipo: 'NORMAL' | 'PREMIUM' | 'DISCAPACITADO' | 'CONDUCTOR' = 'NORMAL';
      if (i <= 4) tipo = 'PREMIUM'; // Primera fila premium

      asientos.push({
        tourBusId: tourBus.id,
        numeroAsiento: i,
        fila,
        columna,
        tipo
      });
    }

    // Crear todos los asientos
    await prisma.asientoBus.createMany({
      data: asientos
    });

    // Retornar el tour creado con sus asientos
    const tourCreado = await prisma.tourBus.findUnique({
      where: { id: tourBus.id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        asientos: true,
        _count: {
          select: {
            ventas: true
          }
        }
      }
    });

    return NextResponse.json({ 
      tour: tourCreado,
      message: 'Tour de bus creado exitosamente' 
    });

  } catch (error) {
    console.error('Error creating tour bus:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}



