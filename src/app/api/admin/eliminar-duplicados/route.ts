import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/eliminar-duplicados
 * 
 * Elimina clientes duplicados basándose en firstName + lastName
 * Mantiene el registro más antiguo y elimina los nuevos
 * 
 * Solo accesible para ADMIN/TI
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, id: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TI')) {
      return NextResponse.json({
        error: 'Solo administradores pueden ejecutar esta acción'
      }, { status: 403 });
    }

    console.log('🔍 Iniciando limpieza de duplicados en producción...');

    // Obtener todos los clientes ordenados por fecha de creación
    const todosClientes = await prisma.client.findMany({
      orderBy: {
        createdAt: 'asc' // El más antiguo primero
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true
      }
    });

    console.log(`📊 Total de clientes: ${todosClientes.length}`);

    // Agrupar por nombre + apellido
    const gruposPorNombre: Record<string, typeof todosClientes> = {};
    
    todosClientes.forEach(cliente => {
      const key = `${cliente.firstName.trim().toLowerCase()}|${(cliente.lastName || '').trim().toLowerCase()}`;
      
      if (!gruposPorNombre[key]) {
        gruposPorNombre[key] = [];
      }
      
      gruposPorNombre[key].push(cliente);
    });

    // Encontrar duplicados (grupos con más de 1 cliente)
    const duplicados = Object.entries(gruposPorNombre)
      .filter(([key, clientes]) => clientes.length > 1)
      .map(([key, clientes]) => ({
        nombre: key.split('|')[0],
        apellido: key.split('|')[1],
        clientes: clientes.sort((a, b) => 
          a.createdAt.getTime() - b.createdAt.getTime()
        ),
        cantidad: clientes.length
      }));

    console.log(`🔍 Duplicados encontrados: ${duplicados.length} grupos`);

    if (duplicados.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron duplicados',
        resultados: {
          total: todosClientes.length,
          duplicadosEncontrados: 0,
          eliminados: 0,
          restantes: todosClientes.length
        }
      });
    }

    // Calcular total a eliminar
    let totalAEliminar = 0;
    const detallesEliminacion: Array<{
      nombre: string;
      apellido: string;
      mantenidos: number;
      eliminados: number;
    }> = [];

    duplicados.forEach(grupo => {
      const mantener = grupo.clientes[0]; // El más antiguo
      const eliminar = grupo.clientes.slice(1); // Los demás
      
      totalAEliminar += eliminar.length;
      
      detallesEliminacion.push({
        nombre: grupo.nombre,
        apellido: grupo.apellido,
        mantenidos: 1,
        eliminados: eliminar.length
      });
    });

    // Eliminar duplicados (mantener el más antiguo)
    let eliminados = 0;
    const errores: Array<{ nombre: string; error: string }> = [];

    for (const grupo of duplicados) {
      const mantener = grupo.clientes[0];
      const idsAEliminar = grupo.clientes.slice(1).map(c => c.id);

      try {
        const resultado = await prisma.client.deleteMany({
          where: {
            id: {
              in: idsAEliminar
            }
          }
        });

        eliminados += resultado.count;
        console.log(`✅ Eliminados ${resultado.count} duplicados de "${grupo.nombre} ${grupo.apellido}"`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.error(`❌ Error eliminando duplicados:`, errorMsg);
        errores.push({
          nombre: `${grupo.nombre} ${grupo.apellido}`,
          error: errorMsg
        });
      }
    }

    // Verificar resultado final
    const finalCount = await prisma.client.count();

    return NextResponse.json({
      success: true,
      message: 'Limpieza de duplicados completada',
      resultados: {
        totalInicial: todosClientes.length,
        duplicadosEncontrados: duplicados.length,
        eliminados: eliminados,
        restantes: finalCount
      },
      detalles: detallesEliminacion.slice(0, 50), // Primeros 50 para no sobrecargar
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error('❌ Error en la limpieza de duplicados:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

