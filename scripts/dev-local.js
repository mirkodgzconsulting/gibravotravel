#!/usr/bin/env node

/**
 * 🚀 GIBRAVO TRAVEL - DESARROLLO LOCAL MEJORADO
 * =============================================
 * 
 * Script para manejar fácilmente el desarrollo local
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración de la base de datos local
const LOCAL_DB_CONFIG = {
  user: 'postgres',
  password: 'Milano2025',
  host: 'localhost',
  port: '5432',
  database: 'gibravotravel'
};

const DATABASE_URL = `postgresql://${LOCAL_DB_CONFIG.user}:${LOCAL_DB_CONFIG.password}@${LOCAL_DB_CONFIG.host}:${LOCAL_DB_CONFIG.port}/${LOCAL_DB_CONFIG.database}`;

function runCommand(command, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    // Establecer la variable de entorno para Prisma
    const env = { ...process.env, DATABASE_URL };
    execSync(command, { 
      stdio: 'inherit', 
      env,
      shell: true 
    });
    console.log(`✅ ${description} completado`);
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    process.exit(1);
  }
}

function checkLocalDatabase() {
  console.log('🗄️ Verificando conexión a base de datos local...');
  try {
    const env = { ...process.env, DATABASE_URL };
    execSync('npx prisma db pull', { 
      stdio: 'pipe', 
      env,
      shell: true 
    });
    console.log('✅ Base de datos local conectada');
    return true;
  } catch (error) {
    console.log('❌ No se pudo conectar a la base de datos local');
    return false;
  }
}

function main() {
  const command = process.argv[2];
  
  console.log('🚀 GIBRAVO TRAVEL - DESARROLLO LOCAL');
  console.log('=====================================\n');

  switch (command) {
    case 'setup':
      console.log('📋 Configurando entorno de desarrollo local...');
      
      // Verificar .env.local
      const envPath = path.join(process.cwd(), '.env.local');
      if (!fs.existsSync(envPath)) {
        console.log('📝 Creando archivo .env.local...');
        const envContent = `# 🚀 GIBRAVO TRAVEL - DESARROLLO LOCAL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_c3RlYWR5LWZvYWwtMjQuY2xlcmsuYWNjb3VudHMuZGV2JA"
CLERK_SECRET_KEY="sk_test_RtImEzSJWIYTv0A1NZicdgGYr4OMEITQlbzxGltnaI"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/signin"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
DATABASE_URL="${DATABASE_URL}"
NODE_ENV="development"
NEXT_PUBLIC_APP_ENV="development"`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Archivo .env.local creado');
      }
      
      runCommand('npx prisma generate', 'Generando cliente Prisma');
      runCommand('npx prisma db push', 'Aplicando schema a la base de datos');
      runCommand('node scripts/seed-local-data.js', 'Llenando base de datos con datos de prueba');
      
      console.log('\n🎉 Setup completado!');
      console.log('📋 Para iniciar el servidor de desarrollo:');
      console.log('   npm run dev:local');
      break;

    case 'reset':
      console.log('🔄 Reseteando base de datos local...');
      runCommand('npx prisma db push --force-reset', 'Reseteando base de datos');
      runCommand('node scripts/seed-local-data.js', 'Llenando con datos de prueba');
      console.log('✅ Base de datos reseteada');
      break;

    case 'seed':
      runCommand('node scripts/seed-local-data.js', 'Llenando base de datos con datos de prueba');
      break;

    case 'studio':
      console.log('🎨 Abriendo Prisma Studio...');
      runCommand('npx prisma studio', 'Iniciando Prisma Studio');
      break;

    case 'dev':
      console.log('🚀 Iniciando servidor de desarrollo...');
      if (!checkLocalDatabase()) {
        console.log('⚠️  Ejecuta primero: npm run dev:local setup');
        process.exit(1);
      }
      runCommand('npm run dev', 'Iniciando servidor de desarrollo');
      break;

    default:
      console.log('📋 Comandos disponibles:');
      console.log('   npm run dev:local setup    - Configurar entorno completo');
      console.log('   npm run dev:local reset    - Resetear base de datos');
      console.log('   npm run dev:local seed     - Llenar con datos de prueba');
      console.log('   npm run dev:local studio   - Abrir Prisma Studio');
      console.log('   npm run dev:local dev      - Iniciar servidor de desarrollo');
      console.log('\n🎯 Flujo recomendado:');
      console.log('   1. npm run dev:local setup');
      console.log('   2. npm run dev:local dev');
      break;
  }
}

main();

