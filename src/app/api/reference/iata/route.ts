import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const iata = await prisma.iata.findMany({
      where: { isActive: true },
      orderBy: { iata: 'asc' }
    });

    return NextResponse.json(iata);
  } catch (error) {
    console.error('Error fetching iata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
