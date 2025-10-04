import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const pagamenti = await prisma.pagamento.findMany({
      where: { isActive: true },
      orderBy: { pagamento: 'asc' }
    });

    return NextResponse.json(pagamenti);
  } catch (error) {
    console.error('Error fetching pagamenti:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
