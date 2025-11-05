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
        pasajeros: true
      }
    });

    if (!record) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error fetching biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PUT - Actualizar un registro existente
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
    
    // Obtener FormData
    const formData = await request.formData();
    
    // Extraer campos
    const cliente = formData.get('cliente') as string;
    const codiceFiscale = formData.get('codiceFiscale') as string;
    const indirizzo = formData.get('indirizzo') as string;
    const email = formData.get('email') as string;
    const numeroTelefono = formData.get('numeroTelefono') as string;
    const pagamento = formData.get('pagamento') as string;
    const data = formData.get('data') as string;
    const pnr = formData.get('pnr') as string;
    const itinerario = formData.get('itinerario') as string;
    const metodoPagamentoJson = formData.get('metodoPagamento') as string;
    const notaDiVendita = formData.get('notaDiVendita') as string;
    const acconto = formData.get('acconto') as string;
    
    // Parsear metodoPagamento desde JSON array
    let metodoPagamento: string;
    try {
      const metodoPagamentoArray = JSON.parse(metodoPagamentoJson || '[]');
      metodoPagamento = Array.isArray(metodoPagamentoArray) && metodoPagamentoArray.length > 0
        ? JSON.stringify(metodoPagamentoArray)
        : '';
    } catch {
      // Si no es JSON válido, usar como string simple (compatibilidad)
      metodoPagamento = metodoPagamentoJson || '';
    }
    const numeroPasajeros = parseInt(formData.get('numeroPasajeros') as string) || 1;
    const numeroCuotas = parseInt(formData.get('numeroCuotas') as string) || 0;
    const cuotasJson = formData.get('cuotas') as string;
    const pasajerosJson = formData.get('pasajeros') as string;
    const file = formData.get('file') as File | null;
    
    // Obtener pasajeros
    const pasajeros = pasajerosJson ? JSON.parse(pasajerosJson) : [];
    
    console.log('📊 Número de pasajeros:', pasajeros.length);

    // Calcular totales
    let netoPrincipal = 0;
    let vendutoTotal = 0;
    
    pasajeros.forEach((pasajero: any) => {
      // Sumar Biglietteria (Volo)
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
      
      // Sumar servicios dinámicos (servicios que no son conocidos)
      if (pasajero.serviciosData && typeof pasajero.serviciosData === 'object') {
        Object.values(pasajero.serviciosData).forEach((servicioData: any) => {
          if (servicioData && typeof servicioData === 'object') {
            if (servicioData.neto) netoPrincipal += parseFloat(servicioData.neto) || 0;
            if (servicioData.venduto) vendutoTotal += parseFloat(servicioData.venduto) || 0;
          }
        });
      }
    });
    
    const accontoValue = acconto ? parseFloat(acconto) : 0;
    const daPagare = vendutoTotal - accontoValue;
    const feeAgv = vendutoTotal - netoPrincipal;
    
    console.log('💰 Totales calculados:', { netoPrincipal, vendutoTotal, accontoValue, daPagare, feeAgv });

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

    // Obtener registro existente para mantener archivos si no se suben nuevos
    const existingRecord = await prisma.biglietteria.findUnique({
      where: { id },
      include: { cuotas: true, pasajeros: true }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Subir nuevo archivo principal si existe, sino mantener el existente
    let attachedFileUrl = existingRecord.attachedFile;
    let attachedFileName = existingRecord.attachedFileName;
    
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Determinar el tipo de recurso basado en la extensión del archivo
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
      } catch (error) {
        console.error('Error uploading main file:', error);
      }
    }

    // Procesar cuotas
    const cuotas = cuotasJson ? JSON.parse(cuotasJson) : [];
    const cuotasConArchivos: Array<{
      numeroCuota: number;
      data: Date | null;
      prezzo: number;
      note: string | null;
      isPagato: boolean;
      attachedFile: string | null;
      attachedFileName: string | null;
    }> = [];
    
    if (numeroCuotas > 0 && cuotas.length > 0) {
      for (let i = 0; i < cuotas.length; i++) {
        const cuota = cuotas[i];
        const cuotaFile = formData.get(`cuotaFile${i}`) as File | null;
        
        // IMPORTANTE: Mantener archivos existentes por defecto
        let cuotaFileUrl = cuota.attachedFile || null;
        let cuotaFileName = cuota.attachedFileName || null;
        
        // Procesar archivo NUEVO de la cuota si existe
        if (cuotaFile && cuotaFile.size > 0) {
          try {
            const bytes = await cuotaFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            // Determinar el tipo de recurso basado en la extensión del archivo
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
            console.log(`📎 Archivo de cuota ${i + 1} NUEVO subido:`, cuotaFileName);
          } catch (error) {
            console.error(`Error uploading cuota file ${i}:`, error);
          }
        } else {
          // Si no hay archivo nuevo, mantener el existente
          if (cuotaFileUrl) {
            console.log(`📎 Manteniendo archivo existente de cuota ${i + 1}:`, cuotaFileName);
          }
        }
        
        cuotasConArchivos.push({
          numeroCuota: cuota.numeroCuota,
          data: cuota.data ? new Date(cuota.data) : null,
          prezzo: parseFloat(cuota.prezzo),
          note: cuota.note || null,
          isPagato: false,
          attachedFile: cuotaFileUrl,
          attachedFileName: cuotaFileName
        });
      }
    }

    // Preparar datos de pasajeros para crear
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
        servizio: Array.isArray(pasajero.servicios) ? pasajero.servicios.join(', ') : pasajero.servizio || '',
        andata: andataProcesada,
        ritorno: ritornoProcesada,
        iata: (() => {
          // Crear objeto JSON con todos los IATA específicos
          const iataObject: any = {};
          if (pasajero.iataBiglietteria) iataObject.biglietteria = pasajero.iataBiglietteria;
          if (pasajero.iataExpress) iataObject.express = pasajero.iataExpress;
          if (pasajero.iataPolizza) iataObject.polizza = pasajero.iataPolizza;
          if (pasajero.iataLetteraInvito) iataObject.letteraInvito = pasajero.iataLetteraInvito;
          if (pasajero.iataHotel) iataObject.hotel = pasajero.iataHotel;
          
          // Agregar IATA de servicios dinámicos
          if (pasajero.serviciosData) {
            Object.entries(pasajero.serviciosData).forEach(([servicioKey, servicioData]: [string, any]) => {
              if (servicioData.iata) {
                const servicioKeyLower = servicioKey.toLowerCase();
                iataObject[servicioKeyLower] = servicioData.iata;
              }
            });
          }
          
          // Si hay IATA específicos, guardar como JSON; si no, usar el campo iata legacy para compatibilidad
          if (Object.keys(iataObject).length > 0) {
            return JSON.stringify(iataObject);
          }
          // Compatibilidad con registros antiguos
          return pasajero.iata || null;
        })(),
        netoBiglietteria: pasajero.netoBiglietteria ? parseFloat(pasajero.netoBiglietteria) : null,
        vendutoBiglietteria: pasajero.vendutoBiglietteria ? parseFloat(pasajero.vendutoBiglietteria) : null,
        tieneExpress: pasajero.tieneExpress || false,
        netoExpress: pasajero.netoExpress ? parseFloat(pasajero.netoExpress) : null,
        vendutoExpress: pasajero.vendutoExpress ? parseFloat(pasajero.vendutoExpress) : null,
        tienePolizza: pasajero.tienePolizza || false,
        netoPolizza: pasajero.netoPolizza ? parseFloat(pasajero.netoPolizza) : null,
        vendutoPolizza: pasajero.vendutoPolizza ? parseFloat(pasajero.vendutoPolizza) : null,
        // Nuevos campos para estado y fechas - preservar valores existentes o usar defaults
        estado: pasajero.estado || 'Pendiente',
        fechaPago: pasajero.fechaPago ? new Date(pasajero.fechaPago) : null,
        fechaActivacion: pasajero.fechaActivacion ? new Date(pasajero.fechaActivacion) : null,
        tieneLetteraInvito: pasajero.tieneLetteraInvito || false,
        netoLetteraInvito: pasajero.netoLetteraInvito ? parseFloat(pasajero.netoLetteraInvito) : null,
        vendutoLetteraInvito: pasajero.vendutoLetteraInvito ? parseFloat(pasajero.vendutoLetteraInvito) : null,
        tieneHotel: pasajero.tieneHotel || false,
        netoHotel: pasajero.netoHotel ? parseFloat(pasajero.netoHotel) : null,
        vendutoHotel: pasajero.vendutoHotel ? parseFloat(pasajero.vendutoHotel) : null,
        // Guardar datos de servicios dinámicos junto con notas existentes
        notas: (() => {
          const notasUsuario = pasajero.notas || '';
          const serviciosDinamicos = pasajero.serviciosData && Object.keys(pasajero.serviciosData).length > 0
            ? Object.entries(pasajero.serviciosData).reduce((acc, [key, data]: [string, any]) => {
                acc[key] = {
                  neto: data.neto ? parseFloat(data.neto) : null,
                  venduto: data.venduto ? parseFloat(data.venduto) : null
                };
                return acc;
              }, {} as any)
            : null;
          
          if (serviciosDinamicos && Object.keys(serviciosDinamicos).length > 0) {
            return JSON.stringify({
              notasUsuario: notasUsuario,
              serviciosDinamicos: serviciosDinamicos
            });
          }
          return notasUsuario || null;
        })()
      };
    });

    // Actualizar registro en la base de datos usando transacción
    const record = await prisma.$transaction(async (tx) => {
      // Eliminar pasajeros existentes
      await tx.pasajeroBiglietteria.deleteMany({
        where: { biglietteriaId: id }
      });

      // Eliminar cuotas existentes
      await tx.cuota.deleteMany({
        where: { biglietteriaId: id }
      });

      // Actualizar el registro principal
      const updatedRecord = await tx.biglietteria.update({
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
          acconto: accontoValue,
          daPagare: daPagare,
          metodoPagamento,
          notaDiVendita: notaDiVendita || null,
          feeAgv: feeAgv,
          attachedFile: attachedFileUrl,
          attachedFileName: attachedFileName,
          numeroCuotas: numeroCuotas > 0 ? numeroCuotas : null,
          numeroPasajeros: numeroPasajeros,
          netoPrincipal: netoPrincipal,
          vendutoTotal: vendutoTotal,
          updatedAt: new Date()
        }
      });

      // Crear nuevos pasajeros
      if (pasajerosParaCrear.length > 0) {
        await tx.pasajeroBiglietteria.createMany({
          data: pasajerosParaCrear.map((p: any) => ({
            ...p,
            biglietteriaId: id
          }))
        });
      }

      // Crear nuevas cuotas
      if (cuotasConArchivos.length > 0) {
        await tx.cuota.createMany({
          data: cuotasConArchivos.map((c: any) => ({
            ...c,
            biglietteriaId: id
          }))
        });
      }

      // Retornar el registro completo
      return await tx.biglietteria.findUnique({
        where: { id },
        include: {
          cuotas: {
            orderBy: {
              numeroCuota: 'asc'
            }
          },
          pasajeros: true,
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    });

    return NextResponse.json({ 
      record,
      message: 'Registro actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PATCH - Actualización parcial de campos específicos
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

    // Verificar que el registro existe
    const existingRecord = await prisma.biglietteria.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    // Actualizar solo los campos proporcionados
    const record = await prisma.biglietteria.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        pasajeros: true
      }
    });

    return NextResponse.json({ 
      record,
      message: 'Campo actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error patching biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// DELETE - Eliminar un registro (eliminación física)
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

    // Eliminar el registro de la base de datos
    await prisma.biglietteria.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Registro eliminado exitosamente' 
    });

  } catch (error) {
    console.error('Error deleting biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

