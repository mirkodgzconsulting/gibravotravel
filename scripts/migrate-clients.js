require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuración
const EXCEL_FILE_PATH = './scripts/data/clientes-wordpress.xlsx'; // Ruta desde el directorio raíz
const ADMIN_USER_ID = 'user_33SQ3k9daADwzexJSS23utCpPqr'; // Tu Clerk ID de administrador

// Mapeo de columnas de Excel a campos de la base de datos
const COLUMN_MAPPING = {
  'Nome': 'firstName',
  'Cognome': 'lastName', 
  'Codice Fiscale': 'fiscalCode',
  'Indirizzo': 'address',
  'E-mail': 'email',
  'Telefono': 'phoneNumber',
  'Nato a': 'birthPlace',
  'Data di nascita': 'birthDate',
  'Documenti': 'documents'
};

async function migrateClients() {
  try {
    console.log('🚀 Iniciando migración de clientes desde WordPress...\n');

    // Verificar que el archivo existe
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      throw new Error(`❌ No se encontró el archivo: ${EXCEL_FILE_PATH}`);
    }

    // Leer el archivo Excel
    console.log('📖 Leyendo archivo Excel...');
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0]; // Primera hoja
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Se encontraron ${data.length} registros en el archivo\n`);

    if (data.length === 0) {
      throw new Error('❌ No se encontraron datos en el archivo Excel');
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
        // Mapear los datos
        const clientData = {
          firstName: row['Nome']?.toString().trim() || '',
          lastName: row['Cognome']?.toString().trim() || '',
          fiscalCode: row['Codice Fiscale']?.toString().trim() || 'N/A',
          address: row['Indirizzo']?.toString().trim() || '',
          email: row['E-mail']?.toString().trim() || '',
          phoneNumber: row['Telefono']?.toString().trim() || '',
          birthPlace: row['Nato a']?.toString().trim() || 'Italia',
          birthDate: parseDate(row['Data di nascita']) || new Date(),
          documents: row['Documenti']?.toString().trim() || null,
          createdBy: ADMIN_USER_ID,
          isActive: true
        };
        
        // Limpiar valores "undefined" y otros valores problemáticos
        if (clientData.lastName === 'undefined' || clientData.lastName === '') {
          clientData.lastName = 'Apellido_No_Disponible';
        }
        if (clientData.email === 'undefined') {
          clientData.email = '';
        }
        if (clientData.fiscalCode === 'undefined') {
          clientData.fiscalCode = 'N/A';
        }

        // Validaciones básicas
        if (!clientData.firstName || !clientData.lastName) {
          console.log(`⚠️  Fila ${i + 1}: Datos incompletos, saltando...`);
          skippedCount++;
          continue;
        }
        
        // Si no hay email, generar uno temporal
        if (!clientData.email) {
          clientData.email = `temp_${clientData.firstName.toLowerCase().replace(/\s+/g, '')}_${clientData.lastName.toLowerCase().replace(/\s+/g, '')}_${i + 1}@temp.com`;
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
      const logContent = `Migración de clientes - ${new Date().toISOString()}\n\nErrores:\n${errors.join('\n')}`;
      fs.writeFileSync('./migration-errors.log', logContent);
      console.log('\n📝 Log de errores guardado en: migration-errors.log');
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
  
  // Intentar diferentes formatos de fecha
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
  
  // Intentar parsear directamente
  const parsed = new Date(dateValue);
  if (isNaN(parsed.getTime())) {
    console.warn(`⚠️  No se pudo parsear la fecha: ${dateValue}, usando fecha actual`);
    return new Date();
  }
  
  return parsed;
}

// Ejecutar migración
if (require.main === module) {
  migrateClients()
    .then(() => {
      console.log('\n🎉 Migración completada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateClients };
