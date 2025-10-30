import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    console.log('🧹 Cleaning database connections...');
    
    // Desconectar Prisma para cerrar todas las conexiones
    await prisma.$disconnect();
    
    console.log('✅ Database connections closed');
    
    // Esperar un momento para que las conexiones se cierren completamente
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reconectar
    await prisma.$connect();
    
    console.log('✅ Database reconnected');
    
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

