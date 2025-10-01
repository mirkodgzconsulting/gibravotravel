const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupBase64Data() {
  try {
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

    for (const template of templates) {
      let needsUpdate = false;
      const updateData = {};

      // Verificar si coverImage es base64 (contiene "data:")
      if (template.coverImage && template.coverImage.includes('data:')) {
        console.log(`🗑️ Eliminando base64 de imagen para: ${template.title}`);
        updateData.coverImage = null;
        updateData.coverImageName = null;
        needsUpdate = true;
      }

      // Verificar si pdfFile es base64 (contiene "data:")
      if (template.pdfFile && template.pdfFile.includes('data:')) {
        console.log(`🗑️ Eliminando base64 de PDF para: ${template.title}`);
        updateData.pdfFile = null;
        updateData.pdfFileName = null;
        needsUpdate = true;
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
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBase64Data();
