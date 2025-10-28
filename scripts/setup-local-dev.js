#!/usr/bin/env node

/**
 * 🚀 GIBRAVO TRAVEL - SETUP DESARROLLO LOCAL
 * ==========================================
 * 
 * Este script configura el entorno de desarrollo local
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando entorno de desarrollo local...\n');

// 1. Verificar si existe .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creando archivo .env.local...');
  
  const envContent = `# 🚀 GIBRAVO TRAVEL - DESARROLLO LOCAL
# ======================================

# 🔐 CLERK AUTHENTICATION (Mismo que producción)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_c3RlYWR5LWZvYWwtMjQuY2xlcmsuYWNjb3VudHMuZGV2JA"
CLERK_SECRET_KEY="sk_test_RtImEzSJWIYTv0A1NZicdgGYr4OMEITQlbzxGltnaI"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/signin"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"

# 🗄️ DATABASE (LOCAL POSTGRESQL)
# ⚠️  IMPORTANTE: Reemplazar con tus credenciales PostgreSQL locales
DATABASE_URL="postgresql://postgres:password@localhost:5432/gibravotravel_dev"

# 🌐 DESARROLLO LOCAL
NODE_ENV="development"
NEXT_PUBLIC_APP_ENV="development"`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env.local creado');
} else {
  console.log('✅ Archivo .env.local ya existe');
}

// 2. Generar cliente Prisma
console.log('\n🔧 Generando cliente Prisma...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma generado');
} catch (error) {
  console.error('❌ Error generando cliente Prisma:', error.message);
}

// 3. Verificar conexión a base de datos
console.log('\n🗄️ Verificando conexión a base de datos...');
try {
  execSync('npx prisma db pull', { stdio: 'pipe' });
  console.log('✅ Conexión a base de datos exitosa');
} catch (error) {
  console.log('⚠️  No se pudo conectar a la base de datos local');
  console.log('📋 Pasos siguientes:');
  console.log('   1. Instalar y configurar PostgreSQL');
  console.log('   2. Crear base de datos: gibravotravel_dev');
  console.log('   3. Actualizar DATABASE_URL en .env.local');
  console.log('   4. Ejecutar: npx prisma db push');
}

console.log('\n🎉 Setup completado!');
console.log('\n📋 Próximos pasos:');
console.log('   1. Configurar PostgreSQL local');
console.log('   2. Actualizar DATABASE_URL en .env.local');
console.log('   3. Ejecutar: npm run dev');
console.log('   4. Abrir: http://localhost:3000');

