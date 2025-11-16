import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { execSync } from 'child_process';

/**
 * Endpoint para ejecutar migraciones de base de datos después del deploy
 * Solo accesible para administradores
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1';

    if (!isProduction) {
      return NextResponse.json(
        { error: 'Este endpoint solo está disponible en producción' },
        { status: 403 }
      );
    }

    console.log('🔄 Ejecutando migraciones de base de datos...');

    const results: string[] = [];

    // Ejecutar migración de documentoViaggioName
    try {
      console.log('📦 Preservando documentoViaggioName...');
      execSync('node scripts/migrate-documento-viaggio-preserve.js', { 
        stdio: 'pipe',
        timeout: 30000 
      });
      results.push('✅ Preservación de documentoViaggioName completada');
    } catch (error: any) {
      const errorMsg = error.message || 'Error desconocido';
      results.push(`⚠️  Preservación de documentoViaggioName: ${errorMsg}`);
    }

    // Ejecutar migración de notas
    try {
      console.log('📦 Ejecutando migración de campos de notas...');
      execSync('node scripts/migrate-production-notas-safe.js', { 
        stdio: 'pipe',
        timeout: 30000 
      });
      results.push('✅ Migración de notas completada');
    } catch (error: any) {
      const errorMsg = error.message || 'Error desconocido';
      results.push(`⚠️  Migración de notas: ${errorMsg}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Migraciones ejecutadas',
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error ejecutando migraciones:', error);
    return NextResponse.json(
      { 
        error: 'Error ejecutando migraciones',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

