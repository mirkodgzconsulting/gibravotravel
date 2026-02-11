import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';
import type { UploadApiResponse } from 'cloudinary';
import { parseUploadResult } from '@/lib/biglietteria/parsers';
import type { Prisma } from '@prisma/client';

// Configuración robusta de Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
} else if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
} else {
  console.warn('⚠️ Cloudinary no está configurado correctamente. Faltan variables de entorno.');
}

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

    let whereCondition: Prisma.ClientWhereInput = { isActive: true };

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

// Helper para subir archivos de forma segura
const uploadSafe = async (file: File | null): Promise<{ url: string | null, name: string | null }> => {
  if (!file || file.size === 0) return { url: null, name: null };
  
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
    const resourceType = isImage ? 'image' : 'raw'; 

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'gibravotravel/clients/documents',
          resource_type: resourceType,
        },
        parseUploadResult(resolve, reject)
      );

      // Manejar errores del stream directamente
      uploadStream.on('error', (error) => {
        console.error(`Stream error uploading ${file.name}:`, error);
        reject(error);
      });

      uploadStream.end(buffer);
    });

    return { url: result.secure_url, name: file.name };
  } catch (error: unknown) {
    const err = error as { http_code?: number; message?: string };
    console.error(`Error uploading file ${file.name}:`, err);
    // Verificar si es error de credenciales
    if (err?.http_code === 401 || err?.message?.includes('disabled')) {
      console.error('CLOUDINARY AUTH ERROR: Verifique las variables de entorno CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET');
    }
    // Retornamos null pero NO lanzamos error para no abortar todo el proceso
    return { url: null, name: null };
  }
};

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

    // Validaciones
    if (!firstName || !lastName || !phoneNumber) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (Nombre, Apellido y Teléfono son requeridos)' }, { status: 400 });
    }

    // Checking duplicates...
    const fiscalCodeTrimmed = fiscalCode?.trim() || '';
    if (fiscalCodeTrimmed !== '') {
      const existingClientByFiscal = await prisma.client.findFirst({
        where: {
          fiscalCode: fiscalCodeTrimmed,
          isActive: true,
          NOT: { fiscalCode: '' }
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

    const emailTrimmed = email?.trim() || '';
    if (emailTrimmed !== '' && !emailTrimmed.startsWith('temp-email-')) {
      const existingClientByEmail = await prisma.client.findFirst({
        where: {
          email: emailTrimmed,
          isActive: true,
          NOT: { email: { startsWith: 'temp-email-' } }
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

    const phoneNumberTrimmed = phoneNumber?.trim() || '';
    if (phoneNumberTrimmed !== '') {
      const existingClientByPhone = await prisma.client.findFirst({
        where: {
          phoneNumber: phoneNumberTrimmed,
          isActive: true,
          NOT: { phoneNumber: '' }
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

    // Size validation
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const filesToValidate = [document1, document2, document3, document4].filter(f => f && f.size > 0);
    for (const file of filesToValidate) {
      if (file && file.size > maxFileSize) {
        return NextResponse.json({
          error: `El archivo ${file.name} es demasiado grande. Máximo 10MB por archivo.`
        }, { status: 400 });
      }
    }

    // Subir archivos de forma segura
    const results = await Promise.all([
      uploadSafe(document1),
      uploadSafe(document2),
      uploadSafe(document3),
      uploadSafe(document4)
    ]);

    const documentData = {
      document1: results[0].url ?? undefined,
      document1Name: results[0].url ? results[0].name : undefined,
      document2: results[1].url ?? undefined,
      document2Name: results[1].url ? results[1].name : undefined,
      document3: results[2].url ?? undefined,
      document3Name: results[2].url ? results[2].name : undefined,
      document4: results[3].url ?? undefined,
      document4Name: results[3].url ? results[3].name : undefined,
    };

    // Crear cliente
    const emailValue = emailTrimmed !== ''
      ? emailTrimmed
      : `temp-email-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${userId.substring(0, 8)}`;

    const clientData = {
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

  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] }; message?: string };
    console.error('Error creating client:', err);
    
    // P2002 handling
    if (err.code === 'P2002') {
      const target = err.meta?.target;
      if (Array.isArray(target) && target.length > 0) {
        const field = target[0];
        const fieldMessages: Record<string, string> = {
          'email': 'Ya existe un cliente activo con este email.',
          'fiscalCode': 'Ya existe un cliente activo con este código fiscal.',
          'phoneNumber': 'Ya existe un cliente activo con este número de teléfono.',
        };
        const message = fieldMessages[field] || `Ya existe un cliente activo con este ${field}.`;
        return NextResponse.json({
          error: message,
          field: field,
          details: `El campo '${field}' ya está registrado`
        }, { status: 400 });
      }
      return NextResponse.json({
        error: 'Ya existe un cliente activo con estos datos.',
        details: 'Los datos ya están registrados.'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error interno del servidor',
      details: err instanceof Error ? err.message : 'Error desconocido'
    }, { status: 500 });
  }
}
