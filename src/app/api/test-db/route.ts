import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test 1: Conexión básica
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Test 2: Contar usuarios
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    // Test 3: Contar tours de bus
    const tourBusCount = await prisma.tourBus.count();
    console.log(`✅ TourBus count: ${tourBusCount}`);
    
    // Test 4: Verificar usuario actual
    const { userId } = await auth();
    if (userId) {
      const currentUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, email: true, role: true }
      });
      console.log('✅ Current user:', currentUser);
    } else {
      console.log('❌ No user authenticated');
    }
    
    return NextResponse.json({
      success: true,
      userCount,
      tourBusCount,
      currentUser: userId ? await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, email: true, role: true }
      }) : null
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
