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

// GET - Obtener todos los clientes
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      where: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ clients });
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

    // Verificar rol del usuario
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'TI'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear clientes' }, { status: 403 });
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

    // Verificar si el email ya existe
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient) {
      return NextResponse.json({ error: 'Ya existe un cliente con este email' }, { status: 400 });
    }

    let documentsUrl = null;

    // Procesar documentos si existen
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

    // Crear cliente
    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        fiscalCode,
        address,
        phoneNumber,
        email,
        birthPlace,
        birthDate: new Date(birthDate),
        documents: documentsUrl,
        createdBy: userId
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
      message: 'Cliente creado exitosamente' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
