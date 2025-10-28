import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';

// POST - Cambiar contraseña del usuario actual
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Contraseña actual y nueva contraseña son requeridas' }, { status: 400 });
    }

    // Validación de requisitos de contraseña
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    const hasMinLength = newPassword.length >= 8;

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
      let missingRequirements = [];
      if (!hasMinLength) missingRequirements.push('8 caracteres');
      if (!hasUpperCase) missingRequirements.push('minimo una mayúscula');
      if (!hasLowerCase) missingRequirements.push('minimo una minúscula');
      if (!hasNumbers) missingRequirements.push('minimo un número');
      if (!hasSymbols) missingRequirements.push('minimo un símbolo especial');
      
      return NextResponse.json({ 
        error: `La contraseña debe tener: ${missingRequirements.join(', ')}`
      }, { status: 400 });
    }

    // Crear cliente de Clerk
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    try {
      // Obtener el usuario de Clerk
      const clerkUser = await clerk.users.getUser(userId);

      // Actualizar la contraseña en Clerk
      await clerk.users.updateUser(userId, {
        password: newPassword,
        skipPasswordChecks: false, // Esto verificará la contraseña actual
      });

      return NextResponse.json({ 
        message: 'Contraseña actualizada exitosamente' 
      });

    } catch (clerkError: any) {
      console.error('Error updating password in Clerk:', clerkError);
      
      // Manejar errores específicos de Clerk
      if (clerkError.message?.includes('password') || clerkError.message?.includes('invalid')) {
        return NextResponse.json({ 
          error: 'La contraseña actual es incorrecta' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Error al cambiar la contraseña',
        details: clerkError.message || 'Error desconocido'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
