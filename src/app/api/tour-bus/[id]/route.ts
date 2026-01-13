import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

    const { id } = await params;
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
    const notas = formData.get('notas') as string;
    const notasCoordinador = formData.get('notasCoordinador') as string;
    const coverImage = formData.get('coverImage') as File;
    const webCoverImage = formData.get('webCoverImage') as File; // New
    const pdfFile = formData.get('pdfFile') as File;

    const updateData: any = {}; // Moved up to valid reference error

    // Verificar que el tour existe
    const tourExistente = await prisma.tourBus.findUnique({
      where: { id },
      include: { asientos: true }
    });

    if (!tourExistente) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

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

    if (webCoverImage && webCoverImage.size > 0) {
      const maxImageSize = 10 * 1024 * 1024; // 10MB
      if (webCoverImage.size > maxImageSize) {
        return NextResponse.json(
          { error: 'La imagen web es demasiado grande. Máximo 10MB.' },
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

          return { type: 'image', url: (result as { secure_url: string }).secure_url, name: coverImage.name };
        } catch (error) {
          throw new Error(`Error uploading image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })();

      uploadPromises.push(imageUploadPromise);
    }

    // Upload de imagen WEB si existe
    if (webCoverImage && webCoverImage.size > 0) {
      const webImageUploadPromise = (async () => {
        try {
          const bytes = await webCoverImage.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/tour-bus/web_covers',
                resource_type: 'image',
                transformation: [
                  { width: 1920, height: 1080, crop: 'limit', quality: 'auto' } // Higher quality for web
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });

          return { type: 'webImage', url: (result as { secure_url: string }).secure_url, name: webCoverImage.name };
        } catch (error) {
          throw new Error(`Error uploading web image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })();

      uploadPromises.push(webImageUploadPromise);
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

          return { type: 'pdf', url: (result as { secure_url: string }).secure_url, name: pdfFile.name };
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

    // Parse requisitosDocumentacion (now JSON array)
    let requisitosDocumentacion: string[] = [];
    try { requisitosDocumentacion = JSON.parse(formData.get('requisitosDocumentacion') as string || '[]'); } catch { }

    const infoGeneral = formData.get('infoGeneral') as string;
    // Programa removed
    // Itinerario is now JSON
    let itinerario: any = undefined;
    try { itinerario = JSON.parse(formData.get('itinerario') as string); } catch { }
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

    // FAQ (JSON)
    let faq = null;
    try { faq = JSON.parse(formData.get('faq') as string || 'null'); } catch { }

    // Coordinador Foto
    const coordinadorFotoFile = formData.get('coordinadorFoto') as File | string;
    let coordinadorFotoUrl = (tourExistente as any).coordinadorFoto || null; // Utilizar foto existente por defecto

    if (typeof coordinadorFotoFile === 'string') {
      if (coordinadorFotoFile === '') {
        coordinadorFotoUrl = null; // Borrar foto si se envía string vacío
      } else {
        coordinadorFotoUrl = coordinadorFotoFile; // Actualizar URL si se envía string URL
      }
    }

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

    // Gallery Uploads (NUEVO)
    const galleryFiles = formData.getAll('galleryImages') as File[];
    const validGalleryFiles = galleryFiles.filter(file => file && file.size > 0);

    validGalleryFiles.forEach(file => {
      uploadPromises.push((async () => {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/tours/gallery',
                resource_type: 'image',
                transformation: [{ width: 1200, height: 800, crop: 'limit' }]
              },
              (error, result) => { if (error) reject(error); else resolve(result); }
            ).end(buffer);
          });
          return { type: 'gallery', url: (result as any).secure_url };
        } catch (e) { console.error(e); return { type: 'error' }; }
      })());
    });

    // Ejecutar todos los uploads en paralelo
    let coverImageUrl = tourExistente.coverImage;
    let coverImageName = tourExistente.coverImageName;
    let pdfFileUrl = tourExistente.pdfFile;
    let pdfFileName = tourExistente.pdfFileName;
    let finalCoordinadorFotoUrl = coordinadorFotoUrl;

    if (uploadPromises.length > 0) {
      try {
        const uploadResults = await Promise.all(uploadPromises);

        uploadResults.forEach((result: any) => {
          if (result.type === 'image') {
            coverImageUrl = result.url;
            coverImageName = result.name;
          } else if (result.type === 'webImage') {
            updateData.webCoverImage = result.url;
            updateData.webCoverImageName = result.name;
          } else if (result.type === 'pdf') {
            pdfFileUrl = result.url;
            pdfFileName = result.name;
          } else if (result.type === 'coordFoto') {
            finalCoordinadorFotoUrl = result.url;
          } else if (result.type === 'gallery') {
            galeria.push(result.url); // Append new gallery image URL
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

    // PREPARAR DATOS DE ACTUALIZACIÓN (Differential Update)
    // const updateData: any = {}; // Moved up
    if (formData.has('titulo')) updateData.titulo = titulo;
    if (formData.has('precioAdulto')) updateData.precioAdulto = parseFloat(precioAdulto);
    if (formData.has('precioNino')) updateData.precioNino = parseFloat(precioNino);

    // Always set cantidadAsientos because it's hardcoded logic for Bus? Or keep existing?
    // User cannot change it via UI anyway. Let's safe-keep it or update it if we want to enforce it.
    // However, if we do updateData.cantidadAsientos = 53, it's fine.
    updateData.cantidadAsientos = cantidadAsientos;

    if (formData.has('fechaViaje')) {
      updateData.fechaViaje = fechaViaje ? new Date(fechaViaje) : null;
    }
    if (formData.has('fechaFin')) {
      updateData.fechaFin = fechaFin ? new Date(fechaFin) : null;
    }

    if (formData.has('acc')) updateData.acc = acc && acc.trim() !== '' ? acc : null;

    // Costos
    if (formData.has('bus')) updateData.bus = bus && bus.trim() !== '' ? parseFloat(bus) : null;
    if (formData.has('pasti')) updateData.pasti = pasti && pasti.trim() !== '' ? parseFloat(pasti) : null;
    if (formData.has('parking')) updateData.parking = parking && parking.trim() !== '' ? parseFloat(parking) : null;
    if (formData.has('coordinatore1')) updateData.coordinatore1 = coordinatore1 && coordinatore1.trim() !== '' ? parseFloat(coordinatore1) : null;
    if (formData.has('coordinatore2')) updateData.coordinatore2 = coordinatore2 && coordinatore2.trim() !== '' ? parseFloat(coordinatore2) : null;
    if (formData.has('ztl')) updateData.ztl = ztl && ztl.trim() !== '' ? parseFloat(ztl) : null;
    if (formData.has('hotel')) updateData.hotel = hotel && hotel.trim() !== '' ? parseFloat(hotel) : null;
    if (formData.has('polizza')) updateData.polizza = polizza && polizza.trim() !== '' ? parseFloat(polizza) : null;
    if (formData.has('tkt')) updateData.tkt = tkt && tkt.trim() !== '' ? parseFloat(tkt) : null;
    if (formData.has('autoservicio')) updateData.autoservicio = autoservicio && autoservicio.trim() !== '' ? autoservicio : null;

    // Archivos (only if new files uploaded)
    if (coverImageUrl !== tourExistente.coverImage) {
      updateData.coverImage = coverImageUrl;
      updateData.coverImageName = coverImageName;
    }
    if (pdfFileUrl !== tourExistente.pdfFile) {
      updateData.pdfFile = pdfFileUrl;
      updateData.pdfFileName = pdfFileName;
    }

    if (formData.has('descripcion')) updateData.descripcion = descripcion && descripcion.trim() !== '' ? descripcion : null;
    if (formData.has('notas')) updateData.notas = notas && notas.trim() !== '' ? notas : null;
    if (formData.has('notasCoordinador')) updateData.notasCoordinador = notasCoordinador && notasCoordinador.trim() !== '' ? notasCoordinador : null;

    // --- WEB FIELDS ---
    if (formData.has('slug')) updateData.slug = slug && slug.trim() !== '' ? slug : null;
    if (formData.has('isPublic')) updateData.isPublic = isPublic;
    if (formData.has('subtitulo')) updateData.subtitulo = subtitulo || null;
    if (formData.has('duracionTexto')) updateData.duracionTexto = duracionTexto || null;
    if (formData.has('infoGeneral')) updateData.infoGeneral = infoGeneral || null;
    if (formData.has('mapaEmbed')) updateData.mapaEmbed = mapaEmbed || null;
    if (formData.has('coordinadorNombre')) updateData.coordinadorNombre = coordinadorNombre || null;
    if (formData.has('coordinadorDescripcion')) updateData.coordinadorDescripcion = coordinadorDescripcion || null;

    // JSON Fields
    // If formData.has('etiquetas') -> parse and set. Else ignore.
    if (formData.has('etiquetas')) updateData.etiquetas = etiquetas;
    if (formData.has('requisitosDocumentacion')) updateData.requisitosDocumentacion = requisitosDocumentacion;
    if (formData.has('itinerario')) updateData.itinerario = itinerario;
    if (formData.has('incluye')) updateData.incluye = incluye;
    if (formData.has('noIncluye')) updateData.noIncluye = noIncluye;
    if (formData.has('faq')) updateData.faq = faq ? faq : Prisma.JsonNull;

    // Coordinador Foto Logic
    // If finalCoordinadorFotoUrl is different or explicitly cleared?
    // Re-use logic: if results had 'coordFoto', use it.
    // If NOT in results, check formData string.
    // If form data HAS 'coordinadorFoto' string -> update.
    // If form data missing 'coordinadorFoto' -> ignore.
    const hasCoordFile = uploadPromises.some(p => (p as any).then && false); // Promises already awaited in 'results' but we lost strict typing map.
    // Better: check if finalCoordinadorFotoUrl changed from default
    // Or simpler:
    // We already calculated `finalCoordinadorFotoUrl`.
    // If `formData.has('coordinadorFoto')` OR `validGalleryFiles > 0` (no related)
    // Actually we need to check if we should update it.
    // Logic: if formData HAS 'coordinadorFoto' (string or file) -> update it.
    if (formData.has('coordinadorFoto')) {
      updateData.coordinadorFoto = finalCoordinadorFotoUrl;
    }

    // Galeria
    // If formData.has('galeria') OR new gallery images -> update
    const hasGalleryField = formData.has('galeria');
    const hasNewGalleryImages = validGalleryFiles.length > 0;
    if (hasGalleryField || hasNewGalleryImages) {
      updateData.galeria = galeria; // This variable already merged existing+new in previous logic? 
      // Wait, line 275 parsed 'galeria' from formData.
      // Line 360 pushed new results to it.
      // So `galeria` variable holds the Final Combined State IF `formData.get('galeria')` was provided.
      // But if `formData.get('galeria')` was MISSING, then `galeria` var is `[]` (line 274).
      // Then line 360 pushes new images.
      // So `galeria` = `[...new]`. Existing images LOST if 'galeria' param missing.

      // FIX:
      // If formData missing 'galeria', we must load current DB gallery to append.
      if (!hasGalleryField) {
        const currentDbGallery = (tourExistente.galeria as string[]) || [];
        updateData.galeria = [...currentDbGallery, ...galeria]; // galeria var only has new ones now
      } else {
        updateData.galeria = galeria; // galeria var has kept + new
      }
    }

    // Documento Viaggio
    // Same logic.
    if (formData.has('documentoViaggioExisting') || formData.has('documentoViaggio')) {
      if (documentoViaggioFinal !== null) {
        updateData.documentoViaggio = documentoViaggioFinal;
      } else {
        updateData.documentoViaggio = null;
      }
    }

    updateData.updatedAt = new Date();

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
