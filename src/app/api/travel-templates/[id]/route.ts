import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.travelNoteTemplate.findUnique({
      where: {
        id,
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
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching travel template:', error);
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
    const template = await prisma.travelNoteTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    if (template.createdBy !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta plantilla' },
        { status: 403 }
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

    let coverImagePath = template.coverImage;
    let pdfFilePath = template.pdfFile;

    // Procesar nueva imagen de portada si se proporciona
    if (coverImage && coverImage.size > 0) {
      const imageBuffer = await coverImage.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      coverImagePath = `data:${coverImage.type};base64,${imageBase64}`;
    }

    // Procesar nuevo archivo PDF si se proporciona
    if (pdfFile && pdfFile.size > 0) {
      const pdfBuffer = await pdfFile.arrayBuffer();
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
      pdfFilePath = `data:${pdfFile.type};base64,${pdfBase64}`;
    }

    const updatedTemplate = await prisma.travelNoteTemplate.update({
      where: { id },
      data: {
        title,
        textContent,
        coverImage: coverImagePath,
        pdfFile: pdfFilePath,
        tourDate: new Date(tourDate),
        travelCost: travelCost ? parseFloat(travelCost) : null,
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
    console.error('Error updating travel template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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
    const template = await prisma.travelNoteTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    if (template.createdBy !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta plantilla' },
        { status: 403 }
      );
    }

    // Soft delete - marcar como eliminado
    await prisma.travelNoteTemplate.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: 'Plantilla eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting travel template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
