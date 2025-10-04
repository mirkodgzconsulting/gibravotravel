import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const metodi = await prisma.metodoPagamento.findMany({
      where: { isActive: true },
      orderBy: { metodoPagamento: 'asc' }
    });

    return NextResponse.json(metodi);
  } catch (error) {
    console.error('Error fetching metodi pagamento:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
