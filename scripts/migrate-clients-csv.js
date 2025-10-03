const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuración
const CSV_FILE_PATH = './data/clientes-wordpress.csv'; // Cambia esta ruta
const ADMIN_USER_ID = 'tu-clerk-user-id'; // Reemplaza con tu Clerk ID de administrador

// Función para parsear CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }

  return data;
}

async function migrateClientsFromCSV() {
  try {
    console.log('🚀 Iniciando migración de clientes desde CSV...\n');

    // Verificar que el archivo existe
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`❌ No se encontró el archivo: ${CSV_FILE_PATH}`);
    }

    // Leer el archivo CSV
    console.log('📖 Leyendo archivo CSV...');
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const data = parseCSV(csvContent);

    console.log(`📊 Se encontraron ${data.length} registros en el archivo\n`);

    if (data.length === 0) {
      throw new Error('❌ No se encontraron datos en el archivo CSV');
    }

    // Mostrar las primeras columnas para verificar
    console.log('📋 Columnas encontradas en el archivo:');
    const firstRow = data[0];
    Object.keys(firstRow).forEach(col => {
      console.log(`   - ${col}`);
    });
    console.log('');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Procesar cada registro
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Mapear los datos (ajusta según las columnas de tu CSV)
        const clientData = {
          firstName: row['Nome']?.trim() || '',
          lastName: row['Cognome']?.trim() || '',
          fiscalCode: row['Codice Fiscale']?.trim() || '',
          address: row['Indirizzo']?.trim() || '',
          email: row['E-mail']?.trim() || '',
          phoneNumber: row['Telefono']?.trim() || '',
          birthPlace: row['Nato a']?.trim() || 'Italia',
          birthDate: parseDate(row['Data di nascita']),
          documents: row['Documenti']?.trim() || null,
          createdBy: ADMIN_USER_ID,
          isActive: true
        };

        // Validaciones básicas
        if (!clientData.firstName || !clientData.lastName || !clientData.email) {
          console.log(`⚠️  Fila ${i + 1}: Datos incompletos, saltando...`);
          skippedCount++;
          continue;
        }

        // Verificar si el email ya existe
        const existingClient = await prisma.client.findUnique({
          where: { email: clientData.email }
        });

        if (existingClient) {
          console.log(`⚠️  Fila ${i + 1}: Email ${clientData.email} ya existe, saltando...`);
          skippedCount++;
          continue;
        }

        // Insertar en la base de datos
        await prisma.client.create({
          data: clientData
        });

        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`✅ Procesados ${successCount} registros...`);
        }

      } catch (error) {
        errorCount++;
        const errorMsg = `Fila ${i + 1}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Mostrar resumen
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`✅ Registros insertados exitosamente: ${successCount}`);
    console.log(`⚠️  Registros saltados: ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Total procesados: ${successCount + skippedCount + errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORES DETALLADOS:');
      errors.slice(0, 10).forEach(error => console.log(`   ${error}`));
      if (errors.length > 10) {
        console.log(`   ... y ${errors.length - 10} errores más`);
      }
    }

    // Guardar log de errores
    if (errors.length > 0) {
      const logContent = `Migración de clientes CSV - ${new Date().toISOString()}\n\nErrores:\n${errors.join('\n')}`;
      fs.writeFileSync('./migration-errors-csv.log', logContent);
      console.log('\n📝 Log de errores guardado en: migration-errors-csv.log');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

function parseDate(dateValue) {
  if (!dateValue) return new Date();
  
  const dateStr = dateValue.toString();
  
  // Formato italiano (DD/MM/YYYY)
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return new Date(`${year}-${month}-${day}`);
    }
  }
  
  // Formato ISO (YYYY-MM-DD)
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(dateStr);
  }
  
  const parsed = new Date(dateValue);
  if (isNaN(parsed.getTime())) {
    console.warn(`⚠️  No se pudo parsear la fecha: ${dateValue}, usando fecha actual`);
    return new Date();
  }
  
  return parsed;
}

// Ejecutar migración
if (require.main === module) {
  migrateClientsFromCSV()
    .then(() => {
      console.log('\n🎉 Migración completada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateClientsFromCSV };
