import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClerkClient } from '@clerk/backend';

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
      // Auto-provision: crear usuario con rol USER usando datos desde Clerk
      try {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
        const clerkUser = await clerk.users.getUser(clerkId);
        const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
        const firstName = clerkUser.firstName || '';
        const lastName = clerkUser.lastName || '';

        const created = await prisma.user.upsert({
          where: { clerkId },
          update: {},
          create: {
            clerkId,
            email,
            firstName,
            lastName,
            role: 'USER',
            isActive: true,
          },
          select: { role: true },
        });

        console.log('✅ [ROLE API] Auto-provisioned user with role USER');
        return NextResponse.json({ role: created.role });
      } catch (provisionErr) {
        console.error('❌ [ROLE API] Auto-provision failed:', provisionErr);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    console.log('✅ [ROLE API] User found:', { role: user.role, name: `${user.firstName} ${user.lastName}`, email: user.email });
    return NextResponse.json({ role: user.role });
  } catch (error) {
    console.error('❌ [ROLE API] Error fetching user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
