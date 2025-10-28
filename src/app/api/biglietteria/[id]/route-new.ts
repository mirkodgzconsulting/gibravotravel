import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
  api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
});

// GET - Obtener un registro específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const record = await prisma.biglietteria.findUnique({
      where: { id },
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        pasajeros: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!record) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Verificar si el usuario tiene rol USER y si puede acceder a este registro
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, firstName: true, lastName: true }
    });

    if (user?.role === 'USER') {
      const createdBy = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (record.creadoPor !== createdBy) {
        return NextResponse.json({ error: 'No tienes permisos para acceder a este registro' }, { status: 403 });
      }
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar un registro existente con múltiples pasajeros
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    
    // Verificar que el registro existe
    const existingRecord = await prisma.biglietteria.findUnique({
      where: { id },
      include: {
        pasajeros: true,
        cuotas: true
      }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Obtener FormData
    const formData = await request.formData();
    
    // Extraer campos básicos
    const cliente = formData.get('cliente') as string;
    const codiceFiscale = formData.get('codiceFiscale') as string;
    const indirizzo = formData.get('indirizzo') as string;
    const email = formData.get('email') as string;
    const numeroTelefono = formData.get('numeroTelefono') as string;
    const pagamento = formData.get('pagamento') as string;
    const data = formData.get('data') as string;
    const iata = formData.get('iata') as string;
    const pnr = formData.get('pnr') as string;
    const itinerario = formData.get('itinerario') as string;
    const metodoPagamento = formData.get('metodoPagamento') as string;
    const numeroPasajeros = parseInt(formData.get('numeroPasajeros') as string) || 1;
    const acconto = formData.get('acconto') as string;
    const numeroCuotas = parseInt(formData.get('numeroCuotas') as string) || 0;
    const cuotasJson = formData.get('cuotas') as string;
    
    // Obtener pasajeros
    const pasajerosJson = formData.get('pasajeros') as string;
    const pasajeros = pasajerosJson ? JSON.parse(pasajerosJson) : [];
    
    console.log('📊 Actualizando con número de pasajeros:', pasajeros.length);

    // Calcular totales
    let netoPrincipal = 0;
    let vendutoTotal = 0;
    
    pasajeros.forEach((pasajero: any) => {
      // Sumar Biglietteria
      if (pasajero.netoBiglietteria) netoPrincipal += parseFloat(pasajero.netoBiglietteria) || 0;
      if (pasajero.vendutoBiglietteria) vendutoTotal += parseFloat(pasajero.vendutoBiglietteria) || 0;
      
      // Sumar servicios adicionales
      if (pasajero.tieneExpress) {
        if (pasajero.netoExpress) netoPrincipal += parseFloat(pasajero.netoExpress) || 0;
        if (pasajero.vendutoExpress) vendutoTotal += parseFloat(pasajero.vendutoExpress) || 0;
      }
      if (pasajero.tienePolizza) {
        if (pasajero.netoPolizza) netoPrincipal += parseFloat(pasajero.netoPolizza) || 0;
        if (pasajero.vendutoPolizza) vendutoTotal += parseFloat(pasajero.vendutoPolizza) || 0;
      }
      if (pasajero.tieneLetteraInvito) {
        if (pasajero.netoLetteraInvito) netoPrincipal += parseFloat(pasajero.netoLetteraInvito) || 0;
        if (pasajero.vendutoLetteraInvito) vendutoTotal += parseFloat(pasajero.vendutoLetteraInvito) || 0;
      }
      if (pasajero.tieneHotel) {
        if (pasajero.netoHotel) netoPrincipal += parseFloat(pasajero.netoHotel) || 0;
        if (pasajero.vendutoHotel) vendutoTotal += parseFloat(pasajero.vendutoHotel) || 0;
      }
    });
    
    const accontoValue = acconto ? parseFloat(acconto) : 0;
    const daPagare = vendutoTotal - accontoValue;
    const feeAgv = vendutoTotal - netoPrincipal;
    
    console.log('💰 Totales recalculados:', { netoPrincipal, vendutoTotal, accontoValue, daPagare, feeAgv });

    // Procesar fecha
    let fechaProcesada;
    try {
      fechaProcesada = data ? new Date(data) : new Date();
      if (isNaN(fechaProcesada.getTime())) {
        fechaProcesada = new Date();
      }
    } catch (error) {
      fechaProcesada = new Date();
    }

    // Subir archivo principal a Cloudinary si existe
    const file = formData.get('file') as File | null;
    let attachedFileUrl = existingRecord.attachedFile;
    let attachedFileName = existingRecord.attachedFileName;
    
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
        const resourceType = isImage ? 'image' : 'raw';
        
        const result = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'gibravotravel/biglietteria',
              resource_type: resourceType
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });
        
        attachedFileUrl = result.secure_url;
        attachedFileName = file.name;
        console.log('📎 Archivo principal actualizado:', attachedFileName);
      } catch (error) {
        console.error('Error uploading main file:', error);
      }
    }

    // Procesar cuotas
    const cuotas = cuotasJson ? JSON.parse(cuotasJson) : [];
    const cuotasConArchivos: any[] = [];
    
    if (numeroCuotas > 0 && cuotas.length > 0) {
      for (let i = 0; i < cuotas.length; i++) {
        const cuota = cuotas[i];
        const cuotaFile = formData.get(`cuotaFile${i}`) as File | null;
        
        let cuotaFileUrl = null;
        let cuotaFileName = null;
        
        // Si la cuota ya tiene un archivo, mantenerlo
        const existingCuota = existingRecord.cuotas.find(c => c.numeroCuota === cuota.numeroCuota);
        if (existingCuota) {
          cuotaFileUrl = existingCuota.attachedFile;
          cuotaFileName = existingCuota.attachedFileName;
        }
        
        if (cuotaFile && cuotaFile.size > 0) {
          try {
            const bytes = await cuotaFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const fileExtension = cuotaFile.name.toLowerCase().split('.').pop();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
            const resourceType = isImage ? 'image' : 'raw';
            
            const result = await new Promise<any>((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                {
                  folder: 'gibravotravel/biglietteria/cuotas',
                  resource_type: resourceType
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              ).end(buffer);
            });
            
            cuotaFileUrl = result.secure_url;
            cuotaFileName = cuotaFile.name;
            console.log(`📎 Archivo cuota ${i + 1} actualizado:`, cuotaFileName);
          } catch (error) {
            console.error(`Error uploading cuota file ${i}:`, error);
          }
        }
        
        cuotasConArchivos.push({
          numeroCuota: cuota.numeroCuota,
          data: cuota.data ? new Date(cuota.data) : null,
          prezzo: parseFloat(cuota.prezzo),
          note: cuota.note || null,
          isPagato: cuota.isPagato || false,
          attachedFile: cuotaFileUrl,
          attachedFileName: cuotaFileName
        });
      }
    }

    // Preparar datos de pasajeros para actualizar
    const pasajerosParaCrear = pasajeros.map((pasajero: any) => {
      // Procesar fechas
      let andataProcesada = null;
      let ritornoProcesada = null;
      
      if (pasajero.andata) {
        try {
          andataProcesada = new Date(pasajero.andata);
          if (isNaN(andataProcesada.getTime())) {
            andataProcesada = null;
          }
        } catch (error) {
          andataProcesada = null;
        }
      }
      
      if (pasajero.ritorno) {
        try {
          ritornoProcesada = new Date(pasajero.ritorno);
          if (isNaN(ritornoProcesada.getTime())) {
            ritornoProcesada = null;
          }
        } catch (error) {
          ritornoProcesada = null;
        }
      }
      
      return {
        nombrePasajero: pasajero.nombrePasajero,
        servizio: pasajero.servizio,
        andata: andataProcesada,
        ritorno: ritornoProcesada,
        netoBiglietteria: pasajero.netoBiglietteria ? parseFloat(pasajero.netoBiglietteria) : null,
        vendutoBiglietteria: pasajero.vendutoBiglietteria ? parseFloat(pasajero.vendutoBiglietteria) : null,
        tieneExpress: pasajero.tieneExpress || false,
        netoExpress: pasajero.netoExpress ? parseFloat(pasajero.netoExpress) : null,
        vendutoExpress: pasajero.vendutoExpress ? parseFloat(pasajero.vendutoExpress) : null,
        tienePolizza: pasajero.tienePolizza || false,
        netoPolizza: pasajero.netoPolizza ? parseFloat(pasajero.netoPolizza) : null,
        vendutoPolizza: pasajero.vendutoPolizza ? parseFloat(pasajero.vendutoPolizza) : null,
        tieneLetteraInvito: pasajero.tieneLetteraInvito || false,
        netoLetteraInvito: pasajero.netoLetteraInvito ? parseFloat(pasajero.netoLetteraInvito) : null,
        vendutoLetteraInvito: pasajero.vendutoLetteraInvito ? parseFloat(pasajero.vendutoLetteraInvito) : null,
        tieneHotel: pasajero.tieneHotel || false,
        netoHotel: pasajero.netoHotel ? parseFloat(pasajero.netoHotel) : null,
        vendutoHotel: pasajero.vendutoHotel ? parseFloat(pasajero.vendutoHotel) : null
      };
    });

    // Actualizar registro en la base de datos con transacción
    const record = await prisma.$transaction(async (tx) => {
      // 1. Eliminar pasajeros existentes
      await tx.pasajeroBiglietteria.deleteMany({
        where: { biglietteriaId: id }
      });

      // 2. Eliminar cuotas existentes
      await tx.cuota.deleteMany({
        where: { biglietteriaId: id }
      });

      // 3. Actualizar registro principal
      return await tx.biglietteria.update({
        where: { id },
        data: {
          cliente,
          codiceFiscale,
          indirizzo,
          email,
          numeroTelefono,
          pagamento,
          data: fechaProcesada,
          pnr: pnr || null,
          itinerario,
          metodoPagamento,
          numeroPasajeros,
          netoPrincipal,
          vendutoTotal,
          acconto: accontoValue,
          daPagare,
          feeAgv,
          attachedFile: attachedFileUrl,
          attachedFileName: attachedFileName,
          numeroCuotas: numeroCuotas > 0 ? numeroCuotas : null,
          pasajeros: {
            create: pasajerosParaCrear
          },
          cuotas: cuotasConArchivos.length > 0 ? {
            create: cuotasConArchivos
          } : undefined
        },
        include: {
          cuotas: true,
          pasajeros: true
        }
      });
    });

    console.log('✅ Registro actualizado exitosamente:', record.id);
    console.log('👥 Pasajeros actualizados:', record.pasajeros.length);
    
    return NextResponse.json(record);

  } catch (error) {
    console.error('❌ Error updating biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar un registro
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el registro existe
    const existingRecord = await prisma.biglietteria.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Soft delete: marcar como inactivo
    await prisma.biglietteria.update({
      where: { id },
      data: { isActive: false }
    });

    console.log('✅ Registro eliminado (soft delete):', id);
    
    return NextResponse.json({ message: 'Registro eliminado correctamente' });

  } catch (error) {
    console.error('❌ Error deleting biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}


