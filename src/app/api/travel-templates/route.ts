import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const templates = await prisma.travelNoteTemplate.findMany({
      where: {
        isDeleted: false,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ templates });
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

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating travel template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
