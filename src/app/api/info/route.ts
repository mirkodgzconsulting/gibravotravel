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

export async function GET() {
  try {
    console.log('🔍 Fetching info templates...');
    
    // Consulta optimizada sin include para evitar problemas de JOIN
    const templates = await prisma.info.findMany({
      where: {
        isDeleted: false,
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Found ${templates.length} info templates`);
    console.log('📊 Templates data:', templates);

    // Si no hay templates, devolver array vacío
    if (templates.length === 0) {
      return NextResponse.json({ templates: [] });
    }

    // Obtener información del creador por separado para evitar problemas de JOIN
    const creatorIds = [...new Set(templates.map(t => t.createdBy))];
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
    const templatesWithCreators = templates.map(template => ({
      ...template,
      creator: creators.find(c => c.clerkId === template.createdBy) || {
        firstName: null,
        lastName: null,
        email: 'Usuario no encontrado',
      },
    }));

    return NextResponse.json({ templates: templatesWithCreators });
  } catch (error) {
    console.error('Error fetching info templates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const textContent = formData.get('textContent') as string;
    const coverImage = formData.get('coverImage') as File;
    const pdfFile = formData.get('pdfFile') as File;

    // Validación mejorada
    const missingFields = [];
    if (!title || title.trim() === '') missingFields.push('title');
    if (!textContent || textContent.trim() === '') missingFields.push('textContent');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar tamaños de archivos antes de procesar
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

    // Uploads paralelos para mejor rendimiento
    const uploadPromises = [];

    // Preparar upload de imagen si existe
    if (coverImage && coverImage.size > 0) {
      const imageUploadPromise = (async () => {
        try {
          const bytes = await coverImage.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Subir directamente a Cloudinary usando Promise
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/info',
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

    // Preparar upload de PDF si existe
    if (pdfFile && pdfFile.size > 0) {
      const pdfUploadPromise = (async () => {
        try {
          const bytes = await pdfFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Subir directamente a Cloudinary usando Promise
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'gibravotravel/info',
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

    // Ejecutar todos los uploads en paralelo
    let coverImageUrl = null;
    let coverImageName = null;
    let pdfFileUrl = null;
    let pdfFileName = null;

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

    // Crear template con información del creador en una sola query
    const template = await prisma.info.create({
      data: {
        title,
        textContent,
        coverImage: coverImageUrl,
        coverImageName,
        pdfFile: pdfFileUrl,
        pdfFileName,
        createdBy: userId,
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

    // Asegurar que el creator existe o usar valores por defecto
    const templateWithCreator = {
      ...template,
      creator: template.creator || {
        firstName: null,
        lastName: null,
        email: 'Usuario no encontrado',
      },
    };

    return NextResponse.json({ template: templateWithCreator }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
