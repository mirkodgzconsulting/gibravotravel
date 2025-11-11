import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
    api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
  });
}

// PATCH - Actualizar el estado de una venta específica
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: ventaId } = await params;
    const body = await request.json();
    const { stato, metodoCompra } = body;

    if (!stato && !metodoCompra) {
      return NextResponse.json({ error: 'Al menos uno de los campos stato o metodoCompra es requerido' }, { status: 400 });
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Buscar la venta y verificar permisos
    const venta = await prisma.ventaTourAereo.findUnique({
      where: { id: ventaId },
      include: {
        tourAereo: {
          select: {
            id: true,
            createdBy: true
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Verificar permisos:
    // - ADMIN y TI pueden editar cualquier venta
    // - USER puede editar sus propias ventas
    // - USER puede actualizar el estado de ventas ajenas solo si lo establece en Acconto o Ricevuto
    if (user.role === 'USER' && venta.createdBy !== user.id) {
      const allowedUserStates = new Set(['Acconto', 'Ricevuto']);
      const keys = Object.keys(body);
      const soloActualizaEstado = keys.length === 1 && keys[0] === 'stato';
      if (!(soloActualizaEstado && stato !== undefined && allowedUserStates.has(stato))) {
        return NextResponse.json({ error: 'No autorizado para editar esta venta' }, { status: 403 });
      }
    }

    // Actualizar el stato y/o metodoCompra
    const updateData: any = {};
    if (stato !== undefined) updateData.stato = stato;
    if (metodoCompra !== undefined) updateData.metodoCompra = metodoCompra;
    
    const ventaActualizada = await prisma.ventaTourAereo.update({
      where: { id: ventaId },
      data: updateData
    });

    return NextResponse.json({ venta: ventaActualizada });

  } catch (error) {
    console.error('Error updating venta stato:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar una venta completa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: ventaId } = await params;
    
    // Obtener FormData para manejar archivos
    const formData = await request.formData();

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Buscar la venta y verificar permisos
    const venta = await prisma.ventaTourAereo.findUnique({
      where: { id: ventaId },
      include: {
        tourAereo: {
          select: {
            id: true,
            createdBy: true
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Verificar permisos: ADMIN y TI pueden editar cualquier venta,
    // USER solo puede editar sus propias ventas
    // Nota: createdBy almacena el id del usuario, no el clerkId
    // Los usuarios USER también pueden editar ventas existentes independientemente del creador.

    // Extraer datos del FormData
    const pasajero = formData.get('pasajero') as string;
    const codiceFiscale = formData.get('codiceFiscale') as string;
    const indirizzo = formData.get('indirizzo') as string;
    const email = formData.get('email') as string;
    const numeroTelefono = formData.get('numeroTelefono') as string;
    const paisOrigen = formData.get('paisOrigen') as string;
    const iata = formData.get('iata') as string;
    const pnr = formData.get('pnr') as string;
    const hotel = formData.get('hotel') as string;
    const transfer = formData.get('transfer') as string;
    const venduto = formData.get('venduto') as string;
    const acconto = formData.get('acconto') as string;
    const metodoPagamento = formData.get('metodoPagamento') as string;
    const metodoCompra = formData.get('metodoCompra') as string;
    const stato = formData.get('stato') as string;
    const cuotasJson = formData.get('cuotas') as string;
    
    // Procesar archivo principal
    const file = formData.get('file') as File | null;
    let attachedFileUrl = venta.attachedFile;
    let attachedFileName = venta.attachedFileName;
    
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
              folder: 'gibravotravel/tour-aereo',
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

    if (!pasajero || !codiceFiscale || !indirizzo || !email || !numeroTelefono || 
        !paisOrigen || !iata || !venduto || !metodoPagamento || !stato) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Calcular daPagare
    const daPagare = parseFloat(venduto) - parseFloat(acconto || '0');

    // Procesar cuotas con archivos
    const cuotas = cuotasJson ? JSON.parse(cuotasJson) : [];
    const cuotasConArchivos = [];
    
    if (cuotas && cuotas.length > 0) {
      for (let i = 0; i < cuotas.length; i++) {
        const cuota = cuotas[i];
        // IMPORTANTE: Mantener archivos existentes por defecto
        let cuotaAttachedFile = cuota.attachedFile || null;
        let cuotaAttachedFileName = cuota.attachedFileName || null;
        
        // Procesar archivo NUEVO de la cuota si existe
        const cuotaFile = formData.get(`cuotaFile${i}`) as File | null;
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
                  folder: 'gibravotravel/tour-aereo/cuotas',
                  resource_type: resourceType
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              ).end(buffer);
            });
            
            cuotaAttachedFile = result.secure_url;
            cuotaAttachedFileName = cuotaFile.name;
            console.log(`📎 Archivo de cuota ${i + 1} NUEVO subido:`, cuotaAttachedFileName);
          } catch (error) {
            console.error(`Error uploading cuota file ${i}:`, error);
          }
        } else {
          // Si no hay archivo nuevo, mantener el existente
          if (cuotaAttachedFile) {
            console.log(`📎 Manteniendo archivo existente de cuota ${i + 1}:`, cuotaAttachedFileName);
          }
        }
        
        cuotasConArchivos.push({
          numeroCuota: cuota.numeroCuota,
          fechaPago: new Date(cuota.fechaPago),
          monto: parseFloat(cuota.monto),
          nota: cuota.nota || null,
          estado: cuota.estado || "Pendiente",
          attachedFile: cuotaAttachedFile,
          attachedFileName: cuotaAttachedFileName
        });
      }
    }

    // Actualizar la venta
    const ventaActualizada = await prisma.ventaTourAereo.update({
      where: { id: ventaId },
      data: {
        pasajero,
        codiceFiscale,
        indirizzo,
        email,
        numeroTelefono,
        paisOrigen,
        iata,
        pnr: pnr || null,
        hotel: (hotel ? parseFloat(hotel) : null) as any,
        transfer: (transfer ? parseFloat(transfer) : null) as any,
        venduto: parseFloat(venduto),
        acconto: parseFloat(acconto || '0'),
        daPagare,
        metodoPagamento,
        metodoCompra: metodoCompra || null,
        stato,
        attachedFile: attachedFileUrl,
        attachedFileName: attachedFileName
      }
    });

    // Actualizar cuotas si se proporcionan
    if (cuotasConArchivos.length > 0) {
      // Eliminar cuotas existentes
      await prisma.cuotaVentaTourAereo.deleteMany({
        where: { ventaTourAereoId: ventaId }
      });

      // Crear nuevas cuotas
      await prisma.cuotaVentaTourAereo.createMany({
        data: cuotasConArchivos.map((cuota: any) => ({
          ventaTourAereoId: ventaId,
          numeroCuota: cuota.numeroCuota,
          fechaPago: cuota.fechaPago,
          monto: cuota.monto,
          nota: cuota.nota,
          estado: cuota.estado,
          attachedFile: cuota.attachedFile,
          attachedFileName: cuota.attachedFileName
        }))
      });
    }

    // Obtener la venta actualizada con todas sus relaciones
    const ventaCompleta = await prisma.ventaTourAereo.findUnique({
      where: { id: ventaId },
      include: {
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({ venta: ventaCompleta });

  } catch (error) {
    console.error('Error updating venta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Eliminar una venta específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: ventaId } = await params;

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Buscar la venta y verificar permisos
    const venta = await prisma.ventaTourAereo.findUnique({
      where: { id: ventaId },
      include: {
        tourAereo: {
          select: {
            id: true,
            createdBy: true
          }
        }
      }
    });

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Verificar permisos: ADMIN y TI pueden eliminar cualquier venta,
    // USER solo puede eliminar sus propias ventas
    // Nota: createdBy almacena el id del usuario, no el clerkId
    if (user.role === 'USER' && venta.createdBy !== user.id) {
      return NextResponse.json({ error: 'No autorizado para eliminar esta venta' }, { status: 403 });
    }

    // Eliminar la venta
    await prisma.ventaTourAereo.delete({
      where: { id: ventaId }
    });

    return NextResponse.json({ message: 'Venta eliminada correctamente' });

  } catch (error) {
    console.error('Error deleting venta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
