import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

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

    if (!title || !textContent || !tourDate) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    let coverImageData = null;
    let coverImageName = null;
    let pdfFileData = null;
    let pdfFileName = null;

    // Procesar imagen de portada (optimizado)
    if (coverImage && coverImage.size > 0) {
      // Limitar tamaño de imagen a 5MB
      if (coverImage.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'La imagen es demasiado grande. Máximo 5MB.' },
          { status: 400 }
        );
      }
      
      const imageBuffer = await coverImage.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      coverImageData = `data:${coverImage.type};base64,${imageBase64}`;
      coverImageName = coverImage.name;
    }

    // Procesar archivo PDF (optimizado)
    if (pdfFile && pdfFile.size > 0) {
      // Limitar tamaño de PDF a 10MB
      if (pdfFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'El archivo PDF es demasiado grande. Máximo 10MB.' },
          { status: 400 }
        );
      }
      
      const pdfBuffer = await pdfFile.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
      pdfFileData = `data:${pdfFile.type};base64,${pdfBase64}`;
      pdfFileName = pdfFile.name;
    }

    const template = await prisma.travelNoteTemplate.create({
      data: {
        title,
        textContent,
        coverImage: coverImageData,
        coverImageName,
        pdfFile: pdfFileData,
        pdfFileName,
        tourDate: new Date(tourDate),
        travelCost: travelCost ? parseFloat(travelCost) : null,
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

    return NextResponse.json({ template: templateWithCreator }, { status: 201 });
  } catch (error) {
    console.error('Error creating travel template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
