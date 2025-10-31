import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST - Sembrar datos iniciales (solo para TI)
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || user.role !== 'TI') {
      return NextResponse.json({ error: 'Solo usuarios TI pueden sembrar datos' }, { status: 403 });
    }

    const fermate = [
      'Lambrate Stazione',
      'Cologno Centro',
      "Trezzo Sull'ada",
      'Agrate Brianza',
      'Bergamo Piazzale Malpensata',
      'Bergamo 2 Persone Automunite',
      'Brescia',
      'Peschiera del Garda',
      'Trento Uscita TrentoSud',
      'Rovato',
      'Vicenza',
      'Lomazzo',
      'Monza',
    ];

    const stati = [
      'Libre',
      'Pagado',
      'Acconto',
      'Prenotato',
    ];

    let fermateCreadas = 0;
    let statiCreati = 0;

    // Insertar fermate
    for (const fermata of fermate) {
      const existente = await prisma.fermataBus.findUnique({ where: { fermata } });
      if (!existente) {
        await prisma.fermataBus.create({ data: { fermata } });
        fermateCreadas++;
      }
    }

    // Insertar stati
    for (const stato of stati) {
      const existente = await prisma.statoBus.findUnique({ where: { stato } });
      if (!existente) {
        await prisma.statoBus.create({ data: { stato } });
        statiCreati++;
      }
    }

    return NextResponse.json({ 
      message: 'Datos sembrados exitosamente',
      fermateCreadas,
      statiCreati
    });

  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}




