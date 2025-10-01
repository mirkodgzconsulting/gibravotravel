import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { clerkId, email, firstName, lastName, phoneNumber, role = 'USER' } = body;

  try {

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verificar que el rol sea válido
    if (!['USER', 'ADMIN', 'TI'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Generar un clerkId temporal si no se proporciona
    const finalClerkId = clerkId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const user = await prisma.user.create({
      data: {
        clerkId: finalClerkId,
        email,
        firstName,
        lastName,
        phoneNumber,
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
