#!/usr/bin/env node

/**
 * Script para migrar la base de datos y agregar el campo ACC
 * Este script se ejecutará automáticamente en Vercel durante el build
 */

const { PrismaClient } = require('@prisma/client');

async function migrateAccField() {
  // Verificar si DATABASE_URL está disponible
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL no está disponible, saltando migración local');
    console.log('✅ La migración se ejecutará automáticamente en Vercel');
    return;
  }

  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Iniciando migración para agregar campo ACC...');
    
    // Verificar si la columna ACC ya existe
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'travel_note_templates' 
      AND column_name = 'acc'
    `;
    
    if (tableInfo.length > 0) {
      console.log('✅ La columna ACC ya existe en la base de datos');
      return;
    }
    
    // Agregar la columna ACC
    console.log('➕ Agregando columna ACC...');
    await prisma.$executeRaw`
      ALTER TABLE travel_note_templates 
      ADD COLUMN acc TEXT
    `;
    
    console.log('✅ Columna ACC agregada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  migrateAccField()
    .then(() => {
      console.log('🎉 Migración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la migración:', error);
      process.exit(1);
    });
}

module.exports = { migrateAccField };
