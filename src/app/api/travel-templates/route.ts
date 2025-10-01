import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
  api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
});

export async function GET() {
  try {
    console.log('🔍 Fetching travel templates...');
    
    // Consulta optimizada sin include para evitar problemas de JOIN
    const templates = await prisma.travelNoteTemplate.findMany({
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
        tourDate: true,
        travelCost: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Found ${templates.length} templates`);

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
    console.error('Error fetching travel templates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Creating new travel template...');
    console.log('🔍 Environment check:', {
      hasCloudinaryUrl: !!process.env.CLOUDINARY_URL,
      hasCloudinaryConfig: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      nodeEnv: process.env.NODE_ENV
    });
    
    const { userId } = await auth();
    
    if (!userId) {
      console.log('❌ No user ID found');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', userId);

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const textContent = formData.get('textContent') as string;
    const tourDate = formData.get('tourDate') as string;
    const travelCost = formData.get('travelCost') as string;
    const coverImage = formData.get('coverImage') as File;
    const pdfFile = formData.get('pdfFile') as File;

    console.log('📝 Form data received:', {
      title: title || 'EMPTY',
      textContent: textContent || 'EMPTY',
      tourDate: tourDate || 'EMPTY',
      travelCost: travelCost || 'EMPTY',
      hasCoverImage: !!coverImage,
      hasPdfFile: !!pdfFile
    });

    // Validación mejorada
    const missingFields = [];
    if (!title || title.trim() === '') missingFields.push('title');
    if (!textContent || textContent.trim() === '') missingFields.push('textContent');
    if (!tourDate || tourDate.trim() === '') missingFields.push('tourDate');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Faltan campos requeridos: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    let coverImageUrl = null;
    let coverImageName = null;
    let pdfFileUrl = null;
    let pdfFileName = null;

    // Procesar imagen de portada
    if (coverImage && coverImage.size > 0) {
      console.log('📷 Processing cover image:', {
        name: coverImage.name,
        size: coverImage.size,
        type: coverImage.type
      });
      
      // Limitar tamaño a 10MB
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (coverImage.size > maxSize) {
        console.log('❌ Image too large:', coverImage.size, 'max:', maxSize);
        return NextResponse.json(
          { error: 'La imagen es demasiado grande. Máximo 10MB.' },
          { status: 400 }
        );
      }
      
      try {
        const bytes = await coverImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Convertir a base64 para Cloudinary
        const base64 = buffer.toString('base64');
        const dataUri = `data:${coverImage.type};base64,${base64}`;
        
        console.log('📤 Uploading to Cloudinary...');
        
        // Subir a Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'gibravotravel/templates',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 600, crop: 'limit', quality: 'auto' }
          ]
        });
        
        coverImageUrl = result.secure_url;
        coverImageName = coverImage.name;
        console.log('✅ Imagen guardada en Cloudinary:', result.secure_url);
        
      } catch (uploadError) {
        console.error('❌ Error uploading to Cloudinary:', uploadError);
        return NextResponse.json(
          { 
            error: 'Error subiendo imagen a Cloudinary',
            details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Procesar archivo PDF
    if (pdfFile && pdfFile.size > 0) {
      console.log('📄 Processing PDF file:', {
        name: pdfFile.name,
        size: pdfFile.size,
        type: pdfFile.type
      });
      
      // Limitar tamaño a 50MB
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (pdfFile.size > maxSize) {
        console.log('❌ PDF too large:', pdfFile.size, 'max:', maxSize);
        return NextResponse.json(
          { error: 'El archivo PDF es demasiado grande. Máximo 50MB.' },
          { status: 400 }
        );
      }
      
      try {
        const bytes = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Convertir a base64 para Cloudinary
        const base64 = buffer.toString('base64');
        const dataUri = `data:${pdfFile.type};base64,${base64}`;
        
        console.log('📤 Uploading PDF to Cloudinary...');
        
        // Subir a Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'gibravotravel/templates',
          resource_type: 'raw'
        });
        
        pdfFileUrl = result.secure_url;
        pdfFileName = pdfFile.name;
        console.log('✅ PDF guardado en Cloudinary:', result.secure_url);
        
      } catch (uploadError) {
        console.error('❌ Error uploading PDF to Cloudinary:', uploadError);
        return NextResponse.json(
          { 
            error: 'Error subiendo PDF a Cloudinary',
            details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    console.log('💾 Creating template in database with data:', {
      title,
      textContent: textContent.substring(0, 50) + '...',
      coverImage: coverImageUrl ? 'HAS_IMAGE' : 'NO_IMAGE',
      coverImageName,
      pdfFile: pdfFileUrl ? 'HAS_PDF' : 'NO_PDF',
      pdfFileName,
      tourDate: new Date(tourDate).toISOString(),
      travelCost: travelCost && travelCost.trim() !== '' ? parseFloat(travelCost) : null,
      createdBy: userId,
    });

    const template = await prisma.travelNoteTemplate.create({
      data: {
        title,
        textContent,
        coverImage: coverImageUrl,
        coverImageName,
        pdfFile: pdfFileUrl,
        pdfFileName,
        tourDate: new Date(tourDate),
        travelCost: travelCost && travelCost.trim() !== '' ? parseFloat(travelCost) : null,
        createdBy: userId,
      },
    });

    // Obtener información del creador por separado
    const creator = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
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

    console.log('🎉 Template created successfully:', template.id);
    return NextResponse.json({ template: templateWithCreator }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating travel template:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Retornar un mensaje más específico
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
