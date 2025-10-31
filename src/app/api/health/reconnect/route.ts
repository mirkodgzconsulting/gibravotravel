import { NextResponse } from 'next/server';
import { reconnectPrisma } from '@/lib/prisma';

// Endpoint manual para forzar reconexión de BD
export async function POST() {
  try {
    console.log('🔄 [Manual Reconnect] Attempting to reconnect database...');
    
    const prisma = await reconnectPrisma();
    
    // Verificar que la conexión funcione
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      message: 'Database reconnected successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Manual Reconnect] Failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Reconnection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

