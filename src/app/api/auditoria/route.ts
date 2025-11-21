import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tiene permisos (ADMIN o TI)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'TI'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para ver la auditoría' }, { status: 403 });
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const tipoVenta = searchParams.get('tipoVenta');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const where: any = {};
    if (tipoVenta) {
      where.tipoVenta = tipoVenta;
    }

    // Obtener registros de auditoría
    const [registros, total] = await Promise.all([
      prisma.auditoriaEliminacion.findMany({
        where,
        orderBy: { fechaEliminacion: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditoriaEliminacion.count({ where })
    ]);

    return NextResponse.json({
      registros,
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error fetching auditoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

