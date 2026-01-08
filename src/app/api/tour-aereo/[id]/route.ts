import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '538724966551851',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
});

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

    // Obtener tour con todas las relaciones necesarias
    const tour = await prisma.tourAereo.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        stanze: {
          include: {
            asignaciones: {
              include: {
                ventaTourAereo: true
              }
            }
          }
        },
        ventas: {
          include: {
            cuotas: true,
            creator: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    // Normalizar documentoViaggio (Legacy support)
    const tourAny = tour as any;
    if (tourAny.documentoViaggio) {
      if (typeof tourAny.documentoViaggio === 'string') {
        tourAny.documentoViaggio = [{
          url: tourAny.documentoViaggio,
          name: tourAny.documentoViaggioName || 'documento'
        }];
      } else if (Array.isArray(tourAny.documentoViaggio)) {
        // ok
      } else if (typeof tourAny.documentoViaggio === 'object') {
        tourAny.documentoViaggio = [tourAny.documentoViaggio];
      }
    }

    return NextResponse.json({ tour: tourAny });

  } catch (error) {
    console.error('Error fetching tour aereo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar un tour aéreo (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    // Verificar existencia
    const tour = await prisma.tourAereo.findUnique({
      where: { id },
      include: { ventas: true }
    });

    if (!tour) return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });

    // Verificar ventas activas
    if (tour.ventas.length > 0) {
      return NextResponse.json({ error: 'No se puede eliminar un tour con ventas activas' }, { status: 400 });
    }

    // Soft delete
    await prisma.tourAereo.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Tour eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting tour aereo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

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

    // Verificar existencia
    const currentTour = await prisma.tourAereo.findUnique({
      where: { id },
      select: {
        coverImage: true,
        pdfFile: true,
        coordinadorFoto: true,
        galeria: true, // Existing gallery URLs
      }
    });

    if (!currentTour) {
      return NextResponse.json({ error: 'Tour no encontrado' }, { status: 404 });
    }

    const formData = await request.formData();

    // Archivos
    const coverImage = formData.get('coverImage') as File | null;
    const pdfFile = formData.get('pdfFile') as File | null;
    const coordinadorFoto = formData.get('coordinadorFoto') as File | string | null;
    const webCoverImage = formData.get('webCoverImage') as File | null;
    // New: multiple gallery images
    const newGalleryImages = formData.getAll('galleryImages') as File[]; // New files

    // INIT PARALLEL UPLOADS
    const uploadPromises: Promise<any>[] = [];

    // 1. Cover Image
    if (coverImage && coverImage.size > 0) {
      uploadPromises.push((async () => {
        const bytes = await coverImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const res: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: 'gibravotravel/tour_aereo/covers', resource_type: 'image' },
            (err, res) => { if (err) reject(err); else resolve(res); }).end(buffer);
        });
        return { type: 'cover', url: res.secure_url, name: coverImage.name };
      })());
    }

    // 1.5 Web Cover Image (New)
    if (webCoverImage && webCoverImage.size > 0) {
      uploadPromises.push((async () => {
        const bytes = await webCoverImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const res: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: 'gibravotravel/tour_aereo/web_covers', resource_type: 'image' },
            (err, res) => { if (err) reject(err); else resolve(res); }).end(buffer);
        });
        return { type: 'webCover', url: res.secure_url, name: webCoverImage.name };
      })());
    }

    // ... (rest of uploads)

    // ...

    // 1.5 Web Cover Image Result
    // ...

    // 2. PDF
    if (pdfFile && pdfFile.size > 0) {
      uploadPromises.push((async () => {
        const bytes = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const res: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: 'gibravotravel/tour_aereo/pdfs', resource_type: 'raw' },
            (err, res) => { if (err) reject(err); else resolve(res); }).end(buffer);
        });
        return { type: 'pdf', url: res.secure_url, name: pdfFile.name };
      })());
    }

    // 3. Coordinator Photo
    // Check if it's a new file (File object)
    if (coordinadorFoto && typeof coordinadorFoto === 'object' && coordinadorFoto.size > 0) {
      uploadPromises.push((async () => {
        const bytes = await coordinadorFoto.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const res: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: 'gibravotravel/tour_aereo/coordinators', resource_type: 'image' },
            (err, res) => { if (err) reject(err); else resolve(res); }).end(buffer);
        });
        return { type: 'coordinator', url: res.secure_url };
      })());
    }

    // 4. Gallery Images (Multiple)
    if (newGalleryImages.length > 0) {
      newGalleryImages.forEach((file) => {
        if (file.size > 0) {
          uploadPromises.push((async () => {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const res: any = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream({ folder: 'gibravotravel/tour_aereo/gallery', resource_type: 'image' },
                (err, res) => { if (err) reject(err); else resolve(res); }).end(buffer);
            });
            return { type: 'gallery', url: res.secure_url };
          })());
        }
      });
    }

    // WAIT FOR ALL
    const results = await Promise.all(uploadPromises);


    // BUILD DYNAMIC UPDATE OBJECT
    const dataToUpdate: any = {};

    // --- INTERNAL FIELDS (Update only if present in formData) ---
    if (formData.has('titulo')) dataToUpdate.titulo = formData.get('titulo') as string;
    if (formData.has('precioAdulto')) dataToUpdate.precioAdulto = parseFloat(formData.get('precioAdulto') as string) || 0;
    if (formData.has('precioNino')) dataToUpdate.precioNino = parseFloat(formData.get('precioNino') as string) || 0;

    if (formData.has('fechaViaje')) {
      const fv = formData.get('fechaViaje') as string;
      if (fv) {
        const d = new Date(fv);
        dataToUpdate.fechaViaje = isNaN(d.getTime()) ? null : d;
      } else {
        // If empty string sent explicitly, user might want to clear it? 
        // Usually 'internal edit' sends the current value. 
        // If web edit doesn't send it, it won't be in formData.
        // If we clear it, we send empty string.
        // Safe assumption: empty string = null. Missing key = ignore.
        dataToUpdate.fechaViaje = null;
      }
    }

    if (formData.has('fechaFin')) {
      const ff = formData.get('fechaFin') as string;
      if (ff) {
        const d = new Date(ff);
        dataToUpdate.fechaFin = isNaN(d.getTime()) ? null : d;
      } else {
        dataToUpdate.fechaFin = null;
      }
    }

    if (formData.has('meta')) dataToUpdate.meta = parseInt(formData.get('meta') as string) || 0;
    if (formData.has('acc')) dataToUpdate.acc = formData.get('acc') as string;
    if (formData.has('guidaLocale')) dataToUpdate.guidaLocale = parseFloat(formData.get('guidaLocale') as string) || 0;
    if (formData.has('coordinatore')) dataToUpdate.coordinatore = parseFloat(formData.get('coordinatore') as string) || 0;
    if (formData.has('transporte')) dataToUpdate.transporte = parseFloat(formData.get('transporte') as string) || 0;
    if (formData.has('hotel')) dataToUpdate.hotel = parseFloat(formData.get('hotel') as string) || 0;
    if (formData.has('notas')) dataToUpdate.notas = formData.get('notas') as string;
    if (formData.has('notasCoordinador')) {
      const nc = formData.get('notasCoordinador') as string;
      dataToUpdate.notasCoordinador = nc && nc.trim() !== '' ? nc : null;
    }
    if (formData.has('feeAgv')) dataToUpdate.feeAgv = parseFloat(formData.get('feeAgv') as string) || 0;
    if (formData.has('descripcion')) dataToUpdate.descripcion = formData.get('descripcion') as string;

    // --- WEB FIELDS (Update only if present) ---
    if (formData.has('slug')) {
      const sl = formData.get('slug') as string;
      dataToUpdate.slug = sl && sl.trim() !== '' ? sl : null;
    }

    if (formData.has('isPublic')) dataToUpdate.isPublic = formData.get('isPublic') === 'true';

    if (formData.has('subtitulo')) {
      const sub = formData.get('subtitulo') as string;
      dataToUpdate.subtitulo = sub || null;
    }

    if (formData.has('duracionTexto')) {
      const dt = formData.get('duracionTexto') as string;
      dataToUpdate.duracionTexto = dt || null;
    }

    if (formData.has('infoGeneral')) {
      const ig = formData.get('infoGeneral') as string;
      dataToUpdate.infoGeneral = ig || null;
    }

    if (formData.has('mapaEmbed')) {
      const me = formData.get('mapaEmbed') as string;
      dataToUpdate.mapaEmbed = me || null;
    }

    if (formData.has('coordinadorNombre')) {
      const cn = formData.get('coordinadorNombre') as string;
      dataToUpdate.coordinadorNombre = cn || null;
    }

    if (formData.has('coordinadorDescripcion')) {
      const cd = formData.get('coordinadorDescripcion') as string;
      dataToUpdate.coordinadorDescripcion = cd || null;
    }

    // JSON Fields
    if (formData.has('requisitosDocumentacion')) {
      try { dataToUpdate.requisitosDocumentacion = JSON.parse(formData.get('requisitosDocumentacion') as string || '[]'); } catch { }
    }
    if (formData.has('itinerario')) {
      try { dataToUpdate.itinerario = JSON.parse(formData.get('itinerario') as string); } catch { }
    }
    if (formData.has('incluye')) {
      try { dataToUpdate.incluye = JSON.parse(formData.get('incluye') as string || '[]'); } catch { }
    }
    if (formData.has('noIncluye')) {
      try { dataToUpdate.noIncluye = JSON.parse(formData.get('noIncluye') as string || '[]'); } catch { }
    }
    if (formData.has('etiquetas')) {
      try { dataToUpdate.etiquetas = JSON.parse(formData.get('etiquetas') as string || '[]'); } catch { }
    }
    if (formData.has('faq')) {
      try { dataToUpdate.faq = JSON.parse(formData.get('faq') as string || '[]'); } catch { }
    }


    // --- FILES (Only update if uploaded OR explicit clear) ---
    // 1. Cover Image
    const coverResult = results.find(r => r.type === 'cover');
    if (coverResult) {
      dataToUpdate.coverImage = coverResult.url;
      dataToUpdate.coverImageName = coverResult.name;
    }

    // 1.5 Web Cover Image
    const webCoverUpdateResult = results.find(r => r.type === 'webCover');
    if (webCoverUpdateResult) {
      dataToUpdate.webCoverImage = webCoverUpdateResult.url;
      dataToUpdate.webCoverImageName = webCoverUpdateResult.name;
    }

    // 2. PDF
    const pdfResult = results.find(r => r.type === 'pdf');
    if (pdfResult) {
      dataToUpdate.pdfFile = pdfResult.url;
      dataToUpdate.pdfFileName = pdfResult.name;
    }

    // 3. Coordinator Photo
    // Case A: New file uploaded -> Use it
    const coordResult = results.find(r => r.type === 'coordinator');
    if (coordResult) {
      dataToUpdate.coordinadorFoto = coordResult.url;
    } else {
      // Case B: No new file. Check if we should clear it.
      // If formData has 'coordinadorFoto' and it's an empty string, user cleared it.
      // If formData doesn't have it (e.g. Internal Edit), ignore it.
      if (formData.has('coordinadorFoto')) {
        const cfVal = formData.get('coordinadorFoto');
        if (typeof cfVal === 'string' && cfVal === '') {
          dataToUpdate.coordinadorFoto = null;
        }
      }
    }

    // 4. Gallery (Merge with existing)
    // Only touch gallery if we have new images OR we have a 'galeria' JSON (meaning deletion/reorder happened)
    // If Internal Edit -> no 'galeria' field, and no 'galleryImages' -> Do Nothing.
    const hasGalleryField = formData.has('galeria');
    const hasNewGalleryImages = newGalleryImages.length > 0;

    if (hasGalleryField || hasNewGalleryImages) {
      // Start with kept images (if field sent) OR empty (if field sent as empty) OR current DB (if field NOT sent?? No, if field not sent we shouldn't be here unless new images).
      // Actually:
      // Internal Edit: hasGalleryField=false. hasNewGalleryImages=false. -> Block skipped. Safe.
      // Web Edit: hasGalleryField=true (kept images). hasNewGalleryImages=maybe. -> Block entered.

      // Get kept images from FormData (if present)
      let keptImages: string[] = [];
      if (hasGalleryField) {
        try {
          const s = formData.get('galeria');
          if (typeof s === 'string') keptImages = JSON.parse(s);
        } catch { }
      } else {
        // If we are here because of new images but no 'galeria' field provided... 
        // This is edge case. Assume we append to CURRENT DB gallery if 'galeria' param is missing?
        // Or better: Web Edit always sends 'galeria' JSON.
        // If we rely on currentTour:
        keptImages = (currentTour.galeria as string[]) || [];
      }

      const newUrls = results.filter(r => r.type === 'gallery').map(r => r.url);
      dataToUpdate.galeria = [...keptImages, ...newUrls];
    }


    // UPDATE DB
    const tour = await prisma.tourAereo.update({
      where: { id },
      data: dataToUpdate,
      include: {
        ventas: true,
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
