import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const origini = await prisma.origine.findMany({
      where: { isActive: true },
      orderBy: { origine: 'asc' }
    });

    return NextResponse.json(origini);
  } catch (error) {
    console.error('Error fetching origini:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
