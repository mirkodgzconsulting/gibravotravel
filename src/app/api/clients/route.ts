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

// GET - Listar todos los clientes activos
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userOnly = searchParams.get('userOnly') === 'true';

    // Buscar el usuario en la base de datos para verificar su rol
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let whereCondition: any = { isActive: true };

    // Si se solicita userOnly, mostrar solo los clientes creados por este usuario
    if (userOnly) {
      whereCondition = {
        ...whereCondition,
        createdBy: userId
      };
    }

    const clients = await prisma.client.findMany({
      where: whereCondition,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fiscalCode: true,
        address: true,
        email: true,
        phoneNumber: true,
        birthPlace: true,
        birthDate: true,
        document1: true,
        document1Name: true,
        document2: true,
        document2Name: true,
        document3: true,
        document3Name: true,
        document4: true,
        document4Name: true,
        isActive: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Obtener información de los creadores
    const creatorIds = [...new Set(clients.map(c => c.createdBy))];
    const creators = await prisma.user.findMany({
      where: {
        clerkId: {
          in: creatorIds,
        },
      },
      select: {
        clerkId: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Combinar datos
    const clientsWithCreators = clients.map(client => ({
      ...client,
      creator: creators.find(c => c.clerkId === client.createdBy) || {
        firstName: null,
        lastName: null,
        email: 'Usuario no encontrado',
      },
    }));

    return NextResponse.json({ clients: clientsWithCreators });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const fiscalCode = formData.get('fiscalCode') as string;
    const address = formData.get('address') as string;
    const email = formData.get('email') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const birthPlace = formData.get('birthPlace') as string;
    const birthDate = formData.get('birthDate') as string;
    
    // Obtener archivos
    const document1 = formData.get('document1') as File | null;
    const document2 = formData.get('document2') as File | null;
    const document3 = formData.get('document3') as File | null;
    const document4 = formData.get('document4') as File | null;

    // Validaciones - Solo firstName, lastName y phoneNumber son obligatorios
    // fiscalCode, address y email ahora son opcionales
    if (!firstName || !lastName || !phoneNumber) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (Nombre, Apellido y Teléfono son requeridos)' }, { status: 400 });
    }

    // document1 es opcional (como los demás documentos)

    // Verificar si ya existe un cliente con el mismo código fiscal (solo si se proporciona)
    if (fiscalCode && fiscalCode.trim() !== '') {
      const existingClientByFiscal = await prisma.client.findFirst({
        where: { fiscalCode: fiscalCode.trim() }
      });

      if (existingClientByFiscal) {
        return NextResponse.json({ error: 'Ya existe un cliente con este código fiscal' }, { status: 400 });
      }
    }

    // Verificar si ya existe un cliente con el mismo email (solo si se proporciona)
    if (email && email.trim() !== '') {
      const existingClientByEmail = await prisma.client.findFirst({
        where: { email: email.trim() }
      });

      if (existingClientByEmail) {
        return NextResponse.json({ error: 'Ya existe un cliente con este email' }, { status: 400 });
      }
    }

    // Validar tamaños de archivos (10MB máximo por archivo)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const files = [document1, document2, document3, document4].filter(f => f && f.size > 0);
    
    for (const file of files) {
      if (file && file.size > maxFileSize) {
        return NextResponse.json({ 
          error: `El archivo ${file.name} es demasiado grande. Máximo 10MB por archivo.` 
        }, { status: 400 });
      }
    }

    // Subir archivos a Cloudinary en paralelo
    const uploadPromises = [];
    const documentData: {
      document1?: string;
      document1Name?: string;
      document2?: string;
      document2Name?: string;
      document3?: string;
      document3Name?: string;
      document4?: string;
      document4Name?: string;
    } = {};

    // Función helper para subir archivo
    const uploadFile = async (file: File, index: number) => {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'gibravotravel/clients/documents',
              resource_type: 'auto', // Permite imágenes y PDFs
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        return {
          index,
          url: result.secure_url,
          name: file.name
        };
      } catch (error) {
        throw new Error(`Error subiendo archivo ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    // Subir todos los archivos en paralelo
    if (document1 && document1.size > 0) uploadPromises.push(uploadFile(document1, 1));
    if (document2 && document2.size > 0) uploadPromises.push(uploadFile(document2, 2));
    if (document3 && document3.size > 0) uploadPromises.push(uploadFile(document3, 3));
    if (document4 && document4.size > 0) uploadPromises.push(uploadFile(document4, 4));

    try {
      const uploadResults = await Promise.all(uploadPromises);
      
      uploadResults.forEach(result => {
        if (result.index === 1) {
          documentData.document1 = result.url;
          documentData.document1Name = result.name;
        } else if (result.index === 2) {
          documentData.document2 = result.url;
          documentData.document2Name = result.name;
        } else if (result.index === 3) {
          documentData.document3 = result.url;
          documentData.document3Name = result.name;
        } else if (result.index === 4) {
          documentData.document4 = result.url;
          documentData.document4Name = result.name;
        }
      });
    } catch (uploadError) {
      return NextResponse.json({ 
        error: 'Error subiendo archivos a Cloudinary',
        details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Crear el cliente
    // Nota: fiscalCode, address y email ahora son opcionales, usar strings vacíos si no se proporcionan
    const newClient = await prisma.client.create({
      data: {
        firstName,
        lastName,
        fiscalCode: fiscalCode?.trim() || '',
        address: address?.trim() || '',
        email: email?.trim() || '',
        phoneNumber,
        birthPlace: birthPlace || '',
        birthDate: birthDate ? new Date(birthDate) : new Date(),
        ...documentData,
        createdBy: userId
      }
    });

    return NextResponse.json({ 
      client: newClient,
      message: 'Cliente creato con successo!' 
    });

  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
