import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createClerkClient } from '@clerk/backend';

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

    // Verificar si el usuario ya existe en Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ 
        user: existingUser, 
        role: existingUser.role,
        message: 'User already exists with this email'
      });
    }

    let photoPath = null;


    // Manejar la imagen si se proporciona
    if (photo && photo.size > 0) {
      try {
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // En Vercel, el sistema de archivos es de solo lectura
        // Guardamos la imagen como base64 en la base de datos
        
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${photo.type};base64,${base64Image}`;
        
        // Guardar como base64 en lugar de archivo
        photoPath = dataUrl;
      } catch (fileError) {
        console.error('❌ Error guardando imagen:', fileError);
        console.error('❌ Error details:', {
          message: fileError instanceof Error ? fileError.message : 'Unknown error',
          stack: fileError instanceof Error ? fileError.stack : 'No stack trace',
          name: fileError instanceof Error ? fileError.name : 'UnknownError'
        });
        // Continuar sin imagen si hay error
      }
    }

    // Crear cliente de Clerk
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // Generar password temporal
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!';

    let clerkUser;
    try {
      // Crear usuario en Clerk
      clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        firstName: firstName,
        lastName: lastName,
        password: temporaryPassword,
        skipPasswordChecks: true, // Permitir password temporal
        publicMetadata: {
          role: role,
          phoneNumber: phoneNumber,
        },
      });

    } catch (clerkError) {
      console.error('❌ Error creando usuario en Clerk:', clerkError);
      
      // Si hay error en Clerk, intentar crear solo en Prisma como fallback
      const fallbackUser = await prisma.user.create({
        data: {
          clerkId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          firstName,
          lastName,
          phoneNumber,
          photo: photoPath,
          role: role as UserRole,
        },
      });

      return NextResponse.json({ 
        user: fallbackUser, 
        role: fallbackUser.role,
        message: 'User created in database only. Clerk creation failed. Manual registration required.',
        temporaryPassword: null,
      });
    }


    // Crear usuario en Prisma con el clerkId real
    const user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
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
      message: `User created successfully in both Clerk and database. They can now login with email: ${email}`,
      temporaryPassword: temporaryPassword,
    });
  } catch (error) {
    console.error('Error creating user:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
