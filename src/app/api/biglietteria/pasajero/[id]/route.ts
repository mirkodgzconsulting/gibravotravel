import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

// PATCH - Actualizar un pasajero específico (estado, fechaPago, fechaActivacion)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    console.log('🔍 PATCH /api/biglietteria/pasajero/[id] - userId:', userId);
    
    if (!userId) {
      console.log('❌ No autorizado - userId missing');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    console.log('📝 Pasajero ID:', id);
    console.log('📦 Body recibido:', body);

    // Verificar que el pasajero existe
    const existingPasajero = await prisma.pasajeroBiglietteria.findUnique({
      where: { id }
    });

    if (!existingPasajero) {
      console.log('❌ Pasajero no encontrado:', id);
      return NextResponse.json({ error: 'Pasajero no encontrado' }, { status: 404 });
    }
    
    console.log('✅ Pasajero encontrado:', existingPasajero.nombrePasajero);

    // Verificar permisos del usuario (TI, ADMIN y USER pueden editar)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, firstName: true, lastName: true }
    });
    
    console.log('👤 Usuario role:', user?.role);

    if (!user || (user.role !== 'TI' && user.role !== 'ADMIN' && user.role !== 'USER')) {
      console.log('❌ Permisos insuficientes - Role:', user?.role);
      return NextResponse.json({ 
        error: 'No tienes permisos para editar este campo. Solo usuarios TI, ADMIN y USER pueden editar.' 
      }, { status: 403 });
    }

    // Preparar datos para actualizar
    const updateData: Prisma.PasajeroBiglietteriaUpdateInput = {};

    // Si se está cambiando el estado a "Pagado" y no hay fechaPago, asignar fecha actual
    if (body.estado === 'Pagado' && !existingPasajero.fechaPago && !body.fechaPago) {
      updateData.estado = 'Pagado';
      updateData.fechaPago = new Date();
    } else if (body.estado) {
      updateData.estado = body.estado;
      
      // Si se está cambiando a "Pendiente", opcionalmente se puede limpiar fechaPago
      // (comentado para mantener historial)
      // if (body.estado === 'Pendiente') {
      //   updateData.fechaPago = null;
      // }
    }

    // Actualizar fechaPago si se proporciona
    if (body.fechaPago !== undefined) {
      updateData.fechaPago = body.fechaPago ? new Date(body.fechaPago) : null;
    }

    // Actualizar fechaActivacion si se proporciona
    if (body.fechaActivacion !== undefined) {
      updateData.fechaActivacion = body.fechaActivacion ? new Date(body.fechaActivacion) : null;
    }

    // Actualizar notas si se proporciona
    if (body.notas !== undefined) {
      updateData.notas = body.notas || null;
    }

    // Actualizar el pasajero
    console.log('💾 Actualizando con datos:', updateData);
    
    const updatedPasajero = await prisma.pasajeroBiglietteria.update({
      where: { id },
      data: updateData
    });

    console.log('✅ Pasajero actualizado exitosamente:', updatedPasajero);
    return NextResponse.json(updatedPasajero);

  } catch (error) {
    console.error('❌ Error updating pasajero:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el pasajero', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

