import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';

// GET - Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar un usuario existente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario actual tiene permisos TI
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'TI') {
      return NextResponse.json({ error: 'No tienes permisos para editar usuarios' }, { status: 403 });
    }

    const { id } = await params;
    const formData = await request.formData();
    
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const role = formData.get('role') as string;
    const photo = formData.get('photo') as File | null;

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Email, nombre y apellido son requeridos' }, { status: 400 });
    }

    if (!['USER', 'ADMIN', 'TI'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar si el email ya existe en otro usuario
    const emailExists = await prisma.user.findFirst({
      where: {
        email,
        id: { not: id }
      }
    });

    if (emailExists) {
      return NextResponse.json({ error: 'Ya existe otro usuario con este email' }, { status: 400 });
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
      where: { id },
      data: {
        email,
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        photo: photoPath,
        role: role as 'USER' | 'ADMIN' | 'TI',
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

      await clerk.users.updateUser(existingUser.clerkId, {
        firstName: firstName,
        lastName: lastName,
        publicMetadata: {
          role: role,
          phoneNumber: phoneNumber,
        },
      });
    } catch (clerkError) {
      console.error('Error updating user in Clerk:', clerkError);
      // Continuar aunque falle la actualización en Clerk
    }

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Usuario actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar un usuario (eliminación física)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario actual tiene permisos TI
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'TI') {
      return NextResponse.json({ error: 'No tienes permisos para eliminar usuarios' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No permitir auto-eliminación
    if (existingUser.clerkId === userId) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
    }

    // Eliminar usuario de Clerk primero
    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      await clerk.users.deleteUser(existingUser.clerkId);
    } catch (clerkError) {
      console.error('Error deleting user from Clerk:', clerkError);
      // Continuar con la eliminación en la base de datos
    }

    // Eliminar usuario de la base de datos
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Usuario eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}


