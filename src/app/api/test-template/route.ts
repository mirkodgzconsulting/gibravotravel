import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('🧪 Testing template creation...');
    
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No user authenticated' },
        { status: 401 }
      );
    }

    // Datos de prueba
    const testData = {
      title: 'Test Template',
      textContent: 'This is a test template',
      tourDate: new Date(),
      travelCost: 100.50,
      createdBy: userId,
    };

    console.log('📝 Creating test template with data:', testData);

    const template = await prisma.travelNoteTemplate.create({
      data: testData,
    });

    console.log('✅ Test template created:', template.id);

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        title: template.title,
        createdAt: template.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Template creation test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
