import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  console.log('🔍 [VERIFY TEMPLATE] Verificando plantilla en producción...');
  
  try {
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({
        success: false,
        error: 'Template file not found',
        path: templatePath
      }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'utf-8');
    const stats = fs.statSync(templatePath);
    
    // Verificar contenido específico
    const hasCuotasPendientes = content.includes('Cuotas Pendientes');
    const hasNoteDiPagamento = content.includes('Note di Pagamento');
    const fontSize = content.match(/font-size:\s*(\d+)px/);
    const logoHeight = content.match(/\.logo\s*\{[^}]*height:\s*(\d+)px/);
    const headerFontSize = content.match(/\.header-title h1[^}]*font-size:\s*(\d+)px/);
    
    console.log('🔍 [VERIFY TEMPLATE] Verificación completada');
    
    return NextResponse.json({
      success: true,
      template: {
        path: templatePath,
        size: content.length,
        lastModified: stats.mtime.toISOString(),
        fileSize: stats.size
      },
      content: {
        hasCuotasPendientes,
        hasNoteDiPagamento,
        fontSize: fontSize ? fontSize[1] + 'px' : 'Not found',
        logoHeight: logoHeight ? logoHeight[1] + 'px' : 'Not found',
        headerFontSize: headerFontSize ? headerFontSize[1] + 'px' : 'Not found'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        cwd: process.cwd()
      }
    });

  } catch (error) {
    console.error('❌ [VERIFY TEMPLATE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
