#!/usr/bin/env node

/**
 * 🔍 GIBRAVO TRAVEL - PROBAR FLUJO DE AUTENTICACIÓN
 * ================================================
 * 
 * Script para verificar que el flujo Clerk + Database funciona correctamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuthFlow() {
  console.log('🔍 Probando flujo de autenticación...\n');

  try {
    // 1. Verificar conexión a base de datos
    console.log('🗄️ Verificando conexión a base de datos...');
    await prisma.$connect();
    console.log('✅ Base de datos conectada');

    // 2. Buscar el usuario específico
    console.log('\n👤 Buscando usuario en base de datos...');
    const user = await prisma.user.findUnique({
      where: { clerkId: 'user_33SQ3k9daADwzexJSS23utCpPqr' }
    });

    if (!user) {
      console.log('❌ Usuario NO encontrado en base de datos');
      console.log('📋 Usuarios disponibles:');
      
      const allUsers = await prisma.user.findMany({
        select: { clerkId: true, email: true, role: true, isActive: true }
      });
      
      allUsers.forEach((u, index) => {
        console.log(`   ${index + 1}. ${u.email} (${u.clerkId}) - Rol: ${u.role} - Activo: ${u.isActive}`);
      });
      
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Activo: ${user.isActive}`);

    // 3. Simular llamada a la API de rol
    console.log('\n🌐 Simulando llamada a API /api/user/role...');
    
    const response = await fetch(`http://localhost:3002/api/user/role?clerkId=${user.clerkId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API responde correctamente:');
      console.log(`   Rol obtenido: ${data.role}`);
    } else {
      console.log(`❌ API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAuthFlow();
}

module.exports = { testAuthFlow };

