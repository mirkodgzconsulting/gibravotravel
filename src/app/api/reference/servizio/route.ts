import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const servizi = await prisma.servizio.findMany({
      where: { isActive: true },
      orderBy: { servizio: 'asc' }
    });

    return NextResponse.json(servizi);
  } catch (error) {
    console.error('Error fetching servizi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
