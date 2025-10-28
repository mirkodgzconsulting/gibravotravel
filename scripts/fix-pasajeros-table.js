const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPasajerosTable() {
  try {
    console.log('🔧 Reparando tabla pasajeros_biglietteria...\n');
    
    // 1. Hacer backup de los datos existentes
    console.log('📦 Haciendo backup de datos...');
    const backupData = await prisma.$queryRaw`
      SELECT * FROM pasajeros_biglietteria
    `;
    console.log(`✅ Backup completado: ${backupData.length} registros`);
    
    // 2. Eliminar la tabla
    console.log('\n🗑️  Eliminando tabla pasajeros_biglietteria...');
    await prisma.$executeRaw`DROP TABLE IF EXISTS pasajeros_biglietteria CASCADE`;
    console.log('✅ Tabla eliminada');
    
    // 3. Recrear la tabla con el schema correcto
    console.log('\n🔨 Recreando tabla pasajeros_biglietteria...');
    await prisma.$executeRaw`
      CREATE TABLE pasajeros_biglietteria (
        id TEXT PRIMARY KEY,
        "biglietteriaId" TEXT NOT NULL,
        "nombrePasajero" TEXT NOT NULL,
        servizio TEXT NOT NULL,
        andata TIMESTAMP(3),
        ritorno TIMESTAMP(3),
        "netoBiglietteria" DOUBLE PRECISION,
        "vendutoBiglietteria" DOUBLE PRECISION,
        "tieneExpress" BOOLEAN DEFAULT false,
        "netoExpress" DOUBLE PRECISION,
        "vendutoExpress" DOUBLE PRECISION,
        "tienePolizza" BOOLEAN DEFAULT false,
        "netoPolizza" DOUBLE PRECISION,
        "vendutoPolizza" DOUBLE PRECISION,
        "tieneLetteraInvito" BOOLEAN DEFAULT false,
        "netoLetteraInvito" DOUBLE PRECISION,
        "vendutoLetteraInvito" DOUBLE PRECISION,
        "tieneHotel" BOOLEAN DEFAULT false,
        "netoHotel" DOUBLE PRECISION,
        "vendutoHotel" DOUBLE PRECISION,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "pasajeros_biglietteria_biglietteriaId_fkey" 
          FOREIGN KEY ("biglietteriaId") 
          REFERENCES biglietteria(id) 
          ON DELETE CASCADE
      );
    `;
    console.log('✅ Tabla recreada');
    
    // 4. Restaurar los datos
    console.log('\n📥 Restaurando datos...');
    for (const row of backupData) {
      await prisma.$executeRaw`
        INSERT INTO pasajeros_biglietteria (
          id, "biglietteriaId", "nombrePasajero", servizio, andata, ritorno,
          "netoBiglietteria", "vendutoBiglietteria",
          "tieneExpress", "netoExpress", "vendutoExpress",
          "tienePolizza", "netoPolizza", "vendutoPolizza",
          "tieneLetteraInvito", "netoLetteraInvito", "vendutoLetteraInvito",
          "tieneHotel", "netoHotel", "vendutoHotel",
          "createdAt", "updatedAt"
        ) VALUES (
          ${row.id}, ${row.biglietteriaId}, ${row.nombrePasajero}, ${row.servizio},
          ${row.andata}, ${row.ritorno},
          ${row.netoBiglietteria}, ${row.vendutoBiglietteria},
          ${row.tieneExpress || false}, ${row.netoExpress}, ${row.vendutoExpress},
          ${row.tienePolizza || false}, ${row.netoPolizza}, ${row.vendutoPolizza},
          ${row.tieneLetteraInvito || false}, ${row.netoLetteraInvito}, ${row.vendutoLetteraInvito},
          ${row.tieneHotel || false}, ${row.netoHotel}, ${row.vendutoHotel},
          ${row.createdAt}, ${row.updatedAt}
        )
      `;
    }
    console.log(`✅ Datos restaurados: ${backupData.length} registros`);
    
    console.log('\n✅ Reparación completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasajerosTable();

