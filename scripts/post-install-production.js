console.log('📦 Post-install detectado...\n');

// NOTA: Las migraciones de base de datos NO se ejecutan durante el build
// porque pueden bloquear el proceso y causar timeouts.
// 
// Las migraciones deben ejecutarse:
// 1. Manualmente después del deploy: npm run migrate:notas
// 2. O a través de un webhook post-deploy
// 3. O en el primer request a la aplicación (lazy migration)
//
// El postinstall solo se usa para generar Prisma Client,
// que ya se hace en el script "build" antes de compilar.

console.log('✅ Post-install completado (solo verificación)');
console.log('💡 Las migraciones se ejecutarán después del deploy si es necesario');
