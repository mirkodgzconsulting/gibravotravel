import { NextResponse } from 'next/server';
import { prisma, reconnectPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Verificar conexión básica con timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ]);
    
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
    const totalConn = Number(metricsData.total_connections);
    const activeConn = Number(metricsData.active_connections);
    const idleConn = Number(metricsData.idle_connections);
    
    // Detección automática de saturación crítica
    let shouldReconnect = false;
    let warning = null;
    
    if (totalConn >= 45) {
      shouldReconnect = true;
      warning = 'CRITICAL: Pool saturation detected, attempting reconnection...';
    } else if (totalConn >= 35 && activeConn >= 30) {
      warning = 'WARNING: High active connections, monitor closely';
    }
    
    // Intentar reconexión automática si es crítico
    if (shouldReconnect) {
      try {
        await reconnectPrisma();
        warning += ' SUCCESS: Reconnection completed';
      } catch (reconnectError) {
        warning += ' FAILED: Reconnection failed';
      }
    }
    
    return NextResponse.json({
      status: shouldReconnect ? 'reconnecting' : 'healthy',
      database: {
        status: 'connected',
        timestamp: new Date().toISOString()
      },
      metrics: {
        total_connections: totalConn,
        active_connections: activeConn,
        idle_connections: idleConn
      },
      ...(warning && { warning }),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    // Intentar reconexión automática ante error
    try {
      await reconnectPrisma();
      return NextResponse.json({
        status: 'recovered',
        error: 'Connection failed but reconnection successful',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } catch (reconnectError) {
      return NextResponse.json(
        { 
          status: 'unhealthy',
          error: 'Health check failed and reconnection failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  }
}
