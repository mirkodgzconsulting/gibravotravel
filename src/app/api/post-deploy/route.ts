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
        message: 'Entorno de desarrollo detectado - saltando post-deploy',
        success: true 
      });
    }

    console.log('🌍 Entorno de producción detectado');
    console.log('🔧 Ejecutando configuración post-deploy...\n');

    const results = [];

    // 1. Ejecutar migraciones de Prisma (seguras, no borran datos)
    console.log('1. Ejecutando migraciones de Prisma...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'pipe', timeout: 60000 });
      results.push('✅ Migraciones de Prisma aplicadas');
    } catch (error: any) {
      const errorMsg = error.message || 'Error desconocido';
      results.push(`⚠️  Migraciones de Prisma: ${errorMsg}`);
      console.log('⚠️  Error en migraciones, continuando...');
    }

    // 2. Verificar usuarios de prueba
    console.log('\n2. Verificando usuarios de prueba...');
    try {
      execSync('node scripts/check-test-users.js', { stdio: 'pipe' });
      results.push('✅ Usuarios de prueba verificados');
    } catch (error) {
      console.log('⚠️  Error verificando usuarios, creando...');
      execSync('node scripts/create-test-users.js', { stdio: 'pipe' });
      results.push('✅ Usuarios de prueba creados');
    }

    // 3. Verificar configuración general
    console.log('\n3. Verificando configuración general...');
    try {
      execSync('node scripts/verify-production-setup.js', { stdio: 'pipe' });
      results.push('✅ Configuración general verificada');
    } catch (error) {
      results.push('⚠️  Error verificando configuración general');
    }

    console.log('\n✅ Post-deploy completado exitosamente!');

    return NextResponse.json({
      message: 'Post-deploy completado exitosamente',
      success: true,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error durante post-deploy:', error);
    
    return NextResponse.json({
      message: 'Error durante post-deploy',
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Post-deploy endpoint - Use POST para ejecutar',
    success: true,
    timestamp: new Date().toISOString()
  });
}
