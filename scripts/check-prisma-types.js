// Script para verificar los tipos de Prisma generados
const { PrismaClient } = require('@prisma/client');

console.log('🔍 Verificando tipos de Prisma...\n');

// Verificar si UserRole está disponible
try {
  const { UserRole } = require('@prisma/client');
  console.log('✅ UserRole importado correctamente:', UserRole);
  
  // Verificar valores del enum
  console.log('📊 Valores del enum UserRole:');
  Object.values(UserRole).forEach((value, index) => {
    console.log(`   ${index + 1}. ${value}`);
  });
  
} catch (error) {
  console.log('❌ Error importando UserRole:', error.message);
}

// Verificar si el cliente de Prisma funciona
try {
  const prisma = new PrismaClient();
  console.log('\n✅ Cliente de Prisma creado correctamente');
  
  // Probar una consulta simple
  prisma.$connect().then(() => {
    console.log('✅ Conexión a la base de datos establecida');
    return prisma.user.findFirst();
  }).then((user) => {
    if (user) {
      console.log('✅ Consulta de usuario exitosa:', {
        email: user.email,
        role: user.role,
        roleType: typeof user.role
      });
    } else {
      console.log('❌ No se encontraron usuarios');
    }
    return prisma.$disconnect();
  }).then(() => {
    console.log('✅ Conexión cerrada correctamente');
  }).catch((error) => {
    console.error('❌ Error en operaciones de Prisma:', error.message);
  });
  
} catch (error) {
  console.log('❌ Error creando cliente de Prisma:', error.message);
}
