import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🧹 Cleaning database connections...');
    
    // Verificar DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_URL no configurada en las variables de entorno'
        },
        { status: 500 }
      );
    }
    
    console.log('🔍 DATABASE_URL:', dbUrl.replace(/:[^:@]+@/, ':****@')); // Ocultar password
    
    try {
      // Desconectar Prisma para cerrar todas las conexiones
      await prisma.$disconnect();
      console.log('✅ Database connections closed');
    } catch (disconnectError) {
      console.warn('⚠️ Error during disconnect (continuando de todas formas):', disconnectError);
    }
    
    // Esperar un momento para que las conexiones se cierren completamente
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Reconectar
      await prisma.$connect();
      console.log('✅ Database reconnected');
    } catch (connectError) {
      console.error('❌ Error during reconnect:', connectError);
      return NextResponse.json(
        {
          success: false,
          error: `Error al reconectar: ${connectError instanceof Error ? connectError.message : 'Error desconocido'}`
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Conexiones limpiadas exitosamente'
    });
  } catch (error) {
    console.error('❌ Error cleaning connections:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

