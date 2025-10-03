import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Verificar autenticación
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario es ADMIN o TI
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || !['ADMIN', 'TI'].includes(user.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener estadísticas de la migración
    const [
      totalClients,
      clientsWithEmail,
      clientsWithFiscalCode,
      clientsWithoutEmail,
      recentClients
    ] = await Promise.all([
      // Total de clientes
      prisma.client.count(),
      
      // Clientes con email real (no temporal)
      prisma.client.count({
        where: {
          email: {
            not: {
              contains: '@temp.com'
            }
          }
        }
      }),
      
      // Clientes con código fiscal válido
      prisma.client.count({
        where: {
          fiscalCode: {
            not: 'N/A'
          }
        }
      }),
      
      // Clientes con email temporal
      prisma.client.count({
        where: {
          email: {
            contains: '@temp.com'
          }
        }
      }),
      
      // Últimos 10 clientes registrados
      prisma.client.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          fiscalCode: true,
          createdAt: true
        }
      })
    ]);

    const stats = {
      totalClients,
      clientsWithEmail,
      clientsWithFiscalCode,
      clientsWithoutEmail,
      recentClients
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
