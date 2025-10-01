import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('🧹 Iniciando limpieza de datos base64...');
    
    // Obtener todas las plantillas
    const templates = await prisma.travelNoteTemplate.findMany({
      select: {
        id: true,
        title: true,
        coverImage: true,
        pdfFile: true,
        coverImageName: true,
        pdfFileName: true,
      }
    });

    console.log(`📊 Encontradas ${templates.length} plantillas`);

    let updatedCount = 0;
    const cleanedTemplates = [];

    for (const template of templates) {
      let needsUpdate = false;
      const updateData: {
        coverImage?: null;
        coverImageName?: null;
        pdfFile?: null;
        pdfFileName?: null;
      } = {};

      // Verificar si coverImage es base64 (contiene "data:") o ruta antigua
      if (template.coverImage && (template.coverImage.includes('data:') || !template.coverImage.includes('/api/uploads/'))) {
        console.log(`🗑️ Eliminando imagen antigua para: ${template.title}`);
        updateData.coverImage = null;
        updateData.coverImageName = null;
        needsUpdate = true;
        cleanedTemplates.push({
          id: template.id,
          title: template.title,
          type: 'imagen',
          action: 'eliminada'
        });
      }

      // Verificar si pdfFile es base64 (contiene "data:") o ruta antigua
      if (template.pdfFile && (template.pdfFile.includes('data:') || !template.pdfFile.includes('/api/uploads/'))) {
        console.log(`🗑️ Eliminando PDF antiguo para: ${template.title}`);
        updateData.pdfFile = null;
        updateData.pdfFileName = null;
        needsUpdate = true;
        cleanedTemplates.push({
          id: template.id,
          title: template.title,
          type: 'pdf',
          action: 'eliminado'
        });
      }

      // Actualizar si es necesario
      if (needsUpdate) {
        await prisma.travelNoteTemplate.update({
          where: { id: template.id },
          data: updateData
        });
        updatedCount++;
      }
    }

    console.log(`✅ Limpieza completada. ${updatedCount} plantillas actualizadas.`);

    return NextResponse.json({
      success: true,
      message: `Limpieza completada. ${updatedCount} plantillas actualizadas.`,
      updatedCount,
      cleanedTemplates
    });

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor durante la limpieza' },
      { status: 500 }
    );
  }
}
