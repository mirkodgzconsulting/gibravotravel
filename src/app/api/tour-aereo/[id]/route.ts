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

    // Normalizar documentoViaggio: convertir formato legacy (string) a array
    const tourAny = tour as any;
    if (tourAny.documentoViaggio) {
      if (typeof tourAny.documentoViaggio === 'string') {
        // Formato legacy: convertir a array
        tourAny.documentoViaggio = [{
          url: tourAny.documentoViaggio,
          name: tourAny.documentoViaggioName || 'documento'
        }];
        delete tourAny.documentoViaggioName;
      }
      // Si ya es array, dejarlo como está
    }

    return NextResponse.json({ tour: tourAny });
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

    // Permitir edición a cualquier rol autenticado

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
    const hotelRaw = formData.get('hotel');
    const hotelParsed = hotelRaw !== null && `${hotelRaw}`.trim() !== ''
      ? parseFloat(`${hotelRaw}`.replace(',', '.'))
      : null;
    const hotel = hotelParsed !== null && !Number.isNaN(hotelParsed) ? hotelParsed : null;
    const notas = formData.get('notas') as string;
    const notasCoordinador = formData.get('notasCoordinador') as string;
    const descripcion = formData.get('descripcion') as string;
    const coverImage = formData.get('coverImage') as File | null;
    const pdfFile = formData.get('pdfFile') as File | null;
    const documentoViaggioFile = formData.get('documentoViaggio') as File | null;

    // Validar campos requeridos
    if (!titulo || !precioAdulto) {
      return NextResponse.json(
        { error: 'Título y precio adulto son requeridos' },
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

    // Manejar múltiples documentos de viaje
    let documentoViaggioArray: Array<{ url: string; name: string }> = [];
    
    // Obtener archivos existentes si se proporcionan
    const documentoViaggioExisting = formData.get('documentoViaggioExisting') as string | null;
    if (documentoViaggioExisting) {
      try {
        documentoViaggioArray = JSON.parse(documentoViaggioExisting);
      } catch (error) {
        console.error('Error parsing existing documents:', error);
        // Si hay un documento antiguo (formato legacy), convertirlo
        if ((existingTour as any).documentoViaggio && typeof (existingTour as any).documentoViaggio === 'string') {
          documentoViaggioArray = [{
            url: (existingTour as any).documentoViaggio,
            name: (existingTour as any).documentoViaggioName || 'documento'
          }];
        }
      }
    } else {
      // Si no se proporcionan archivos existentes, verificar si hay formato legacy
      if ((existingTour as any).documentoViaggio) {
        if (typeof (existingTour as any).documentoViaggio === 'string') {
          // Formato legacy: convertir a array
          documentoViaggioArray = [{
            url: (existingTour as any).documentoViaggio,
            name: (existingTour as any).documentoViaggioName || 'documento'
          }];
        } else if (Array.isArray((existingTour as any).documentoViaggio)) {
          // Ya es un array
          documentoViaggioArray = (existingTour as any).documentoViaggio;
        }
      }
    }

    // Procesar nuevos archivos
    const documentoViaggioFiles = formData.getAll('documentoViaggio') as File[];
    const validFiles = documentoViaggioFiles.filter(file => file && file.size > 0);

    if (validFiles.length > 0) {
      // Validar máximo de 5 archivos
      if (documentoViaggioArray.length + validFiles.length > 5) {
        return NextResponse.json(
          { error: 'Massimo 5 file consentiti per Documento Viaggio' },
          { status: 400 }
        );
      }

      // Subir nuevos archivos a Cloudinary
      for (const file of validFiles) {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Detectar el tipo de archivo para usar el resource_type correcto
          const fileExtension = file.name.toLowerCase().split('.').pop();
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
          const resourceType = isImage ? 'image' : 'raw'; // PDFs y otros archivos usan 'raw'

          const result = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/tour_aereo/documenti',
                resource_type: resourceType // Usar 'raw' para PDFs, 'image' para imágenes
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });

          documentoViaggioArray.push({
            url: result.secure_url,
            name: file.name
          });
        } catch (error) {
          console.error('Error uploading travel document:', error);
        }
      }
    }

    // Si no hay archivos, dejar como array vacío o null
    // Convertir a Prisma.JsonValue para que Prisma lo acepte
    const documentoViaggioFinal = documentoViaggioArray.length > 0 
      ? (documentoViaggioArray as any) 
      : null;
 
    const updateData: any = {
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
      hotel: hotel !== null ? hotel : null,
      notas: notas || null,
      notasCoordinador: notasCoordinador || null,
      descripcion: descripcion || null,
      coverImage: coverImageUrl,
      coverImageName,
      pdfFile: pdfFileUrl,
      pdfFileName,
      updatedAt: new Date(),
    };

    // Solo agregar documentoViaggio si hay datos
    // Usar cast explícito a any para evitar problemas de tipo con Prisma
    if (documentoViaggioFinal !== null) {
      updateData.documentoViaggio = documentoViaggioFinal as any;
    } else {
      updateData.documentoViaggio = null;
    }

    // Actualizar el tour aéreo en la base de datos
    // Usar cast a any para el data completo para evitar problemas de tipo
    const tour = await prisma.tourAereo.update({
      where: { id },
      data: updateData as any,
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

    // Permitir eliminación (soft delete) a cualquier rol autenticado

    // Verificar si hay ventas asociadas
    const ventasAsociadas = await prisma.ventaTourAereo.findMany({
      where: {
        tourAereoId: id
      }
    });

    if (ventasAsociadas.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un tour con ventas registradas' 
      }, { status: 400 });
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

