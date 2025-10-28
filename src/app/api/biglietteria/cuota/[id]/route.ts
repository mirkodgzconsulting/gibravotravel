import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// PATCH - Actualizar estado de pago de una cuota
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isPagato } = body;

    // Actualizar la cuota
    const cuota = await prisma.cuota.update({
      where: { id },
      data: { isPagato },
      include: {
        biglietteria: {
          include: {
            cuotas: true
          }
        }
      }
    });

    // Recalcular Acconto y daPagare
    const biglietteria = cuota.biglietteria;
    
    // Calcular el total pagado de todas las cuotas marcadas como pagadas
    const totalCuotasPagadas = biglietteria.cuotas
      .filter(c => c.isPagato)
      .reduce((sum, c) => sum + c.prezzo, 0);
    
    // Obtener el acconto inicial (antes de cuotas)
    // Si hay cuotas, el acconto inicial es: venduto - (suma de todas las cuotas)
    const totalCuotas = biglietteria.cuotas.reduce((sum, c) => sum + c.prezzo, 0);
    const accontoInicial = biglietteria.vendutoTotal - totalCuotas;
    
    // El nuevo acconto es: accontoInicial + totalCuotasPagadas
    const nuevoAcconto = accontoInicial + totalCuotasPagadas;
    
    // El nuevo daPagare es: vendutoTotal - nuevoAcconto
    const nuevoDaPagare = Math.max(0, biglietteria.vendutoTotal - nuevoAcconto);

    // Actualizar biglietteria con el nuevo Acconto y daPagare
    const updatedBiglietteria = await prisma.biglietteria.update({
      where: { id: biglietteria.id },
      data: { 
        acconto: nuevoAcconto,
        daPagare: nuevoDaPagare 
      },
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        }
      }
    });

    return NextResponse.json({ 
      cuota,
      biglietteria: updatedBiglietteria,
      message: 'Estado de cuota actualizado exitosamente' 
    });

  } catch (error) {
    console.error('❌ Error updating cuota:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}

