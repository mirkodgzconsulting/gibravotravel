import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const role = formData.get('role') as string;
    const photo = formData.get('photo') as File | null;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verificar que el rol sea válido
    if (!['USER', 'ADMIN', 'TI'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    let photoPath = null;

    // Manejar la imagen si se proporciona
    if (photo && photo.size > 0) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Generar nombre único para la imagen
      const timestamp = Date.now();
      const filename = `user_${timestamp}_${photo.name}`;
      const path = join(process.cwd(), 'public', 'uploads', 'users', filename);
      
      // Crear directorio si no existe
      const { mkdir } = await import('fs/promises');
      await mkdir(join(process.cwd(), 'public', 'uploads', 'users'), { recursive: true });
      
      // Guardar la imagen
      await writeFile(path, buffer);
      photoPath = `/uploads/users/${filename}`;
    }

    // Crear usuario en Prisma
    const user = await prisma.user.create({
      data: {
        clerkId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID temporal
        email,
        firstName,
        lastName,
        phoneNumber,
        photo: photoPath,
        role: role as UserRole,
      },
    });

    return NextResponse.json({ 
      user, 
      role: user.role,
      message: 'User created successfully. They will need to register in Clerk to access the system.'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Si el usuario ya existe, devolver el usuario existente
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      try {
        const formData = await request.formData();
        const email = formData.get('email') as string;
        
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { role: true, email: true }
        });
        
        if (existingUser) {
          return NextResponse.json({ 
            user: existingUser, 
            role: existingUser.role,
            message: 'User already exists with this email'
          });
        }
      } catch (findError) {
        console.error('Error finding existing user:', findError);
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
