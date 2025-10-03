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

    console.log('🔍 Verificando estado de la base de datos...');

    // Obtener estadísticas básicas
    const [
      totalClients,
      clientsWithTempEmail,
      clientsWithRealEmail,
      clientsWithFiscalCode,
      recentClients,
      oldestClients
    ] = await Promise.all([
      // Total de clientes
      prisma.client.count(),
      
      // Clientes con email temporal
      prisma.client.count({
        where: {
          email: {
            contains: '@temp.com'
          }
        }
      }),
      
      // Clientes con email real
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
      
      // Últimos 5 clientes registrados
      prisma.client.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          fiscalCode: true,
          createdAt: true,
          createdBy: true
        }
      }),
      
      // Primeros 5 clientes registrados
      prisma.client.findMany({
        take: 5,
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          fiscalCode: true,
          createdAt: true,
          createdBy: true
        }
      })
    ]);

    // Verificar si hay clientes creados por tu usuario
    const yourClients = await prisma.client.count({
      where: {
        createdBy: userId
      }
    });

    // Obtener fechas de creación
    const dateRange = await prisma.client.findMany({
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 1
    });

    const latestDate = await prisma.client.findMany({
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });

    const result = {
      success: true,
      summary: {
        totalClients,
        clientsWithTempEmail,
        clientsWithRealEmail,
        clientsWithFiscalCode,
        yourClients,
        migrationCompleted: totalClients > 4000, // Si hay más de 4000, probablemente la migración se completó
        dateRange: {
          oldest: dateRange[0]?.createdAt || null,
          newest: latestDate[0]?.createdAt || null
        }
      },
      recentClients,
      oldestClients,
      message: totalClients > 4000 
        ? `✅ MIGRACIÓN COMPLETADA: ${totalClients} clientes en la base de datos`
        : totalClients > 0 
          ? `⚠️ MIGRACIÓN PARCIAL: ${totalClients} clientes encontrados`
          : `❌ NO HAY DATOS: La migración no se ha ejecutado`
    };

    console.log('📊 Resultado de verificación:', result.summary);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error al verificar base de datos:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al verificar la base de datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
