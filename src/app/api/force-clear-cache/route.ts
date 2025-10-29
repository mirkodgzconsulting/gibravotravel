import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    // Revalidar el path del template
    revalidatePath('/templates/ricevuta-template.html');
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared for template path',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

