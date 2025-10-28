const { PrismaClient } = require('@prisma/client');

async function verifyDatabaseConnection() {
  console.log('🔍 Verificando conexión a base de datos...\n');

  try {
    // 1. Verificar variables de entorno
    console.log('1. Verificando variables de entorno...');
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.log('❌ DATABASE_URL no está configurado');
      return;
    }

    console.log('✅ DATABASE_URL configurado');
    
    // Extraer información de la URL
    try {
      const url = new URL(databaseUrl);
      const databaseName = url.pathname.substring(1); // Remover el '/' inicial
      console.log(`📊 Base de datos: ${databaseName}`);
      console.log(`🌐 Host: ${url.hostname}`);
      console.log(`🔌 Puerto: ${url.port || '5432'}`);
    } catch (error) {
      console.log('⚠️  No se pudo parsear la URL de la base de datos');
    }

    // 2. Probar conexión
    console.log('\n2. Probando conexión...');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Conexión exitosa');
    } catch (error) {
      console.log(`❌ Error de conexión: ${error.message}`);
      return;
    }

    // 3. Verificar tablas existentes
    console.log('\n3. Verificando tablas existentes...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      
      console.log(`📊 Tablas encontradas: ${tables.length}`);
      tables.forEach(table => {
        console.log(`   • ${table.table_name}`);
      });

      if (tables.length === 0) {
        console.log('⚠️  No hay tablas - la base de datos está vacía');
      }
    } catch (error) {
      console.log(`❌ Error verificando tablas: ${error.message}`);
    }

    // 4. Verificar usuarios
    console.log('\n4. Verificando usuarios...');
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });
      
      console.log(`👥 Usuarios encontrados: ${users.length}`);
      users.forEach(user => {
        console.log(`   • ${user.email} (${user.role}) - Activo: ${user.isActive}`);
      });
    } catch (error) {
      console.log(`❌ Error verificando usuarios: ${error.message}`);
    }

    // 5. Verificar datos de referencia
    console.log('\n5. Verificando datos de referencia...');
    const referenceTables = [
      'pagamento', 'metodo_pagamento', 'servizio', 'iata',
      'fermata_bus', 'stato_bus'
    ];

    for (const table of referenceTables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${table}`;
        console.log(`   ${table}: ${count[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
      }
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error durante verificación:', error);
  } finally {
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

verifyDatabaseConnection();
