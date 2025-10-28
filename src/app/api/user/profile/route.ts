import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';

// GET - Obtener perfil del usuario actual
export async function GET() {
  try {
    const { userId } = await auth();
    
    console.log('🔍 GET /api/user/profile - userId:', userId);
    
    if (!userId) {
      console.log('❌ No autorizado - userId missing');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        photo: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('👤 User found:', user ? { id: user.id, email: user.email, role: user.role } : 'null');

    if (!user) {
      console.log('❌ Usuario no encontrado en BD para clerkId:', userId);
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    console.log('✅ Devolviendo usuario con role:', user.role);
    // Devolver directamente el objeto usuario (no envuelto en { user })
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar perfil del usuario actual
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const photo = formData.get('photo') as File | null;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Nombre y apellido son requeridos' }, { status: 400 });
    }

    // Obtener usuario actual
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let photoPath = existingUser.photo;

    // Procesar nueva foto si se proporcionó
    if (photo && photo.size > 0) {
      try {
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${photo.type};base64,${base64Image}`;
        
        photoPath = dataUrl;
      } catch (fileError) {
        console.error('Error processing photo:', fileError);
        return NextResponse.json({ 
          error: 'Error al procesar la foto',
          details: fileError instanceof Error ? fileError.message : 'Error desconocido'
        }, { status: 500 });
      }
    }

    // Actualizar usuario en la base de datos
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        photo: photoPath,
        updatedAt: new Date()
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        photo: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Actualizar usuario en Clerk
    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      const updateData: any = {
        firstName: firstName,
        lastName: lastName,
        publicMetadata: {
          phoneNumber: phoneNumber,
        },
      };

      // Si hay una nueva foto, actualizarla en Clerk también
      if (photoPath && photoPath !== existingUser.photo) {
        updateData.profileImageUrl = photoPath;
      }

      await clerk.users.updateUser(existingUser.clerkId, updateData);
    } catch (clerkError) {
      console.error('Error updating user in Clerk:', clerkError);
      // Continuar aunque falle la actualización en Clerk
    }

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Perfil actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
