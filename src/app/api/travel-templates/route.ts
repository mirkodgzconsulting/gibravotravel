import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { put } from '@vercel/blob';

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
    console.log('🔍 Environment check:', {
      isVercel: !!process.env.VERCEL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
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

    // Detectar si estamos en Vercel
    const isVercel = process.env.VERCEL;

    // Procesar imagen de portada
    if (coverImage && coverImage.size > 0) {
      console.log('📷 Processing cover image:', {
        name: coverImage.name,
        size: coverImage.size,
        type: coverImage.type
      });
      
      // Limitar tamaño según el entorno
      const maxSize = isVercel ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB para Vercel Blob, 5MB para desarrollo
      if (coverImage.size > maxSize) {
        console.log('❌ Image too large:', coverImage.size, 'max:', maxSize);
        return NextResponse.json(
          { error: `La imagen es demasiado grande. Máximo ${isVercel ? '10MB' : '5MB'}.` },
          { status: 400 }
        );
      }
      
      try {
        const bytes = await coverImage.arrayBuffer();
        
        if (isVercel && process.env.BLOB_READ_WRITE_TOKEN) {
          // En Vercel con token configurado, usar Blob Storage
          const timestamp = Date.now();
          const filename = `templates/template_${timestamp}_${coverImage.name}`;
          
          const blob = await put(filename, bytes, {
            access: 'public',
            contentType: coverImage.type,
          });
          
          coverImageData = blob.url;
          coverImageName = coverImage.name;
          console.log('✅ Imagen guardada (Vercel Blob):', blob.url);
        } else {
          // En desarrollo, usar almacenamiento local
          const buffer = Buffer.from(bytes);
          const timestamp = Date.now();
          const filename = `template_${timestamp}_${coverImage.name}`;
          
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'templates');
          await mkdir(uploadDir, { recursive: true });
          
          const filePath = join(uploadDir, filename);
          await writeFile(filePath, buffer);
          
          coverImageData = `/api/uploads/templates/${filename}`;
          coverImageName = coverImage.name;
          console.log('✅ Imagen guardada (desarrollo local):', coverImageData);
        }
      } catch (fileError) {
        console.error('❌ Error procesando imagen:', fileError);
        return NextResponse.json(
          { error: 'Error procesando imagen' },
          { status: 500 }
        );
      }
    }

    // Procesar archivo PDF
    if (pdfFile && pdfFile.size > 0) {
      // Limitar tamaño según el entorno
      const maxSize = isVercel ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB para Vercel Blob, 10MB para desarrollo
      if (pdfFile.size > maxSize) {
        return NextResponse.json(
          { error: `El archivo PDF es demasiado grande. Máximo ${isVercel ? '50MB' : '10MB'}.` },
          { status: 400 }
        );
      }
      
      try {
        const bytes = await pdfFile.arrayBuffer();
        
        if (isVercel && process.env.BLOB_READ_WRITE_TOKEN) {
          // En Vercel con token configurado, usar Blob Storage
          const timestamp = Date.now();
          const filename = `templates/template_${timestamp}_${pdfFile.name}`;
          
          const blob = await put(filename, bytes, {
            access: 'public',
            contentType: pdfFile.type,
          });
          
          pdfFileData = blob.url;
          pdfFileName = pdfFile.name;
          console.log('✅ PDF guardado (Vercel Blob):', blob.url);
        } else {
          // En desarrollo, usar almacenamiento local
          const buffer = Buffer.from(bytes);
          const timestamp = Date.now();
          const filename = `template_${timestamp}_${pdfFile.name}`;
          
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'templates');
          await mkdir(uploadDir, { recursive: true });
          
          const filePath = join(uploadDir, filename);
          await writeFile(filePath, buffer);
          
          pdfFileData = `/api/uploads/templates/${filename}`;
          pdfFileName = pdfFile.name;
          console.log('✅ PDF guardado (desarrollo local):', pdfFileData);
        }
      } catch (fileError) {
        console.error('❌ Error procesando PDF:', fileError);
        return NextResponse.json(
          { error: 'Error procesando archivo PDF' },
          { status: 500 }
        );
      }
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
