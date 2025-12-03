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

// GET - Obtener un tour de bus específico
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
    const tour = await prisma.tourBus.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        asientos: {
          orderBy: {
            numeroAsiento: 'asc'
          }
        },
        ventas: true,
        ventasTourBus: {
          include: {
            acompanantes: true,
            cuotas: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            ventas: true
          }
        }
      }
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

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
      } else if (Array.isArray(tourAny.documentoViaggio)) {
        // Ya es array, dejarlo como está
      } else if (typeof tourAny.documentoViaggio === 'object') {
        // Si es objeto, convertirlo a array
        tourAny.documentoViaggio = [tourAny.documentoViaggio];
      }
    }

    return NextResponse.json({ tour: tourAny });

  } catch (error) {
    console.error('Error fetching tour bus:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar un tour de bus
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const formData = await request.formData();
    const titulo = formData.get('titulo') as string;
    const precioAdulto = formData.get('precioAdulto') as string;
    const precioNino = formData.get('precioNino') as string;
    const fechaViaje = formData.get('fechaViaje') as string;
    const fechaFin = formData.get('fechaFin') as string;
    const acc = formData.get('acc') as string;
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
    const notas = formData.get('notas') as string;
    const notasCoordinador = formData.get('notasCoordinador') as string;
    const coverImage = formData.get('coverImage') as File;
    const pdfFile = formData.get('pdfFile') as File;

    // Verificar que el tour existe
    const tourExistente = await prisma.tourBus.findUnique({
      where: { id },
      include: { asientos: true }
    });

    if (!tourExistente) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Permitir edición a cualquier usuario autenticado

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
    let coverImageUrl = tourExistente.coverImage;
    let coverImageName = tourExistente.coverImageName;
    let pdfFileUrl = tourExistente.pdfFile;
    let pdfFileName = tourExistente.pdfFileName;

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
        if ((tourExistente as any).documentoViaggio && typeof (tourExistente as any).documentoViaggio === 'string') {
          documentoViaggioArray = [{
            url: (tourExistente as any).documentoViaggio,
            name: (tourExistente as any).documentoViaggioName || 'documento'
          }];
        }
      }
    } else {
      // Si no se proporcionan archivos existentes, verificar si hay formato legacy
      if ((tourExistente as any).documentoViaggio) {
        if (typeof (tourExistente as any).documentoViaggio === 'string') {
          // Formato legacy: convertir a array
          documentoViaggioArray = [{
            url: (tourExistente as any).documentoViaggio,
            name: (tourExistente as any).documentoViaggioName || 'documento'
          }];
        } else if (Array.isArray((tourExistente as any).documentoViaggio)) {
          // Ya es un array
          documentoViaggioArray = (tourExistente as any).documentoViaggio;
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
                folder: 'gibravotravel/tour-bus/documenti',
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

    // Cantidad de asientos siempre es 53 (no se puede cambiar)
    const cantidadAsientos = 53;

    // Preparar datos de actualización
    const updateData: any = {
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
      descripcion: descripcion && descripcion.trim() !== '' ? descripcion : null,
      notas: notas && notas.trim() !== '' ? notas : null,
      notasCoordinador: notasCoordinador && notasCoordinador.trim() !== '' ? notasCoordinador : null,
      updatedAt: new Date(),
    };

    // Solo agregar documentoViaggio si hay datos
    // Usar cast explícito a any para evitar problemas de tipo con Prisma
    if (documentoViaggioFinal !== null) {
      updateData.documentoViaggio = documentoViaggioFinal as any;
    } else {
      updateData.documentoViaggio = null;
    }

    // Actualizar el tour
    const tourActualizado = await prisma.tourBus.update({
      where: { id },
      data: updateData as any,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        asientos: {
          orderBy: {
            numeroAsiento: 'asc'
          }
        },
        ventasTourBus: {
          include: {
            acompanantes: true,
            cuotas: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            ventas: true
          }
        }
      }
    });

    return NextResponse.json({ 
      tour: tourActualizado,
      message: 'Tour actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating tour bus:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar un tour de bus (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    // Verificar que el tour existe
    const tour = await prisma.tourBus.findUnique({
      where: { id }
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Permitir eliminación a cualquier usuario autenticado (con validaciones existentes)

    // Verificar si hay asientos vendidos
    const asientosVendidos = await prisma.asientoBus.findMany({
      where: {
        tourBusId: id,
        isVendido: true
      }
    });

    if (asientosVendidos.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un tour con asientos vendidos' 
      }, { status: 400 });
    }

    // Soft delete
    await prisma.tourBus.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'Tour eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting tour bus:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
