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

  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

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

    // Validaciones - Solo firstName, lastName y phoneNumber son obligatorios
    // fiscalCode, address, email y birthDate ahora son opcionales
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

    // Verificar si ya existe otro cliente activo con el mismo código fiscal (solo si se proporciona)
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

    // Verificar si ya existe otro cliente activo con el mismo email (solo si se proporciona)
    if (email && email.trim() !== '') {
      const duplicateClientByEmail = await prisma.client.findFirst({
        where: { 
          email: email.trim(),
          id: { not: id },
          isActive: true
        }
      });

      if (duplicateClientByEmail) {
        return NextResponse.json({ error: 'Ya existe otro cliente con este email' }, { status: 400 });
      }
    }

    // Verificar si ya existe otro cliente activo con el mismo número de teléfono
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

    // Validar tamaños de archivos
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const files = [document1, document2, document3, document4].filter(f => f && f.size > 0);
    
    for (const file of files) {
      if (file && file.size > maxFileSize) {
        return NextResponse.json({ 
          error: `El archivo ${file.name} es demasiado grande. Máximo 10MB por archivo.` 
        }, { status: 400 });
      }
    }

    // Preparar datos de documentos (mantener existentes si no se suben nuevos)
    const documentData: {
      document1?: string | null;
      document1Name?: string | null;
      document2?: string | null;
      document2Name?: string | null;
      document3?: string | null;
      document3Name?: string | null;
      document4?: string | null;
      document4Name?: string | null;
    } = {
      document1: existingClient.document1,
      document1Name: existingClient.document1Name,
      document2: existingClient.document2,
      document2Name: existingClient.document2Name,
      document3: existingClient.document3,
      document3Name: existingClient.document3Name,
      document4: existingClient.document4,
      document4Name: existingClient.document4Name,
    };

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

    // Subir archivos nuevos en paralelo
    const uploadPromises = [];
    if (document1 && document1.size > 0) uploadPromises.push(uploadFile(document1, 1));
    if (document2 && document2.size > 0) uploadPromises.push(uploadFile(document2, 2));
    if (document3 && document3.size > 0) uploadPromises.push(uploadFile(document3, 3));
    if (document4 && document4.size > 0) uploadPromises.push(uploadFile(document4, 4));

    if (uploadPromises.length > 0) {
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
    }

    // Actualizar el cliente
    // Nota: fiscalCode, address, email y birthDate ahora son opcionales
    // Para email vacío, verificar si el cliente actual tiene un email temporal y mantenerlo, o generar uno nuevo
    let emailValue = email?.trim() || '';
    
    // Si el email está vacío, verificar si el cliente actual tiene un email temporal
    if (!emailValue) {
      const currentClient = await prisma.client.findUnique({
        where: { id },
        select: { email: true }
      });
      
      // Si el cliente actual tiene un email temporal (empieza con "temp-email-"), mantenerlo
      // Si no, generar uno nuevo
      if (currentClient?.email && currentClient.email.startsWith('temp-email-')) {
        emailValue = currentClient.email;
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
        birthDate: birthDate && birthDate.trim() !== '' ? new Date(birthDate) : new Date('1900-01-01'), // Usar fecha por defecto si no se proporciona
        ...documentData
      }
    });

    return NextResponse.json({ 
      client: updatedClient,
      message: 'Cliente aggiornato con successo!' 
    });

  } catch (error: any) {
    console.error('Error updating client:', error);
    
    // Detectar errores de Prisma relacionados con constraints únicos
    if (error.code === 'P2002') {
      // Error de unique constraint en Prisma
      const target = error.meta?.target;
      
      if (Array.isArray(target)) {
        const field = target[0];
        
        // Mapear nombres de campos a mensajes más amigables
        const fieldMessages: Record<string, string> = {
          'email': 'Ya existe otro cliente con este email. Por favor, verifica el email ingresado.',
          'fiscalCode': 'Ya existe otro cliente con este código fiscal. Por favor, verifica el código fiscal ingresado.',
          'phoneNumber': 'Ya existe otro cliente con este número de teléfono. Por favor, verifica el teléfono ingresado.',
        };
        
        const message = fieldMessages[field] || `Ya existe otro cliente con este ${field}. Por favor, verifica el campo ${field}.`;
        
        return NextResponse.json({ 
          error: message,
          field: field,
          details: `El campo '${field}' ya está registrado en otro cliente`
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Ya existe otro cliente con estos datos. Por favor, verifica la información ingresada.',
        details: 'Los datos ingresados ya están registrados en otro cliente'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message || 'Error desconocido al actualizar el cliente'
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

    // Verificar si el cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Soft delete
    await prisma.client.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'Cliente eliminado exitosamente' 
    });

  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}