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

    // Si es USER, solo mostrar sus propios tours
    if (userOnly && user.role === 'USER') {
      whereCondition = {
        ...whereCondition,
        createdBy: userId
      };
    }

    // Si userIdParam está presente, solo mostrar tours que tienen ventas de ese usuario
    let useSqlDirect = !!userIdParam;

    // Usar consulta SQL directa para evitar problemas con campos que pueden no existir
    let tours: any[] = [];

    if (!useSqlDirect) {
      try {
        tours = await prisma.tourAereo.findMany({
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
              where: userIdParam ? { createdBy: userIdParam } : undefined,
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
          orderBy: [
            {
              fechaViaje: 'asc',
            },
            {
              createdAt: 'desc',
            },
          ],
        });
      } catch (prismaError: any) {
        console.error('❌ Error en Prisma tour-aereo:', {
          message: prismaError?.message,
          code: prismaError?.code
        });

        const isSchemaError = prismaError?.message?.includes('Unknown field') ||
          prismaError?.message?.includes('documentoViaggioName') ||
          prismaError?.code?.startsWith('P');

        if (isSchemaError) {
          useSqlDirect = true;
        } else {
          throw prismaError;
        }
      }
    }

    if (useSqlDirect) {
      try {
        try {
          await prisma.$executeRawUnsafe(`
              ALTER TABLE "tour_aereo" 
              ADD COLUMN IF NOT EXISTS "documentoViaggioName" TEXT,
              ADD COLUMN IF NOT EXISTS "documentoViaggioName_old" TEXT,
              ADD COLUMN IF NOT EXISTS "documentoViaggio_old" TEXT
            `);
        } catch (alterError: any) {
        }

        let whereClause = 'WHERE t."isActive" = true';
        const params: any[] = [];
        let paramIndex = 1;

        if (fechaDesde && fechaHasta) {
          whereClause += ` AND t."fechaViaje" >= $${paramIndex} AND t."fechaViaje" <= $${paramIndex + 1}`;
          params.push(new Date(fechaDesde), new Date(fechaHasta));
          paramIndex += 2;
        }

        if (userOnly && user.role === 'USER') {
          whereClause += ` AND t."createdBy" = $${paramIndex}`;
          params.push(userId);
          paramIndex++;
        }

        if (userIdParam) {
          whereClause += ` AND EXISTS (
              SELECT 1 FROM "ventas_tour_aereo" v 
              WHERE v."tourAereoId" = t."id" 
              AND v."createdBy" = $${paramIndex}
            )`;
          params.push(userIdParam);
          paramIndex++;
        }

        const sqlQuery = `
            SELECT 
              t.*,
              CASE 
                WHEN pg_typeof(t."documentoViaggio") = 'jsonb'::regtype THEN t."documentoViaggio"::text
                WHEN pg_typeof(t."documentoViaggio") = 'text'::regtype THEN t."documentoViaggio"::text
                ELSE NULL
              END as "documentoViaggio",
              json_build_object(
                'firstName', u."firstName",
                'lastName', u."lastName",
                'email', u."email"
              ) as creator
            FROM "tour_aereo" t
            LEFT JOIN "users" u ON t."createdBy" = u."clerkId"
            ${whereClause}
            ORDER BY t."fechaViaje" ASC NULLS LAST, t."createdAt" DESC
          `;

        const rawTours = await prisma.$queryRawUnsafe(sqlQuery, ...params) as any[];

        const tourIds = rawTours.map((t: any) => t.id);
        let ventasMap: any = {};

        if (tourIds.length > 0) {
          try {
            const ventas = await prisma.ventaTourAereo.findMany({
              where: {
                tourAereoId: { in: tourIds },
                ...(userIdParam ? { createdBy: userIdParam } : {})
              },
              select: {
                id: true,
                tourAereoId: true,
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
            });

            ventasMap = ventas.reduce((acc: any, venta: any) => {
              if (!acc[venta.tourAereoId]) acc[venta.tourAereoId] = [];
              acc[venta.tourAereoId].push(venta);
              return acc;
            }, {});
          } catch (e) {
          }
        }

        tours = rawTours.map((tour: any) => ({
          ...tour,
          creator: tour.creator || { firstName: null, lastName: null, email: '' },
          ventas: ventasMap[tour.id] || [],
          _count: { ventas: ventasMap[tour.id]?.length || 0 }
        }));

      } catch (sqlError: any) {
        console.error('❌ Error en SQL directo:', sqlError);
        throw sqlError;
      }
    }

    const normalizedTours = tours.map(tour => {
      const tourAny = tour as any;
      if (tourAny.documentoViaggio) {
        if (typeof tourAny.documentoViaggio === 'string') {
          try {
            const parsed = JSON.parse(tourAny.documentoViaggio);
            if (Array.isArray(parsed)) {
              tourAny.documentoViaggio = parsed;
            } else {
              tourAny.documentoViaggio = [parsed];
            }
          } catch (e) {
            tourAny.documentoViaggio = [{
              url: tourAny.documentoViaggio,
              name: tourAny.documentoViaggioName || 'documento'
            }];
          }
          delete tourAny.documentoViaggioName;
        } else if (typeof tourAny.documentoViaggio === 'object' && !Array.isArray(tourAny.documentoViaggio)) {
          tourAny.documentoViaggio = [tourAny.documentoViaggio];
        }
      }
      return tourAny;
    });

    return NextResponse.json({ tours: normalizedTours });
  } catch (error: any) {
    console.error('❌ Error fetching tours aereo:', error);
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

    // Validar campos requeridos
    if (!titulo || !precioAdulto) {
      return NextResponse.json(
        { error: 'Título y precio adulto son requeridos' },
        { status: 400 }
      );
    }

    // --- WEB FIELDS ---
    const slug = formData.get('slug') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const subtitulo = formData.get('subtitulo') as string;
    const duracionTexto = formData.get('duracionTexto') as string;
    // Removed: nivelDificultad, rangoEdad, minGrupo, maxGrupo, tipoAlojamiento

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

    // FAQ (JSON)
    let faq = null;
    try { faq = JSON.parse(formData.get('faq') as string || 'null'); } catch { }

    // Coordinador Foto
    const coordinadorFotoFile = formData.get('coordinadorFoto') as File | string;
    let coordinadorFotoUrl = null;
    if (typeof coordinadorFotoFile === 'string') {
      coordinadorFotoUrl = coordinadorFotoFile;
    }

    // Procesar fecha de viaje
    let fechaViajeDate = null;
    if (fechaViaje) {
      try {
        fechaViajeDate = new Date(fechaViaje);
        if (isNaN(fechaViajeDate.getTime())) fechaViajeDate = null;
      } catch (error) { fechaViajeDate = null; }
    }

    // Procesar fecha de fin
    let fechaFinDate = null;
    if (fechaFin) {
      try {
        fechaFinDate = new Date(fechaFin);
        if (isNaN(fechaFinDate.getTime())) fechaFinDate = null;
      } catch (error) { fechaFinDate = null; }
    }

    // Prepare Upload Promises
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
        return { type: 'image', url: res.secure_url, name: coverImage.name };
      })());
    }

    // 2. PDF
    if (pdfFile && pdfFile.size > 0) {
      uploadPromises.push((async () => {
        const bytes = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const res: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: 'gibravotravel/tour_aereo/pdf', resource_type: 'raw' },
            (err, res) => { if (err) reject(err); else resolve(res); }).end(buffer);
        });
        return { type: 'pdf', url: res.secure_url, name: pdfFile.name };
      })());
    }

    // 3. Coordinator Photo
    if (coordinadorFotoFile instanceof File && coordinadorFotoFile.size > 0) {
      uploadPromises.push((async () => {
        const bytes = await coordinadorFotoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const res: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: 'gibravotravel/coordinadores', resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
            (err, res) => { if (err) reject(err); else resolve(res); }).end(buffer);
        });
        return { type: 'coordFoto', url: res.secure_url };
      })());
    }

    // 4. Documento Viaggio Files (Max 5)
    // Extract files from formData
    const documentoViaggioFiles = formData.getAll('documentoViaggio') as File[];
    const validDocFiles = documentoViaggioFiles.filter(file => file && file.size > 0);

    // Also check single file input fallback
    const singleDocFile = formData.get('documentoViaggio') as File | null;
    if (validDocFiles.length === 0 && singleDocFile && singleDocFile.size > 0) {
      validDocFiles.push(singleDocFile);
    }

    if (validDocFiles.length > 5) {
      return NextResponse.json({ error: 'Massimo 5 file consentiti per Documento Viaggio' }, { status: 400 });
    }

    validDocFiles.forEach(file => {
      uploadPromises.push((async () => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
        const resourceType = isImage ? 'image' : 'raw';

        const res: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: 'gibravotravel/tour_aereo/documenti', resource_type: resourceType },
            (err, res) => { if (err) reject(err); else resolve(res); }).end(buffer);
        });
        return { type: 'doc', url: res.secure_url, name: file.name };
      })());
    });

    // Execute all uploads
    let coverImageUrl: string | null = null;
    let coverImageName: string | null = null;
    let pdfFileUrl: string | null = null;
    let pdfFileName: string | null = null;
    let finalCoordinadorFotoUrl: string | null = coordinadorFotoUrl;
    let documentoViaggioArray: Array<{ url: string; name: string }> = [];

    if (uploadPromises.length > 0) {
      try {
        const results = await Promise.all(uploadPromises);
        results.forEach((res: any) => {
          if (res.type === 'image') { coverImageUrl = res.url; coverImageName = res.name; }
          else if (res.type === 'pdf') { pdfFileUrl = res.url; pdfFileName = res.name; }
          else if (res.type === 'coordFoto') { finalCoordinadorFotoUrl = res.url; }
          else if (res.type === 'doc') { documentoViaggioArray.push({ url: res.url, name: res.name }); }
        });
      } catch (e) {
        console.error('Error uploading files', e);
        // Non-blocking? Or throw? better throw/return error
        return NextResponse.json({ error: 'Error subiendo archivos' }, { status: 500 });
      }
    }

    const documentoViaggioFinal = documentoViaggioArray.length > 0 ? documentoViaggioArray : null;

    // Crear el tour aéreo en la base de datos
    const createData: any = {
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

      // Web Fields
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
      incluye,
      noIncluye,
      coordinadorNombre,
      coordinadorDescripcion,
      coordinadorFoto: finalCoordinadorFotoUrl,
      faq: faq ? (faq as any) : undefined,

      createdBy: userId,
    };

    // Solo agregar documentoViaggio si hay datos
    if (documentoViaggioFinal !== null) {
      createData.documentoViaggio = documentoViaggioFinal;
    }

    const tour = await prisma.tourAereo.create({
      data: createData,
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
