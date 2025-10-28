import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';

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

// GET - Obtener un tour aéreo específico
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

    const tour = await prisma.tourAereo.findUnique({
      where: { id },
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

    if (!tour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Los usuarios USER pueden acceder a todos los tours para realizar ventas

    return NextResponse.json({ tour });
  } catch (error) {
    console.error('Error fetching tour aereo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un tour aéreo existente
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

    // Verificar que el tour existe
    const existingTour = await prisma.tourAereo.findUnique({
      where: { id }
    });

    if (!existingTour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Verificar permisos para edición - solo USER puede editar tours que creó
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (user?.role === 'USER' && existingTour.createdBy !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este tour' },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    // Extraer campos del formulario
    const titulo = formData.get('titulo') as string;
    const precioAdulto = parseFloat(formData.get('precioAdulto') as string);
    const precioNino = parseFloat(formData.get('precioNino') as string);
    const fechaViaje = formData.get('fechaViaje') as string;
    const fechaFin = formData.get('fechaFin') as string;
    const meta = parseInt(formData.get('meta') as string) || 0;
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

    // Mantener archivos existentes o subir nuevos
    let coverImageUrl = existingTour.coverImage;
    let coverImageName = existingTour.coverImageName;
    
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

    let pdfFileUrl = existingTour.pdfFile;
    let pdfFileName = existingTour.pdfFileName;
    
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

    // Actualizar el tour aéreo en la base de datos
    const tour = await prisma.tourAereo.update({
      where: { id },
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
        updatedAt: new Date(),
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

    return NextResponse.json({
      tour,
      message: 'Tour aéreo actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating tour aereo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un tour aéreo (eliminación lógica)
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

    // Verificar que el tour existe
    const existingTour = await prisma.tourAereo.findUnique({
      where: { id }
    });

    if (!existingTour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Verificar permisos para eliminación - solo USER puede eliminar tours que creó
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (user?.role === 'USER' && existingTour.createdBy !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este tour' },
        { status: 403 }
      );
    }

    // Eliminación lógica (marcar como inactivo)
    await prisma.tourAereo.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Tour aéreo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting tour aereo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

