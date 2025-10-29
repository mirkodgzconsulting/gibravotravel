const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('🔍 Buscando usuario TI...');
    
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'ti@test.com' },
          { clerkId: { contains: 'TI' } }
        ]
      },
      select: { id: true, email: true, clerkId: true, role: true, firstName: true, lastName: true }
    });
    
    if (user) {
      console.log('✅ Usuario encontrado:', user);
    } else {
      console.log('❌ Usuario no encontrado');
      
      // Listar todos los usuarios para debug
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, clerkId: true, role: true, firstName: true, lastName: true }
      });
      console.log('📋 Todos los usuarios:');
      allUsers.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email} - ${u.clerkId} - ${u.role} - ${u.nombre}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
