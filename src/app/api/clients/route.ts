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
    // fiscalCode, address, email y birthDate ahora son opcionales
    if (!firstName || !lastName || !phoneNumber) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (Nombre, Apellido y Teléfono son requeridos)' }, { status: 400 });
    }

    // document1 es opcional (como los demás documentos)

    // Verificar si ya existe un cliente activo con el mismo código fiscal (solo si se proporciona y no está vacío)
    const fiscalCodeTrimmed = fiscalCode?.trim() || '';
    if (fiscalCodeTrimmed !== '') {
      const existingClientByFiscal = await prisma.client.findFirst({
        where: { 
          fiscalCode: fiscalCodeTrimmed,
          isActive: true,
          NOT: { fiscalCode: '' } // Excluir strings vacíos
        }
      });

      if (existingClientByFiscal) {
        return NextResponse.json({ 
          error: 'Ya existe un cliente con este código fiscal',
          field: 'fiscalCode',
          details: `El código fiscal "${fiscalCodeTrimmed}" ya está registrado`
        }, { status: 400 });
      }
    }

    // Verificar si ya existe un cliente activo con el mismo email (solo si se proporciona y no está vacío)
    const emailTrimmed = email?.trim() || '';
    if (emailTrimmed !== '' && !emailTrimmed.startsWith('temp-email-')) {
      const existingClientByEmail = await prisma.client.findFirst({
        where: { 
          email: emailTrimmed,
          isActive: true,
          NOT: { email: { startsWith: 'temp-email-' } } // Excluir emails temporales
        }
      });

      if (existingClientByEmail) {
        return NextResponse.json({ 
          error: 'Ya existe un cliente con este email',
          field: 'email',
          details: `El email "${emailTrimmed}" ya está registrado`
        }, { status: 400 });
      }
    }

    // Verificar si ya existe un cliente activo con el mismo número de teléfono (siempre verificar porque es obligatorio)
    const phoneNumberTrimmed = phoneNumber?.trim() || '';
    if (phoneNumberTrimmed !== '') {
      const existingClientByPhone = await prisma.client.findFirst({
        where: { 
          phoneNumber: phoneNumberTrimmed,
          isActive: true,
          NOT: { phoneNumber: '' } // Excluir strings vacíos
        }
      });

      if (existingClientByPhone) {
        return NextResponse.json({ 
          error: 'Ya existe un cliente con este número de teléfono',
          field: 'phoneNumber',
          details: `El número de teléfono "${phoneNumberTrimmed}" ya está registrado`
        }, { status: 400 });
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
        
        // Detectar el tipo de archivo para usar el resource_type correcto
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
        const resourceType = isImage ? 'image' : 'raw'; // PDFs y otros archivos usan 'raw'
        
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'gibravotravel/clients/documents',
              resource_type: resourceType, // Usar 'raw' para PDFs, 'image' para imágenes
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
    // Nota: fiscalCode, address y email ahora son opcionales
    // Para email vacío, usar un valor único temporal para evitar conflictos con @unique
    // emailTrimmed ya está definido arriba en las validaciones
    const emailValue = emailTrimmed !== '' 
      ? emailTrimmed 
      : `temp-email-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${userId.substring(0, 8)}`;
    
    // Preparar datos para crear el cliente
    const clientData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fiscalCode: fiscalCode?.trim() || '',
      address: address?.trim() || '',
      email: emailValue,
      phoneNumber: phoneNumber.trim(),
      birthPlace: birthPlace?.trim() || '',
      birthDate: birthDate && birthDate.trim() !== '' ? new Date(birthDate) : new Date('1900-01-01'),
      ...documentData,
      createdBy: userId
    };

    const newClient = await prisma.client.create({
      data: clientData
    });

    return NextResponse.json({ 
      client: newClient,
      message: 'Cliente creato con successo!' 
    });

  } catch (error: any) {
    console.error('Error creating client:', error);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    console.error('Error message:', error.message);
    
    // Detectar errores de Prisma relacionados con constraints únicos
    if (error.code === 'P2002') {
      // Error de unique constraint en Prisma
      const target = error.meta?.target;
      
      console.error('P2002 error - Unique constraint violation on:', target);
      
      if (Array.isArray(target) && target.length > 0) {
        const field = target[0];
        
        // Mapear nombres de campos a mensajes más amigables
        const fieldMessages: Record<string, string> = {
          'email': 'Ya existe un cliente activo con este email. Por favor, verifica el email ingresado.',
          'fiscalCode': 'Ya existe un cliente activo con este código fiscal. Por favor, verifica el código fiscal ingresado.',
          'phoneNumber': 'Ya existe un cliente activo con este número de teléfono. Por favor, verifica el teléfono ingresado.',
        };
        
        const message = fieldMessages[field] || `Ya existe un cliente activo con este ${field}. Por favor, verifica el campo ${field}.`;
        
        return NextResponse.json({ 
          error: message,
          field: field,
          details: `El campo '${field}' ya está registrado en el sistema (cliente activo)`
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Ya existe un cliente activo con estos datos. Por favor, verifica la información ingresada.',
        details: 'Los datos ingresados ya están registrados en el sistema (cliente activo)'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message || 'Error desconocido al crear el cliente'
    }, { status: 500 });
  }
}
