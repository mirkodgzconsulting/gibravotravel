#!/usr/bin/env node

/**
 * 👤 GIBRAVO TRAVEL - AGREGAR USUARIO A BASE DE DATOS
 * ===================================================
 * 
 * Script para agregar un usuario específico a la base de datos local
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addUserToDatabase() {
  console.log('👤 Agregando usuario a la base de datos local...\n');

  try {
    // Usuario a agregar
    const userData = {
      clerkId: 'user_33SQ3k9daADwzexJSS23utCpPqr',
      email: 'ti@test.com',
      firstName: 'TI',
      lastName: 'Support',
      role: 'TI',
      isActive: true,
    };

    console.log('🔍 Verificando si el usuario ya existe...');
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userData.clerkId
      }
    });

    if (existingUser) {
      console.log('⚠️  El usuario ya existe en la base de datos:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Rol: ${existingUser.role}`);
      console.log(`   Activo: ${existingUser.isActive ? 'Sí' : 'No'}`);
      
      // Preguntar si quiere actualizar
      console.log('\n🔄 ¿Quieres actualizar el usuario existente?');
      console.log('   - El usuario ya está en la BD');
      console.log('   - Puedes usar las credenciales de Clerk para hacer login');
      return;
    }

    // Crear el usuario
    console.log('➕ Creando nuevo usuario...');
    const newUser = await prisma.user.create({
      data: userData
    });

    console.log('✅ Usuario creado exitosamente:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Clerk ID: ${newUser.clerkId}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Nombre: ${newUser.firstName} ${newUser.lastName}`);
    console.log(`   Rol: ${newUser.role}`);
    console.log(`   Activo: ${newUser.isActive ? 'Sí' : 'No'}`);

    console.log('\n🎉 ¡Usuario agregado a la base de datos!');
    console.log('\n📋 Ahora puedes:');
    console.log('   1. Ir a http://localhost:3000');
    console.log('   2. Hacer login con las credenciales de Clerk');
    console.log('   3. El sistema detectará automáticamente el rol TI');

  } catch (error) {
    console.error('❌ Error agregando usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addUserToDatabase();
}

module.exports = { addUserToDatabase };

