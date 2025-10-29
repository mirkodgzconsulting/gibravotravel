import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  console.log('🔍 [SHOW TEMPLATE] Mostrando plantilla actual...');
  
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
    
    // Buscar contenido específico
    const cuotasPendientesMatch = content.match(/Cuotas Pendientes/);
    const noteDiPagamentoMatch = content.match(/Note di Pagamento/);
    const fontSizeMatch = content.match(/font-size:\s*(\d+)px/);
    const logoHeightMatch = content.match(/\.logo\s*\{[^}]*height:\s*(\d+)px/);
    
    console.log('🔍 [SHOW TEMPLATE] Análisis completado');
    
    return NextResponse.json({
      success: true,
      template: {
        path: templatePath,
        size: content.length,
        lastModified: stats.mtime.toISOString(),
        fileSize: stats.size
      },
      analysis: {
        hasCuotasPendientes: !!cuotasPendientesMatch,
        hasNoteDiPagamento: !!noteDiPagamentoMatch,
        fontSize: fontSizeMatch ? fontSizeMatch[1] + 'px' : 'Not found',
        logoHeight: logoHeightMatch ? logoHeightMatch[1] + 'px' : 'Not found',
        cuotasPendientesLine: cuotasPendientesMatch ? cuotasPendientesMatch[0] : null,
        noteDiPagamentoLine: noteDiPagamentoMatch ? noteDiPagamentoMatch[0] : null
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        cwd: process.cwd()
      },
      // Mostrar las primeras 500 caracteres del archivo
      preview: content.substring(0, 500) + '...'
    });

  } catch (error) {
    console.error('❌ [SHOW TEMPLATE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
