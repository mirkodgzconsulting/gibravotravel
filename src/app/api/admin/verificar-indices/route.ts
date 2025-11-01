import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Listar índices
    const indexes = await prisma.$queryRaw<Array<{
      schemaname: string;
      tablename: string;
      indexname: string;
      indexdef: string;
    }>>`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `;

    // Agrupar por tabla
    const indicesPorTabla: Record<string, string[]> = {};
    indexes.forEach(idx => {
      if (!indicesPorTabla[idx.tablename]) {
        indicesPorTabla[idx.tablename] = [];
      }
      indicesPorTabla[idx.tablename].push(idx.indexname);
    });

    // Verificar índices críticos
    const indicesCriticos = [
      'idx_biglietteria_created_by',
      'idx_biglietteria_active_data',
      'idx_tour_bus_fecha_viaje',
      'idx_tour_bus_active_fecha',
      'idx_tour_aereo_fecha_viaje',
      'idx_tour_aereo_active_fecha'
    ].map(nombre => ({
      nombre,
      presente: indexes.some(idx => idx.indexname === nombre)
    }));

    // Test de performance
    const start = Date.now();
    await prisma.biglietteria.findMany({
      where: { isActive: true },
      take: 10
    });
    const testPerformance = Date.now() - start;

    return NextResponse.json({
      totalIndices: indexes.length,
      tablasIndexadas: Object.keys(indicesPorTabla).length,
      indicesPorTabla,
      indicesCriticos,
      testPerformance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verificando índices:', error);
    return NextResponse.json(
      { error: 'Error verificando índices' },
      { status: 500 }
    );
  }
}

