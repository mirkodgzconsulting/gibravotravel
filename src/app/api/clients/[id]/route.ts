import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy',
  api_key: process.env.CLOUDINARY_API_KEY || 'dummy',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy',
});

// GET - Obtener un cliente específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { 
        id,
        isActive: true
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol del usuario
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'TI'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para editar clientes' }, { status: 403 });
    }

    const formData = await request.formData();
    
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const fiscalCode = formData.get('fiscalCode') as string;
    const address = formData.get('address') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const email = formData.get('email') as string;
    const birthPlace = formData.get('birthPlace') as string;
    const birthDate = formData.get('birthDate') as string;
    const documents = formData.get('documents') as File | null;

    // Validaciones básicas
    if (!firstName || !lastName || !fiscalCode || !address || !phoneNumber || !email || !birthPlace || !birthDate) {
      return NextResponse.json({ error: 'Todos los campos obligatorios deben ser completados' }, { status: 400 });
    }

    // Verificar si el cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Verificar si el email ya existe en otro cliente
    const emailExists = await prisma.client.findFirst({
      where: { 
        email,
        id: { not: id }
      }
    });

    if (emailExists) {
      return NextResponse.json({ error: 'Ya existe otro cliente con este email' }, { status: 400 });
    }

    let documentsUrl = existingClient.documents;

    // Procesar nuevos documentos si se proporcionaron
    if (documents && documents.size > 0) {
      try {
        const buffer = await documents.arrayBuffer();

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              folder: 'clients/documents'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        documentsUrl = (result as { secure_url: string }).secure_url;
      } catch (uploadError) {
        console.error('Error uploading documents:', uploadError);
        return NextResponse.json({ error: 'Error al subir documentos' }, { status: 500 });
      }
    }

    // Actualizar cliente
    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        fiscalCode,
        address,
        phoneNumber,
        email,
        birthPlace,
        birthDate: new Date(birthDate),
        documents: documentsUrl
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      client,
      message: 'Cliente actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar cliente (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol del usuario
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'TI'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar clientes' }, { status: 403 });
    }

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

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
