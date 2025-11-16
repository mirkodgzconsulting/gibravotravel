const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tour_aereo' 
      AND column_name LIKE '%documento%'
      ORDER BY column_name
    `;
    
    console.log('Columnas documento en tour_aereo:');
    console.log(JSON.stringify(columns, null, 2));
    
    // Verificar todas las columnas
    const allColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tour_aereo' 
      ORDER BY column_name
    `;
    
    console.log('\nTodas las columnas en tour_aereo:');
    allColumns.forEach(col => console.log(`  - ${col.column_name}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();

