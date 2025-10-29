import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend';

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG CLERK EN PRODUCCIÓN');
  console.log('============================');

  try {
    // 1. Verificar variables de entorno
    console.log('\n1. Verificando variables de entorno...');
    const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
    const hasPublishableKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    console.log('   CLERK_SECRET_KEY:', hasSecretKey ? '✅ Configurada' : '❌ NO CONFIGURADA');
    console.log('   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', hasPublishableKey ? '✅ Configurada' : '❌ NO CONFIGURADA');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   VERCEL:', process.env.VERCEL);

    if (!hasSecretKey) {
      return NextResponse.json({
        error: 'CLERK_SECRET_KEY no está configurada',
        hasSecretKey: false,
        hasPublishableKey,
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL
      });
    }

    // 2. Verificar formato de las claves
    console.log('\n2. Verificando formato de las claves...');
    const secretKey = process.env.CLERK_SECRET_KEY || '';
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
    
    const secretKeyFormat = secretKey.startsWith('sk_');
    const publishableKeyFormat = publishableKey.startsWith('pk_');
    const secretKeyType = secretKey.includes('live') ? 'LIVE' : secretKey.includes('test') ? 'TEST' : 'DESCONOCIDO';
    const publishableKeyType = publishableKey.includes('live') ? 'LIVE' : publishableKey.includes('test') ? 'TEST' : 'DESCONOCIDO';
    
    console.log(`   Secret Key formato: ${secretKeyFormat ? '✅ Correcto' : '❌ Incorrecto'}`);
    console.log(`   Publishable Key formato: ${publishableKeyFormat ? '✅ Correcto' : '❌ Incorrecto'}`);
    console.log(`   Secret Key tipo: ${secretKeyType}`);
    console.log(`   Publishable Key tipo: ${publishableKeyType}`);

    // 3. Probar conexión con Clerk
    console.log('\n3. Probando conexión con Clerk...');
    try {
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Intentar obtener la lista de usuarios (esto prueba la conexión)
      const users = await clerk.users.getUserList({ limit: 1 });
      console.log('   ✅ Conexión con Clerk exitosa');
      console.log(`   📊 Usuarios en Clerk: ${users.totalCount || 'No disponible'}`);

      return NextResponse.json({
        success: true,
        message: 'Clerk configurado correctamente',
        hasSecretKey: true,
        hasPublishableKey: true,
        secretKeyFormat,
        publishableKeyFormat,
        secretKeyType,
        publishableKeyType,
        clerkUsersCount: users.totalCount || 0,
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL
      });

    } catch (clerkError) {
      console.log('   ❌ Error conectando con Clerk:', clerkError);
      
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
        } else {
          errorMessage = clerkError.message;
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Error conectando con Clerk',
        errorType,
        errorMessage,
        hasSecretKey: true,
        hasPublishableKey: true,
        secretKeyFormat,
        publishableKeyFormat,
        secretKeyType,
        publishableKeyType,
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        clerkError: clerkError instanceof Error ? clerkError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Error general en debug:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error general',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      hasSecretKey: !!process.env.CLERK_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL
    });
  }
}
