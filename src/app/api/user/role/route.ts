import { NextRequest, NextResponse } from 'next/server';
import { prisma, reconnectPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get('clerkId');

    if (!clerkId) {
      return NextResponse.json({ error: 'Clerk ID is required' }, { status: 400 });
    }

    // Verificar conexión a la base de datos primero
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError: any) {
      console.error('❌ Database connection error:', dbError);
      console.error('Error details:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta
      });
      
      // Intentar reconectar
      try {
        await reconnectPrisma();
      } catch (reconnectError) {
        console.error('❌ Failed to reconnect to database:', reconnectError);
      }
      
      return NextResponse.json({ 
        error: 'Database connection error',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true, firstName: true, lastName: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const response = NextResponse.json({ role: user.role });
    
    // Agregar headers de caché para reducir consultas repetidas
    // El rol del usuario no cambia frecuentemente, así que podemos cachear
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error: any) {
    console.error('❌ Error fetching user role:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
