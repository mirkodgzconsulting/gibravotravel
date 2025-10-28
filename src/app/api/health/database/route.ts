import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Verificar conexión básica
    await prisma.$queryRaw`SELECT 1`;
    
    // Obtener métricas de conexión
    const metrics = await prisma.$queryRaw<Array<{
      total_connections: bigint;
      active_connections: bigint;
      idle_connections: bigint;
    }>>`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    const metricsData = metrics[0];
    
    return NextResponse.json({
      status: 'healthy',
      database: {
        status: 'connected',
        timestamp: new Date().toISOString()
      },
      metrics: {
        total_connections: Number(metricsData.total_connections),
        active_connections: Number(metricsData.active_connections),
        idle_connections: Number(metricsData.idle_connections)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
