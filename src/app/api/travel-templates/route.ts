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

    let coverImagePath = null;
    let pdfFilePath = null;

    // Procesar imagen de portada
    if (coverImage && coverImage.size > 0) {
      const imageBuffer = await coverImage.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      coverImagePath = `data:${coverImage.type};base64,${imageBase64}`;
    }

    // Procesar archivo PDF
    if (pdfFile && pdfFile.size > 0) {
      const pdfBuffer = await pdfFile.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
      pdfFilePath = `data:${pdfFile.type};base64,${pdfBase64}`;
    }

    const template = await prisma.travelNoteTemplate.create({
      data: {
        title,
        textContent,
        coverImage: coverImagePath,
        pdfFile: pdfFilePath,
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
