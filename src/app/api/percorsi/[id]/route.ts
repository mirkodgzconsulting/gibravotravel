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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.route.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        textContent: true,
        coverImage: true,
        coverImageName: true,
        pdfFile: true,
        pdfFileName: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Percorso no encontrado' },
        { status: 404 }
      );
    }

    // Obtener información del creador
    const creator = await prisma.user.findUnique({
      where: { clerkId: template.createdBy },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const templateWithCreator = {
      ...template,
      creator: creator || {
        firstName: null,
        lastName: null,
        email: 'Usuario no encontrado',
      },
    };

    return NextResponse.json({ template: templateWithCreator });
  } catch (error) {
    console.error('Error fetching route template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const textContent = formData.get('textContent') as string;
    const coverImage = formData.get('coverImage') as File;
    const pdfFile = formData.get('pdfFile') as File;

    // Validación
    const missingFields = [];
    if (!title || title.trim() === '') missingFields.push('title');
    if (!textContent || textContent.trim() === '') missingFields.push('textContent');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Verificar que el template existe
    const existingTemplate = await prisma.route.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Percorso no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos (opcional: solo el creador puede editar)
    if (existingTemplate.createdBy !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este percorso' },
        { status: 403 }
      );
    }

    // Validar tamaños de archivos
    if (coverImage && coverImage.size > 0) {
      const maxImageSize = 10 * 1024 * 1024; // 10MB
      if (coverImage.size > maxImageSize) {
        return NextResponse.json(
          { error: 'La imagen es demasiado grande. Máximo 10MB.' },
          { status: 400 }
        );
      }
    }

    if (pdfFile && pdfFile.size > 0) {
      const maxPdfSize = 50 * 1024 * 1024; // 50MB
      if (pdfFile.size > maxPdfSize) {
        return NextResponse.json(
          { error: 'El archivo PDF es demasiado grande. Máximo 50MB.' },
          { status: 400 }
        );
      }
    }

    // Uploads paralelos para nuevos archivos
    const uploadPromises = [];
    let coverImageUrl = existingTemplate.coverImage;
    let coverImageName = existingTemplate.coverImageName;
    let pdfFileUrl = existingTemplate.pdfFile;
    let pdfFileName = existingTemplate.pdfFileName;

    // Preparar upload de nueva imagen si existe
    if (coverImage && coverImage.size > 0) {
      const imageUploadPromise = (async () => {
        try {
          const bytes = await coverImage.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/percorsi',
                resource_type: 'image',
                transformation: [
                  { width: 800, height: 600, crop: 'limit', quality: 'auto' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });

          return {
            type: 'image',
            url: (result as { secure_url: string }).secure_url,
            name: coverImage.name
          };
        } catch (error) {
          throw new Error(`Error uploading image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })();
      
      uploadPromises.push(imageUploadPromise);
    }

    // Preparar upload de nuevo PDF si existe
    if (pdfFile && pdfFile.size > 0) {
      const pdfUploadPromise = (async () => {
        try {
          const bytes = await pdfFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/percorsi',
                resource_type: 'raw'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });

          return {
            type: 'pdf',
            url: (result as { secure_url: string }).secure_url,
            name: pdfFile.name
          };
        } catch (error) {
          throw new Error(`Error uploading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })();
      
      uploadPromises.push(pdfUploadPromise);
    }

    // Ejecutar uploads si hay archivos nuevos
    if (uploadPromises.length > 0) {
      try {
        const uploadResults = await Promise.all(uploadPromises);
        
        uploadResults.forEach(result => {
          if (result.type === 'image') {
            coverImageUrl = result.url;
            coverImageName = result.name;
          } else if (result.type === 'pdf') {
            pdfFileUrl = result.url;
            pdfFileName = result.name;
          }
        });
      } catch (uploadError) {
        return NextResponse.json(
          { 
            error: 'Error subiendo archivos a Cloudinary',
            details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Actualizar template
    const updatedTemplate = await prisma.route.update({
      where: { id },
      data: {
        title,
        textContent,
        coverImage: coverImageUrl,
        coverImageName,
        pdfFile: pdfFileUrl,
        pdfFileName,
        updatedAt: new Date(),
      },
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

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error('Error updating route template:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar que el template existe
    const existingTemplate = await prisma.route.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Percorso no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos (opcional: solo el creador puede eliminar)
    if (existingTemplate.createdBy !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este percorso' },
        { status: 403 }
      );
    }

    // Soft delete - marcar como eliminado en lugar de eliminar físicamente
    await prisma.route.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Percorso eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting route template:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


