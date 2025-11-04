import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST - Agregar nuevos IATAs a la tabla iata
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

    console.log('🔄 Iniciando agregación de IATAs...');

    // Obtener IATAs actuales
    const currentIatas = await prisma.iata.findMany({
      orderBy: { iata: 'asc' }
    });

    // Nuevos IATAs a agregar
    const nuevosIatas = [
      'Shop online',
      'Safer',
      'Dhl',
      'Tbo',
      'Jump Travel',
      'GetYourGuide',
      'Civitatis',
      'Dinamico kkm',
      'Booking hotel'
    ];

    let agregados = 0;
    let yaExistentes = 0;
    const iatasAgregados: string[] = [];
    const iatasExistentes: string[] = [];

    for (const iata of nuevosIatas) {
      try {
        // Verificar si ya existe (case-insensitive)
        const existe = currentIatas.some(i => 
          i.iata.toLowerCase() === iata.toLowerCase()
        );

        if (existe) {
          // Si existe, asegurarnos de que esté activo
          await prisma.iata.updateMany({
            where: {
              iata: {
                equals: iata,
                mode: 'insensitive'
              }
            },
            data: { isActive: true }
          });
          yaExistentes++;
          iatasExistentes.push(iata);
        } else {
          // Crear nuevo IATA
          await prisma.iata.create({
            data: {
              iata: iata,
              isActive: true
            }
          });
          agregados++;
          iatasAgregados.push(iata);
        }
      } catch (error: any) {
        // Si es error de duplicado único, ignorar
        if (error.code === 'P2002') {
          yaExistentes++;
          iatasExistentes.push(iata);
        } else {
          console.error(`Error al agregar "${iata}":`, error);
        }
      }
    }

    // Obtener IATAs finales
    const finalIatas = await prisma.iata.findMany({
      where: { isActive: true },
      orderBy: { iata: 'asc' }
    });

    console.log(`✅ Proceso completado. Agregados: ${agregados}, Existentes: ${yaExistentes}`);

    return NextResponse.json({
      success: true,
      message: `Se procesaron ${nuevosIatas.length} IATAs`,
      agregados,
      yaExistentes,
      iatasAgregados,
      iatasExistentes,
      totalIatas: finalIatas.length
    });

  } catch (error) {
    console.error('❌ Error en agregar IATAs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

