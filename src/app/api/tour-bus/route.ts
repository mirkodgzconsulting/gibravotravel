import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';

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
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
    }

    // Si userIdParam está presente, solo mostrar tours que tienen ventas de ese usuario
    if (userIdParam) {
      whereCondition.ventasTourBus = {
        some: {
          createdBy: userIdParam
        }
      };
    }

    const tours = await prisma.tourBus.findMany({
      where: whereCondition,
      select: {
        id: true,
        titulo: true,
        precioAdulto: true,
        precioNino: true,
        cantidadAsientos: true,
        fechaViaje: true,
        fechaFin: true,
        acc: true,
        // Campos de costos
        bus: true,
        pasti: true,
        parking: true,
        coordinatore1: true,
        coordinatore2: true,
        ztl: true,
        hotel: true,
        polizza: true,
        tkt: true,
        autoservicio: true,
        feeAgv: true,
        // Archivos y descripciones
        coverImage: true,
        coverImageName: true,
        isPublic: true, // Added by Agent

        // New Fields 2026-01-14
        flightRefTitle: true,
        flightRefLink: true,
        optionCameraSingola: true,
        optionFlexibleCancel: true,
        priceFlexibleCancel: true,
        optionCameraPrivata: true,
        priceCameraPrivata: true,
        travelStatus: true,

        // WEB CONTENT FIELDS (Missing previously)
        slug: true,
        subtitulo: true,
        duracionTexto: true,
        infoGeneral: true,
        requisitosDocumentacion: true,
        itinerario: true,
        etiquetas: true,
        incluye: true,
        noIncluye: true,
        galeria: true,
        galeria2: true,
        mapaEmbed: true,
        coordinadorNombre: true,
        coordinadorDescripcion: true,
        coordinadorFoto: true,
        faq: true,
        infoUtile: true,
        webCoverImage: true,
        webCoverImageName: true,

        pdfFile: true,
        pdfFileName: true,
        descripcion: true,
        notas: true,
        notasCoordinador: true,
        createdAt: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        asientos: {
          select: {
            id: true,
            isVendido: true,
            precioVenta: true
          }
        },
        ventasTourBus: {
          where: userIdParam ? { createdBy: userIdParam } : undefined,
          select: {
            id: true,
            acconto: true,
            createdAt: true,
            createdBy: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            acompanantes: {
              select: {
                id: true
              }
            }
          }
        },
        _count: {
          select: {
            ventasTourBus: true
          }
        }
      },
      orderBy: [
        {
          fechaViaje: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return NextResponse.json({ tours });

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

    // --- Extract Web Fields ---
    const slug = formData.get('slug') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const subtitulo = formData.get('subtitulo') as string;
    const duracionTexto = formData.get('duracionTexto') as string;
    // Removed: nivelDificultad, rangoEdad, minGrupo, maxGrupo, tipoAlojamiento

    // Arrays must be parsed if sent as JSON, but here they might be sent as string? 
    // Usually formData.get() returns string for text inputs. 
    // In WEB modal we send JSON.stringify for everything complex.

    let requisitosDocumentacion: string[] = [];
    try { requisitosDocumentacion = JSON.parse(formData.get('requisitosDocumentacion') as string || '[]'); } catch { }

    const infoGeneral = formData.get('infoGeneral') as string;
    // Removed: programa
    let itinerario: any = undefined;
    try { itinerario = JSON.parse(formData.get('itinerario') as string || '[]'); } catch { }

    const mapaEmbed = formData.get('mapaEmbed') as string;
    const coordinadorNombre = formData.get('coordinadorNombre') as string;
    const coordinadorDescripcion = formData.get('coordinadorDescripcion') as string;

    // Arrays: etiquetas, incluye, noIncluye, galeria (URLs)
    let etiquetas: string[] = [];
    try { etiquetas = JSON.parse(formData.get('etiquetas') as string || '[]'); } catch { }

    let incluye: string[] = [];
    try { incluye = JSON.parse(formData.get('incluye') as string || '[]'); } catch { }

    let noIncluye: string[] = [];
    try { noIncluye = JSON.parse(formData.get('noIncluye') as string || '[]'); } catch { }

    let galeria: string[] = [];
    try { galeria = JSON.parse(formData.get('galeria') as string || '[]'); } catch { }

    // 5. Galeria2 (Array of Strings)
    let galeria2: string[] = [];
    try { galeria2 = JSON.parse(formData.get('galeria2') as string || '[]'); } catch { }

    // Gallery Files (1 & 2)
    const galleryFiles = formData.getAll('galleryImages');
    const gallery2Files = formData.getAll('gallery2Images');

    // Upload new gallery files (Gallery 1)
    for (const file of galleryFiles) {
      if (file instanceof File && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Auto resource type for video/image
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'gibravotravel/tour-bus', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });
        if (result?.secure_url) galeria.push(result.secure_url);
      }
    }

    // Upload new gallery files (Gallery 2)
    for (const file of gallery2Files) {
      if (file instanceof File && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Auto resource type for video/image
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'gibravotravel/tour-bus', resource_type: 'auto' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });
        if (result?.secure_url) galeria2.push(result.secure_url);
      }
    }

    // FAQ (JSON)
    let faq = null;
    try { faq = JSON.parse(formData.get('faq') as string || 'null'); } catch { }

    // Coordinador Foto
    const coordinadorFotoFile = formData.get('coordinadorFoto') as File | string;
    let coordinadorFotoUrl = null;
    if (typeof coordinadorFotoFile === 'string') {
      coordinadorFotoUrl = coordinadorFotoFile;
    }

    // New Fields 2026-01-14
    const flightRefTitle = formData.get('flightRefTitle') as string;
    const flightRefLink = formData.get('flightRefLink') as string;
    const optionCameraSingola = formData.get('optionCameraSingola') === 'true';
    const optionFlexibleCancel = formData.get('optionFlexibleCancel') === 'true';
    const priceFlexibleCancel = parseFloat(formData.get('priceFlexibleCancel') as string) || 0;
    const optionCameraPrivata = formData.get('optionCameraPrivata') === 'true';
    const priceCameraPrivata = parseFloat(formData.get('priceCameraPrivata') as string) || 0;
    const travelStatus = formData.get('travelStatus') as string || 'SOGNANDO';

    // Add request to uploadPromises for CoordinadorFoto if it is a File
    if (coordinadorFotoFile instanceof File && coordinadorFotoFile.size > 0) {
      const coordFotoPromise = (async () => {
        try {
          const bytes = await coordinadorFotoFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/coordinadores',
                resource_type: 'image',
                transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
              },
              (error, result) => { if (error) reject(error); else resolve(result); }
            ).end(buffer);
          });
          return { type: 'coordFoto', url: (result as any).secure_url };
        } catch (e) { console.error(e); return { type: 'error' }; }
      })();
      uploadPromises.push(coordFotoPromise);
    }

    // Ejecutar todos los uploads en paralelo
    let coverImageUrl: string | null = null;
    let coverImageName: string | null = null;
    let pdfFileUrl: string | null = null;
    let pdfFileName: string | null = null;
    let finalCoordinadorFotoUrl: string | null = coordinadorFotoUrl;

    if (uploadPromises.length > 0) {
      try {
        const uploadResults = await Promise.all(uploadPromises);

        uploadResults.forEach((result: any) => {
          if (result.type === 'image') {
            coverImageUrl = result.url;
            coverImageName = result.name;
          } else if (result.type === 'pdf') {
            pdfFileUrl = result.url;
            pdfFileName = result.name;
          } else if (result.type === 'coordFoto') {
            finalCoordinadorFotoUrl = result.url;
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

        // --- WEB FIELDS ---
        slug: slug && slug.trim() !== '' ? slug : undefined,
        isPublic,
        subtitulo,
        etiquetas,
        duracionTexto,
        // Removed: nivelDificultad, rangoEdad, minGrupo, maxGrupo, tipoAlojamiento
        requisitosDocumentacion,
        infoGeneral,
        // Removed: programa
        itinerario, // JSON
        mapaEmbed,
        galeria,
        galeria2, // New Field
        incluye,
        noIncluye,
        coordinadorNombre,
        coordinadorDescripcion,
        coordinadorFoto: finalCoordinadorFotoUrl,
        faq: faq ? (faq as any) : undefined,

        // New Fields Injection
        flightRefTitle: flightRefTitle || null,
        flightRefLink: flightRefLink || null,
        optionCameraSingola,
        optionFlexibleCancel,
        priceFlexibleCancel,
        optionCameraPrivata,
        priceCameraPrivata,
        travelStatus,

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
