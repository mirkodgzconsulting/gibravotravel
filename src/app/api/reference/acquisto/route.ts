import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const acquisti = await prisma.acquisto.findMany({
      where: { isActive: true },
      orderBy: { acquisto: 'asc' }
    });

    return NextResponse.json(acquisti);
  } catch (error) {
    console.error('Error fetching acquisti:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
