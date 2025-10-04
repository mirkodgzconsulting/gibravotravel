import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET - Obtener todos los registros de biglietteria
export async function GET() {
  try {
    console.log('🔍 GET /api/biglietteria - Iniciando...');
    
    const { userId } = await auth();
    console.log('🔍 User ID:', userId);
    
    if (!userId) {
      console.log('❌ No autorizado - userId es null');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const records = await prisma.biglietteria.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('🔍 Registros encontrados:', records.length);

    return NextResponse.json({ 
      records,
      total: records.length 
    });

  } catch (error) {
    console.error('❌ Error fetching biglietteria records:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}

// POST - Crear nuevo registro de biglietteria
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/biglietteria - Iniciando...');
    const { userId } = await auth();
    console.log('🔍 User ID:', userId);
    
    if (!userId) {
      console.log('❌ No autorizado - userId es null');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { firstName: true, lastName: true }
    });

    const createdBy = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Usuario';

    const body = await request.json();
    const {
      cliente,
      codiceFiscale,
      indirizzo,
      email,
      numeroTelefono,
      pagamento,
      data,
      iata,
      pnr,
      passeggero,
      itinerario,
      servizio,
      neto,
      venduto,
      acconto,
      metodoPagamento,
      feeAgv,
      origine
    } = body;

    // Calcular daPagare
    const daPagare = parseFloat(venduto) - parseFloat(acconto);

    console.log('🔍 Datos recibidos:', {
      cliente,
      passeggero,
      itinerario,
      venduto,
      acconto,
      daPagare,
      createdBy
    });

    const record = await prisma.biglietteria.create({
      data: {
        cliente,
        codiceFiscale,
        indirizzo,
        email,
        numeroTelefono,
        pagamento,
        data: new Date(data),
        iata,
        pnr: pnr || null,
        passeggero,
        itinerario,
        servizio,
        neto: parseFloat(neto),
        venduto: parseFloat(venduto),
        acconto: parseFloat(acconto),
        daPagare: daPagare,
        metodoPagamento,
        feeAgv: parseFloat(feeAgv),
        origine,
        creadoPor: createdBy,
        isActive: true
      }
    });

    console.log('✅ Registro creado exitosamente:', record.id);
    return NextResponse.json({ 
      record, 
      message: 'Registro de biglietteria creado exitosamente' 
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating biglietteria record:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      details: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}
