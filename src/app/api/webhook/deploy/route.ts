import { NextRequest, NextResponse } from 'next/server';
import { execSync } = 'child_process';

export async function POST(request: NextRequest) {
  try {
    // Verificar que es un webhook de Vercel
    const vercelSignature = request.headers.get('x-vercel-signature');
    if (!vercelSignature) {
      return NextResponse.json({ 
        message: 'No autorizado',
        success: false 
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Verificar que es un deploy exitoso
    if (body.type !== 'deployment.succeeded') {
      return NextResponse.json({ 
        message: 'No es un deploy exitoso',
        success: true 
      });
    }

    console.log('🚀 Webhook de deploy recibido - ejecutando auto-reparación...');

    try {
      // Ejecutar auto-reparación
      execSync('node scripts/auto-fix-production.js', { stdio: 'pipe' });
      
      console.log('✅ Auto-reparación ejecutada exitosamente');

      return NextResponse.json({
        message: 'Auto-reparación ejecutada exitosamente',
        success: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error en auto-reparación:', error);
      
      return NextResponse.json({
        message: 'Error en auto-reparación',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    
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
    message: 'Webhook de deploy - Use POST para ejecutar auto-reparación',
    success: true,
    timestamp: new Date().toISOString()
  });
}
