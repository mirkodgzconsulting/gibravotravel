import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST - Agregar nuevos servicios a la tabla servizio
 * Solo accesible para usuarios TI o ADMIN
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario es TI o ADMIN
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || !['TI', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para acceder' }, { status: 403 });
    }

    console.log('🔄 Iniciando agregación de servicios...');

    // Obtener servicios actuales
    const currentServicios = await prisma.servizio.findMany({
      orderBy: { servizio: 'asc' }
    });

    // Nuevos servicios a agregar
    const nuevosServicios = [
      'Volo',
      'Corriere',
      'Fideiussione',
      'Etias',
      'Esta',
      'Eta',
      'Caf',
      'Transfer',
      'Bus',
      'Tkt'
    ];

    let agregados = 0;
    let yaExistentes = 0;
    const serviciosAgregados: string[] = [];
    const serviciosExistentes: string[] = [];

    for (const servicio of nuevosServicios) {
      try {
        // Verificar si ya existe (case-insensitive)
        const existe = currentServicios.some(s => 
          s.servizio.toLowerCase() === servicio.toLowerCase()
        );

        if (existe) {
          // Si existe, asegurarnos de que esté activo
          await prisma.servizio.updateMany({
            where: {
              servizio: {
                equals: servicio,
                mode: 'insensitive'
              }
            },
            data: { isActive: true }
          });
          yaExistentes++;
          serviciosExistentes.push(servicio);
        } else {
          // Crear nuevo servicio
          await prisma.servizio.create({
            data: {
              servizio: servicio,
              isActive: true
            }
          });
          agregados++;
          serviciosAgregados.push(servicio);
        }
      } catch (error: any) {
        // Si es error de duplicado único, ignorar
        if (error.code === 'P2002') {
          yaExistentes++;
          serviciosExistentes.push(servicio);
        } else {
          console.error(`Error al agregar "${servicio}":`, error);
        }
      }
    }

    // Obtener servicios finales
    const finalServicios = await prisma.servizio.findMany({
      where: { isActive: true },
      orderBy: { servizio: 'asc' }
    });

    console.log(`✅ Proceso completado. Agregados: ${agregados}, Existentes: ${yaExistentes}`);

    return NextResponse.json({
      success: true,
      message: `Se procesaron ${nuevosServicios.length} servicios`,
      agregados,
      yaExistentes,
      serviciosAgregados,
      serviciosExistentes,
      totalServicios: finalServicios.length
    });

  } catch (error) {
    console.error('❌ Error en agregar servicios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

