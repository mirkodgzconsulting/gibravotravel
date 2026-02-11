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

// GET - Obtener un cliente específico
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

    const client = await prisma.client.findUnique({
      where: { id },
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
        createdAt: true,
        updatedAt: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ client });

  } catch (error: unknown) {
    console.error('Error fetching client:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
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
    return { url: null, name: null };
  }
};

// PUT - Actualizar un cliente
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
    const formData = await request.formData();

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const fiscalCode = formData.get('fiscalCode') as string;
    const address = formData.get('address') as string;
    const email = formData.get('email') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const birthPlace = formData.get('birthPlace') as string;
    const birthDate = formData.get('birthDate') as string;

    // Obtener archivos nuevos (si se subieron)
    const document1 = formData.get('document1') as File | null;
    const document2 = formData.get('document2') as File | null;
    const document3 = formData.get('document3') as File | null;
    const document4 = formData.get('document4') as File | null;

    // Validaciones
    if (!firstName || !lastName || !phoneNumber) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (Nombre, Apellido y Teléfono son requeridos)' }, { status: 400 });
    }

    // Verificar si el cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Validaciones de duplicados (fiscalCode, email, phoneNumber) excluyendo el ID actual
    if (fiscalCode && fiscalCode.trim() !== '') {
      const duplicateClientByFiscal = await prisma.client.findFirst({
        where: {
          fiscalCode: fiscalCode.trim(),
          id: { not: id },
          isActive: true
        }
      });
      if (duplicateClientByFiscal) {
        return NextResponse.json({ error: 'Ya existe otro cliente con este código fiscal' }, { status: 400 });
      }
    }

    if (email && email.trim() !== '' && !email.startsWith('temp-email-')) {
      const duplicateClientByEmail = await prisma.client.findFirst({
        where: {
          email: email.trim(),
          id: { not: id },
          isActive: true,
          NOT: { email: { startsWith: 'temp-email-' } }
        }
      });
      if (duplicateClientByEmail) {
        return NextResponse.json({ error: 'Ya existe otro cliente con este email' }, { status: 400 });
      }
    }

    if (phoneNumber && phoneNumber.trim() !== '') {
      const duplicateClientByPhone = await prisma.client.findFirst({
        where: {
          phoneNumber: phoneNumber.trim(),
          id: { not: id },
          isActive: true
        }
      });
      if (duplicateClientByPhone) {
        return NextResponse.json({ error: 'Ya existe otro cliente con este número de teléfono' }, { status: 400 });
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

    // Subir archivos nuevos de forma segura
    const results = await Promise.all([
      uploadSafe(document1),
      uploadSafe(document2),
      uploadSafe(document3),
      uploadSafe(document4)
    ]);

    // Preparar datos de documentos (mantener existentes si no se suben nuevos, o si la subida nueva falló o no se intentó)
    // uploadSafe retorna url: null si no hubo archivo o falló.
    // Si url es null, debemos mantener el valor existente SOLO si no se intentó subir un archivo nuevo. 
    // Pero si se intentó y falló, ¿qué hacemos? Aquí 'fail safe' significa que no actualizamos el campo si falló la subida.
    
    // Lógica: Si results[i].url existe, actualizamos. Si no, mantenemos el valor anterior.
    // NOTA: Si quisiéramos borrar un archivo, necesitaríamos una lógica explícita (e.g. un flag 'deleteDocument1'). 
    // Por ahora, asumimos que si no se envía archivo, se mantiene el anterior.
    
    const updateDoc = (existingUrl: string | null | undefined, existingName: string | null | undefined, newRes: { url: string | null, name: string | null }) => {
       if (newRes.url) {
         return { url: newRes.url, name: newRes.name };
       }
       return { url: existingUrl, name: existingName };
    };

    const doc1 = updateDoc(existingClient.document1, existingClient.document1Name, results[0]);
    const doc2 = updateDoc(existingClient.document2, existingClient.document2Name, results[1]);
    const doc3 = updateDoc(existingClient.document3, existingClient.document3Name, results[2]);
    const doc4 = updateDoc(existingClient.document4, existingClient.document4Name, results[3]);

    const documentData: Prisma.ClientUpdateInput = {
      document1: doc1.url,
      document1Name: doc1.name,
      document2: doc2.url,
      document2Name: doc2.name,
      document3: doc3.url,
      document3Name: doc3.name,
      document4: doc4.url,
      document4Name: doc4.name,
    };

    // Actualizar cliente
    let emailValue = email?.trim() || '';
    if (!emailValue) {
       // Mantener si ya tenía temp, o generar nuevo
       if (existingClient.email && existingClient.email.startsWith('temp-email-')) {
         emailValue = existingClient.email;
       } else {
         emailValue = `temp-email-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
       }
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        fiscalCode: fiscalCode?.trim() || '',
        address: address?.trim() || '',
        email: emailValue,
        phoneNumber,
        birthPlace: birthPlace || '',
        birthDate: birthDate && birthDate.trim() !== '' ? new Date(birthDate) : new Date('1900-01-01'),
        ...documentData
      }
    });

    return NextResponse.json({
      client: updatedClient,
      message: 'Cliente aggiornato con successo!'
    });

  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] }; message?: string };
    console.error('Error updating client:', err);
    
    if (err.code === 'P2002') {
      // similar validation error logic
      const target = err.meta?.target;
      if (Array.isArray(target)) {
        const field = target[0];
        const fieldMessages: Record<string, string> = {
            'email': 'Ya existe otro cliente con este email.',
            'fiscalCode': 'Ya existe otro cliente con este código fiscal.',
            'phoneNumber': 'Ya existe otro cliente con este número de teléfono.',
        };
        const message = fieldMessages[field] || `Ya existe otro cliente con este ${field}.`;
        return NextResponse.json({
            error: message,
            field: field,
            details: `El campo '${field}' ya está registrado`
        }, { status: 400 });
      }
      return NextResponse.json({
          error: 'Ya existe otro cliente con estos datos.',
          details: 'Los datos ya están registrados.'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error interno del servidor',
      details: err.message || 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar un cliente (soft delete)
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

    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    await prisma.client.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error: unknown) {
    console.error('Error deleting client:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}