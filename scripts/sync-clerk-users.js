#!/usr/bin/env node

/**
 * 🔄 GIBRAVO TRAVEL - SINCRONIZAR USUARIOS DE CLERK CON BD
 * =========================================================
 * 
 * Script para sincronizar usuarios de Clerk con la base de datos local
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncClerkUsers() {
  console.log('🔄 Sincronizando usuarios de Clerk con base de datos...\n');

  try {
    // Usuarios principales de Clerk (basado en la respuesta de la API)
    const clerkUsers = [
      {
        clerkId: 'user_33bf957OvyQP9DxufYeP7EeKWP8',
        email: 'admin@test.com',
        firstName: 'admin',
        lastName: 'user',
        role: 'ADMIN',
        isActive: true,
      },
      {
        clerkId: 'user_33YEjIuccaEgaLhXtEoUa6Y1CmN',
        email: 'dasdasdada@g.com',
        firstName: 'Mirko',
        lastName: 'Carrasco',
        role: 'USER',
        isActive: true,
      }
    ];

    console.log('🧹 Limpiando usuarios existentes...');
    await prisma.user.deleteMany({
      where: {
        clerkId: {
          in: clerkUsers.map(u => u.clerkId)
        }
      }
    });

    console.log('👤 Sincronizando usuarios de Clerk...');
    for (const userData of clerkUsers) {
      const user = await prisma.user.create({
        data: userData
      });
      console.log(`✅ Usuario sincronizado: ${user.email} (${user.role})`);
    }

    // Mantener el usuario TI que ya teníamos
    console.log('\n🔍 Verificando usuario TI existente...');
    const existingTIUser = await prisma.user.findUnique({
      where: { clerkId: 'user_33SQ3k9daADwzexJSS23utCpPqr' }
    });

    if (!existingTIUser) {
      console.log('⚠️ Usuario TI no encontrado, agregándolo...');
      await prisma.user.create({
        data: {
          clerkId: 'user_33SQ3k9daADwzexJSS23utCpPqr',
          email: 'ti@test.com',
          firstName: 'TI',
          lastName: 'Support',
          role: 'TI',
          isActive: true,
        }
      });
      console.log('✅ Usuario TI agregado');
    } else {
      console.log('✅ Usuario TI ya existe');
    }

    console.log('\n🎉 Sincronización completada!');
    console.log('\n📋 Usuarios disponibles para login:');
    console.log('┌─────────────────────┬─────────────────────┬─────────────────────┐');
    console.log('│ Email               │ Contraseña          │ Rol                 │');
    console.log('├─────────────────────┼─────────────────────┼─────────────────────┤');
    console.log('│ admin@test.com      │ [Tu contraseña]     │ ADMIN               │');
    console.log('│ ti@test.com         │ [Tu contraseña]     │ TI                  │');
    console.log('│ dasdasdada@g.com    │ [Tu contraseña]     │ USER                │');
    console.log('└─────────────────────┴─────────────────────┴─────────────────────┘');

  } catch (error) {
    console.error('❌ Error sincronizando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  syncClerkUsers();
}

module.exports = { syncClerkUsers };

