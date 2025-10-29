import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { clerkRetryService } from '@/lib/clerk-retry';

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

    // Generar password temporal
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!';

    console.log('🔄 [USER CREATE] Intentando crear usuario en Clerk con reintentos...');
    
    // Crear usuario en Clerk con reintentos automáticos
    const clerkResult = await clerkRetryService.createUserWithRetry({
      emailAddress: [email],
      firstName: firstName,
      lastName: lastName,
      password: temporaryPassword,
      skipPasswordChecks: true,
      publicMetadata: {
        role: role,
        phoneNumber: phoneNumber,
      },
    });

    if (!clerkResult.success) {
      console.error('❌ [USER CREATE] Todos los reintentos fallaron para Clerk');
      console.error('❌ [USER CREATE] Error final:', clerkResult.error);
      
      // Determinar el tipo de error
      let errorMessage = 'Clerk creation failed after multiple attempts. Manual registration required.';
      if (clerkResult.error instanceof Error) {
        if (clerkResult.error.message.includes('Invalid API key')) {
          errorMessage = 'Clerk API key invalid. Check environment variables.';
        } else if (clerkResult.error.message.includes('Forbidden')) {
          errorMessage = 'Clerk API key lacks permissions. Check key configuration.';
        } else if (clerkResult.error.message.includes('User already exists')) {
          errorMessage = 'User already exists in Clerk. Check email address.';
        } else if (clerkResult.error.message.includes('Invalid email')) {
          errorMessage = 'Invalid email format. Please check email address.';
        } else if (clerkRetryService.isRecoverableError(clerkResult.error)) {
          errorMessage = 'Clerk service temporarily unavailable. User created in database only.';
        }
      }
      
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
        message: `User created in database only. ${errorMessage}`,
        temporaryPassword: null,
        clerkError: clerkResult.error instanceof Error ? clerkResult.error.message : 'Unknown error',
        attempts: clerkResult.attempts
      });
    }

    const clerkUser = clerkResult.user;
    if (!clerkUser) {
      console.error('❌ [USER CREATE] clerkUser es undefined después de éxito');
      return NextResponse.json({ 
        error: 'Internal server error: clerkUser is undefined' 
      }, { status: 500 });
    }
    
    console.log(`✅ [USER CREATE] Usuario creado en Clerk después de ${clerkResult.attempt} intentos: ${clerkUser.id}`);


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
