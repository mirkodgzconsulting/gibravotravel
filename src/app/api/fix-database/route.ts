import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    // Verificar que estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL === '1' ||
                        process.env.DATABASE_URL?.includes('postgresql://');

    if (!isProduction) {
      return NextResponse.json({ 
        message: 'Solo disponible en producción',
        success: false 
      }, { status: 403 });
    }

    console.log('🔧 Iniciando reparación de base de datos...');

    const results = [];

    try {
      // 1. Diagnosticar problemas
      console.log('1. Ejecutando diagnóstico...');
      execSync('node scripts/diagnose-production.js', { stdio: 'pipe' });
      results.push('✅ Diagnóstico completado');

      // 2. Reparar base de datos
      console.log('2. Reparando base de datos...');
      execSync('node scripts/fix-production-database.js', { stdio: 'pipe' });
      results.push('✅ Base de datos reparada');

      // 3. Verificar configuración
      console.log('3. Verificando configuración...');
      execSync('node scripts/verify-production-setup.js', { stdio: 'pipe' });
      results.push('✅ Configuración verificada');

      console.log('✅ Reparación completada exitosamente!');

      return NextResponse.json({
        message: 'Base de datos reparada exitosamente',
        success: true,
        results: results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error durante reparación:', error);
      
      return NextResponse.json({
        message: 'Error durante reparación',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        results: results,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error en endpoint:', error);
    
    return NextResponse.json({
      message: 'Error interno del servidor',
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Fix database endpoint - Use POST para ejecutar reparación',
    success: true,
    timestamp: new Date().toISOString()
  });
}
