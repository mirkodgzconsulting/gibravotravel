import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get('clerkId');

    console.log('🔍 [ROLE API] Request received with clerkId:', clerkId);

    if (!clerkId) {
      console.log('❌ [ROLE API] Clerk ID is required');
      return NextResponse.json({ error: 'Clerk ID is required' }, { status: 400 });
    }

    console.log('🔍 [ROLE API] Searching for user in database...');
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true, firstName: true, lastName: true, email: true }
    });

    if (!user) {
      console.log('❌ [ROLE API] User not found in database for clerkId:', clerkId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ [ROLE API] User found:', { role: user.role, name: `${user.firstName} ${user.lastName}`, email: user.email });
    return NextResponse.json({ role: user.role });
  } catch (error) {
    console.error('❌ [ROLE API] Error fetching user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
