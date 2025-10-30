import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
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

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userOnly = searchParams.get('userOnly') === 'true';
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    let whereCondition: any = { isActive: true };

    if (fechaDesde && fechaHasta) {
      whereCondition.data = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta)
      };
    }

    if (userOnly) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { firstName: true, lastName: true }
      });

      if (user) {
        const createdBy = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        whereCondition.creadoPor = createdBy;
      }
    }

    const records = await prisma.biglietteria.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        cuotas: {
          orderBy: {
            numeroCuota: 'asc'
          }
        },
        pasajeros: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const res = NextResponse.json({ records });
    // Cache privada y corta para acelerar navegación de ida y vuelta
    res.headers.set('Cache-Control', 'private, max-age=15, must-revalidate');
    return res;
  } catch (error) {
    console.error('Error fetching biglietteria records:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, firstName: true, lastName: true }
    });

    const createdBy = user ? user.id : 'Usuario';

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
    
    console.log('📊 Número de pasajeros:', pasajeros.length);

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

    // Subir archivo principal a Cloudinary si existe
    const file = formData.get('file') as File | null;
    let attachedFileUrl = null;
    let attachedFileName = null;
    
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
        console.log('📎 Archivo principal subido:', attachedFileName);
      } catch (error) {
        console.error('Error uploading main file:', error);
      }
    }

    // Procesar cuotas
    const cuotas = cuotasJson ? JSON.parse(cuotasJson) : [];
    const cuotasConArchivos = [];
    
    if (numeroCuotas > 0 && cuotas.length > 0) {
      for (let i = 0; i < cuotas.length; i++) {
        const cuota = cuotas[i];
        const cuotaFile = formData.get(`cuotaFile${i}`) as File | null;
        
        let cuotaFileUrl = null;
        let cuotaFileName = null;
        
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
            console.log(`📎 Archivo cuota ${i + 1} subido:`, cuotaFileName);
          } catch (error) {
            console.error(`Error uploading cuota file ${i}:`, error);
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
        iata: pasajero.iata || null, // Campo IATA dinámico
        netoBiglietteria: pasajero.netoBiglietteria ? parseFloat(pasajero.netoBiglietteria) : null,
        vendutoBiglietteria: pasajero.vendutoBiglietteria ? parseFloat(pasajero.vendutoBiglietteria) : null,
        tieneExpress: pasajero.tieneExpress || false,
        netoExpress: pasajero.netoExpress ? parseFloat(pasajero.netoExpress) : null,
        vendutoExpress: pasajero.vendutoExpress ? parseFloat(pasajero.vendutoExpress) : null,
        tienePolizza: pasajero.tienePolizza || false,
        netoPolizza: pasajero.netoPolizza ? parseFloat(pasajero.netoPolizza) : null,
        vendutoPolizza: pasajero.vendutoPolizza ? parseFloat(pasajero.vendutoPolizza) : null,
        // Nuevos campos para estado y fechas
        estado: 'Pendiente', // Siempre inicia como Pendiente
        fechaPago: null,
        fechaActivacion: null,
        tieneLetteraInvito: pasajero.tieneLetteraInvito || false,
        netoLetteraInvito: pasajero.netoLetteraInvito ? parseFloat(pasajero.netoLetteraInvito) : null,
        vendutoLetteraInvito: pasajero.vendutoLetteraInvito ? parseFloat(pasajero.vendutoLetteraInvito) : null,
        tieneHotel: pasajero.tieneHotel || false,
        netoHotel: pasajero.netoHotel ? parseFloat(pasajero.netoHotel) : null,
        vendutoHotel: pasajero.vendutoHotel ? parseFloat(pasajero.vendutoHotel) : null
      };
    });

    // Crear registro en la base de datos con transacción
    const record = await prisma.biglietteria.create({
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
        creadoPor: createdBy,
        isActive: true,
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

    console.log('✅ Biglietteria record created successfully:', record.id);
    
    return NextResponse.json(record, { status: 201 });

  } catch (error) {
    console.error('Error creating biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Error desconocido'
        : 'Error interno del servidor'
    }, { status: 500 });
  }
}