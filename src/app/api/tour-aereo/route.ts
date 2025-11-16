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

    // Usar consulta SQL directa para evitar problemas con campos que pueden no existir
    // Esto es más tolerante a diferencias entre schema y BD
    let tours: any[];
    
    try {
      // Intentar con Prisma normal primero
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
      // Log detallado del error para debugging
      console.error('❌ Error en Prisma tour-aereo:', {
        message: prismaError?.message,
        code: prismaError?.code,
        meta: prismaError?.meta,
        stack: prismaError?.stack?.substring(0, 500)
      });
      
      // Si falla por campos faltantes, ejecutar migración usando el mismo patrón que migrate-production-fast.js
      const isSchemaError = prismaError?.message?.includes('Unknown field') || 
                           prismaError?.message?.includes('documentoViaggioName') || 
                           prismaError?.code === 'P2022' ||
                           prismaError?.message?.includes('does not exist') ||
                           prismaError?.message?.includes('column');
      
      if (isSchemaError) {
        console.log('⚠️ Error de schema detectado, ejecutando migración rápida...');
        
        try {
          // Usar la misma lógica que migrate-production-fast.js
          const QUERY_TIMEOUT = 5000; // 5 segundos
          
          async function quickAddColumn(tableName: string, columnName: string, columnType: string = 'TEXT'): Promise<boolean> {
            try {
              // Verificar si existe con timeout corto
              const checkPromise = prisma.$queryRawUnsafe(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public'
                AND table_name = '${tableName}'
                AND column_name = '${columnName}'
                LIMIT 1
              `);
              
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), QUERY_TIMEOUT)
              );
              
              const result = await Promise.race([checkPromise, timeoutPromise]) as any[];
              
              if (Array.isArray(result) && result.length > 0) {
                console.log(`✓ Columna ${tableName}.${columnName} ya existe`);
                return false; // Ya existe
              }

              // Agregar columna con timeout
              console.log(`📦 Agregando columna ${tableName}.${columnName}...`);
              const addPromise = prisma.$executeRawUnsafe(
                `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" ${columnType}`
              );
              
              await Promise.race([addPromise, timeoutPromise]);
              console.log(`✅ Columna ${tableName}.${columnName} agregada exitosamente`);
              return true; // Se agregó
            } catch (error: any) {
              if (error.message === 'Timeout') {
                console.log(`⏱️  Timeout en ${tableName}.${columnName}, continuando...`);
              } else {
                console.log(`⚠️  ${tableName}.${columnName}: ${error.message}`);
              }
              return false;
            }
          }
          
          // Agregar todas las columnas necesarias (mismo patrón que migrate-production-fast.js)
          const migrations = [
            { table: 'tour_aereo', column: 'documentoViaggioName', type: 'TEXT' },
            { table: 'tour_aereo', column: 'documentoViaggioName_old', type: 'TEXT' },
            { table: 'tour_aereo', column: 'documentoViaggio_old', type: 'TEXT' },
          ];
          
          console.log('🔄 Ejecutando migraciones...');
          for (const migration of migrations) {
            await quickAddColumn(migration.table, migration.column, migration.type);
          }
          
          console.log('✅ Migración rápida completada, reintentando consulta...');
          
          // Esperar un momento para que la transacción se complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Reintentar con Prisma después de agregar las columnas
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
          console.log('✅ Consulta exitosa después de migración');
        } catch (migrationError: any) {
          console.error('❌ Error en migración lazy:', {
            message: migrationError?.message,
            code: migrationError?.code,
            stack: migrationError?.stack?.substring(0, 500)
          });
          // Lanzar el error de migración para que se capture en el catch general
          throw migrationError;
        }
      } else {
        // Si no es un error de schema, lanzar el error original
        throw prismaError;
      }
    }

    // Normalizar documentoViaggio: convertir formato legacy (string) a array
    const normalizedTours = tours.map(tour => {
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
      return tourAny;
    });

    return NextResponse.json({ tours: normalizedTours });
  } catch (error: any) {
    console.error('❌ Error fetching tours aereo:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.substring(0, 1000),
      name: error?.name
    });
    
    // Si es un error de Prisma relacionado con tipos de datos, intentar manejar
    if (error?.code === 'P2022' || error?.message?.includes('column') || error?.message?.includes('does not exist') || error?.message?.includes('Unknown field')) {
      console.error('⚠️ Posible problema de schema: campo faltante o tipo incorrecto');
      console.error('⚠️ La migración lazy debería haber manejado esto. Revisar logs anteriores.');
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error?.message : 'Revisar logs del servidor para más detalles'
      },
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

    // Manejar múltiples documentos de viaje
    let documentoViaggioArray: Array<{ url: string; name: string }> = [];
    
    // Procesar archivos (puede ser uno o múltiples)
    const documentoViaggioFiles = formData.getAll('documentoViaggio') as File[];
    const validFiles = documentoViaggioFiles.filter(file => file && file.size > 0);

    // También verificar el formato antiguo (un solo archivo)
    if (validFiles.length === 0 && documentoViaggioFile && documentoViaggioFile.size > 0) {
      validFiles.push(documentoViaggioFile);
    }

    if (validFiles.length > 0) {
      // Validar máximo de 5 archivos
      if (validFiles.length > 5) {
        return NextResponse.json(
          { error: 'Massimo 5 file consentiti per Documento Viaggio' },
          { status: 400 }
        );
      }

      // Subir archivos a Cloudinary
      for (const file of validFiles) {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const result = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/tour_aereo/documenti',
                resource_type: 'auto'
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

    const documentoViaggioFinal = documentoViaggioArray.length > 0 
      ? (documentoViaggioArray as any) 
      : null;
 
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

