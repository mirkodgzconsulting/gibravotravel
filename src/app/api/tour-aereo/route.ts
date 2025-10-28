import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
  api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
});

// GET - Listar todos los tours aéreos
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
      console.log('🔍 TOUR AEREO - Filtros de fecha aplicados (fechaViaje):', whereCondition.fechaViaje);
    }

    // Si es USER, solo mostrar sus propios tours
    if (userOnly && user.role === 'USER') {
      whereCondition = {
        ...whereCondition,
        createdBy: userId
      };
    }

    const tours = await prisma.tourAereo.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        ventas: {
          select: {
            id: true,
            venduto: true,
            transfer: true,
            hotel: true,
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
            ventas: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ tours });
  } catch (error) {
    console.error('Error fetching tours aereo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo tour aéreo
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const formData = await request.formData();

    // Extraer campos del formulario
    const titulo = formData.get('titulo') as string;
    const precioAdulto = parseFloat(formData.get('precioAdulto') as string);
    const precioNino = parseFloat(formData.get('precioNino') as string);
    const fechaViaje = formData.get('fechaViaje') as string;
    const fechaFin = formData.get('fechaFin') as string;
    const meta = parseInt(formData.get('meta') as string) || 0;
    
    // Debug logs
    console.log('🔍 TOUR AEREO - Datos recibidos:');
    console.log('fechaViaje:', fechaViaje);
    console.log('fechaFin:', fechaFin);
    const acc = formData.get('acc') as string;
    const guidaLocale = parseFloat(formData.get('guidaLocale') as string) || 0;
    const coordinatore = parseFloat(formData.get('coordinatore') as string) || 0;
    const transporte = parseFloat(formData.get('transporte') as string) || 0;
    const notas = formData.get('notas') as string;
    const notasCoordinador = formData.get('notasCoordinador') as string;
    const descripcion = formData.get('descripcion') as string;
    const coverImage = formData.get('coverImage') as File | null;
    const pdfFile = formData.get('pdfFile') as File | null;

    // Validar campos requeridos
    if (!titulo || !precioAdulto || !precioNino) {
      return NextResponse.json(
        { error: 'Título, precio adulto y precio niño son requeridos' },
        { status: 400 }
      );
    }

    // Procesar fecha de viaje
    let fechaViajeDate = null;
    if (fechaViaje) {
      try {
        fechaViajeDate = new Date(fechaViaje);
        if (isNaN(fechaViajeDate.getTime())) {
          fechaViajeDate = null;
        }
      } catch (error) {
        fechaViajeDate = null;
      }
    }

    // Procesar fecha de fin
    let fechaFinDate = null;
    if (fechaFin) {
      try {
        fechaFinDate = new Date(fechaFin);
        if (isNaN(fechaFinDate.getTime())) {
          fechaFinDate = null;
        }
      } catch (error) {
        fechaFinDate = null;
      }
    }

    // Subir imagen de portada a Cloudinary
    let coverImageUrl = null;
    let coverImageName = null;
    
    if (coverImage && coverImage.size > 0) {
      try {
        const bytes = await coverImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'gibravotravel/tour_aereo/covers',
              resource_type: 'image'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        coverImageUrl = result.secure_url;
        coverImageName = coverImage.name;
      } catch (error) {
        console.error('Error uploading cover image:', error);
      }
    }

    // Subir archivo PDF a Cloudinary
    let pdfFileUrl = null;
    let pdfFileName = null;
    
    if (pdfFile && pdfFile.size > 0) {
      try {
        const bytes = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'gibravotravel/tour_aereo/pdf',
              resource_type: 'raw'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        pdfFileUrl = result.secure_url;
        pdfFileName = pdfFile.name;
      } catch (error) {
        console.error('Error uploading PDF file:', error);
      }
    }

    // Crear el tour aéreo en la base de datos
    const tour = await prisma.tourAereo.create({
      data: {
        titulo,
        precioAdulto,
        precioNino,
        fechaViaje: fechaViajeDate,
        fechaFin: fechaFinDate,
        meta,
        acc: acc || null,
        guidaLocale: (guidaLocale > 0 ? guidaLocale : null) as any,
        coordinatore: (coordinatore > 0 ? coordinatore : null) as any,
        transporte: (transporte > 0 ? transporte : null) as any,
        notas: notas || null,
        notasCoordinador: notasCoordinador || null,
        descripcion: descripcion || null,
        coverImage: coverImageUrl,
        coverImageName,
        pdfFile: pdfFileUrl,
        pdfFileName,
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { tour, message: 'Tour aéreo creado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating tour aereo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

