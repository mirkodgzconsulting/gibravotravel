import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend';

export async function POST(request: NextRequest) {
  console.log('🧪 PROBANDO CREACIÓN DE USUARIO EN PRODUCCIÓN');
  console.log('==============================================');

  try {
    const { email, firstName, lastName, phoneNumber, role } = await request.json();

    if (!email || !firstName || !lastName) {
      return NextResponse.json({
        error: 'Email, firstName y lastName son requeridos'
      }, { status: 400 });
    }

    // Verificar variables de entorno
    if (!process.env.CLERK_SECRET_KEY) {
      return NextResponse.json({
        error: 'CLERK_SECRET_KEY no está configurada',
        success: false
      });
    }

    console.log('\n1. Verificando configuración...');
    console.log(`   Email: ${email}`);
    console.log(`   Nombre: ${firstName} ${lastName}`);
    console.log(`   Teléfono: ${phoneNumber || 'N/A'}`);
    console.log(`   Rol: ${role || 'USER'}`);

    // Crear cliente de Clerk
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Generar password temporal
    const temporaryPassword = Math.random().toString(36).slice(-12) + 'A1!';
    console.log(`   Password temporal: ${temporaryPassword}`);

    console.log('\n2. Intentando crear usuario en Clerk...');
    
    try {
      const clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        firstName: firstName,
        lastName: lastName,
        password: temporaryPassword,
        skipPasswordChecks: true,
        publicMetadata: {
          role: role || 'USER',
          phoneNumber: phoneNumber || null,
        },
      });

      console.log('   ✅ Usuario creado exitosamente en Clerk');
      console.log(`   🆔 Clerk ID: ${clerkUser.id}`);

      // Limpiar usuario de prueba
      console.log('\n3. Limpiando usuario de prueba...');
      await clerk.users.deleteUser(clerkUser.id);
      console.log('   🧹 Usuario de prueba eliminado');

      return NextResponse.json({
        success: true,
        message: 'Usuario creado y eliminado exitosamente en Clerk',
        clerkId: clerkUser.id,
        temporaryPassword: temporaryPassword,
        testPassed: true
      });

    } catch (clerkError) {
      console.log('   ❌ Error creando usuario en Clerk:', clerkError);
      
      let errorType = 'Unknown';
      let errorMessage = 'Error desconocido';
      
      if (clerkError instanceof Error) {
        if (clerkError.message.includes('Invalid API key')) {
          errorType = 'Invalid API key';
          errorMessage = 'La clave de Clerk es inválida o incorrecta';
        } else if (clerkError.message.includes('Forbidden')) {
          errorType = 'Forbidden';
          errorMessage = 'La clave de Clerk no tiene permisos suficientes';
        } else if (clerkError.message.includes('Not Found')) {
          errorType = 'Not Found';
          errorMessage = 'La aplicación de Clerk no existe o fue eliminada';
        } else if (clerkError.message.includes('User already exists')) {
          errorType = 'User already exists';
          errorMessage = 'El usuario ya existe en Clerk';
        } else if (clerkError.message.includes('Invalid email')) {
          errorType = 'Invalid email';
          errorMessage = 'El formato del email es inválido';
        } else if (clerkError.message.includes('Password')) {
          errorType = 'Password error';
          errorMessage = 'Error con la contraseña';
        } else {
          errorMessage = clerkError.message;
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Error creando usuario en Clerk',
        errorType,
        errorMessage,
        clerkError: clerkError instanceof Error ? clerkError.message : 'Unknown error',
        testPassed: false
      });
    }

  } catch (error) {
    console.error('❌ Error general en test:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error general',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      testPassed: false
    });
  }
}
