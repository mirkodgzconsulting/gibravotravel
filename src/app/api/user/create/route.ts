import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkId, email, firstName, lastName, role = 'USER' } = body;

    if (!clerkId || !email) {
      return NextResponse.json({ error: 'Clerk ID and email are required' }, { status: 400 });
    }

    // Verificar que el rol sea válido
    if (!['USER', 'ADMIN', 'TI'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        clerkId,
        email,
        firstName,
        lastName,
        role: role as UserRole,
      },
    });

    return NextResponse.json({ user, role: user.role });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Si el usuario ya existe, devolver el usuario existente
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { clerkId: body.clerkId },
          select: { role: true }
        });
        
        if (existingUser) {
          return NextResponse.json({ user: existingUser, role: existingUser.role });
        }
      } catch (findError) {
        console.error('Error finding existing user:', findError);
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
