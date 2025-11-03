#!/usr/bin/env node

/**
 * 📥 IMPORTAR CLIENTES DESDE EXCEL
 * =================================
 * 
 * Este script importa clientes desde dataClientes.xlsx a la tabla clients
 * 
 * Uso:
 *   node scripts/import-clientes-excel.js [--user-email=email@example.com] [--dry-run]
 * 
 * Opciones:
 *   --user-email    Email del usuario que creará los registros (requerido si no hay usuarios)
 *   --dry-run       Solo mostrar qué se importaría sin guardar en la BD
 */

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Contador global para emails sinemail en esta sesión
let sinemailCounter = 0;

// Valores por defecto para campos requeridos que no están en el Excel
const DEFAULTS = {
  address: '', // Campo vacío
  birthPlace: '', // Campo vacío
  birthDate: new Date('1900-01-01'), // Fecha muy antigua para indicar que no está disponible
  emailPrefix: 'cliente', // Para generar emails únicos (este sí es necesario)
};

/**
 * Normaliza un string, eliminando espacios y caracteres especiales
 */
function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Genera un email único usando sinemail@gmail.com con número incremental
 */
async function generateUniqueEmail() {
  let email;
  let index = sinemailCounter;
  
  // Generar email según el índice actual
  if (index === 0) {
    email = 'sinemail@gmail.com';
  } else {
    email = `sinemail${index}@gmail.com`;
  }
  
  // Verificar si existe en la BD (para importación real)
  const existing = await prisma.client.findUnique({
    where: { email }
  });
  
  if (existing) {
    // Si existe, incrementar contador y recursar para siguiente número
    sinemailCounter++;
    return generateUniqueEmail();
  }
  
  // Email disponible, incrementar contador para siguiente cliente y devolver este
  sinemailCounter++;
  
  return email;
}

/**
 * Convierte una fecha de Excel a Date
 */
function excelDateToJSDate(excelDate) {
  if (!excelDate) return DEFAULTS.birthDate;
  
  // Si es un número (fecha serial de Excel)
  if (typeof excelDate === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + excelDate * 86400000);
  }
  
  // Si es un string
  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Si es un Date
  if (excelDate instanceof Date) {
    return excelDate;
  }
  
  return DEFAULTS.birthDate;
}

/**
 * Importa clientes desde el archivo Excel
 */
async function importClientes(options = {}) {
  const { userEmail, dryRun = false } = options;
  
  console.log('📥 IMPORTAR CLIENTES DESDE EXCEL\n');
  console.log(`   Modo: ${dryRun ? '🔍 DRY RUN (no guardará datos)' : '💾 GUARDAR'}`);
  console.log('');
  
  // 1. Leer el archivo Excel
  const excelPath = path.join(process.cwd(), 'public', 'dataClientes.xlsx');
  
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Error: No se encuentra el archivo ${excelPath}`);
    process.exit(1);
  }
  
  console.log(`📄 Leyendo archivo: ${excelPath}`);
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`✅ Encontradas ${data.length} filas en el archivo\n`);
  
  // 2. Obtener usuario creador
  let createdBy = null;
  
  if (userEmail) {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { clerkId: true }
    });
    
    if (!user) {
      console.error(`❌ Error: No se encuentra usuario con email ${userEmail}`);
      console.log('\n💡 Usuarios disponibles:');
      const users = await prisma.user.findMany({
        select: { email: true, firstName: true, lastName: true }
      });
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.firstName || ''} ${u.lastName || ''})`);
      });
      process.exit(1);
    }
    
    createdBy = user.clerkId;
    console.log(`👤 Usuario creador: ${userEmail} (${createdBy})\n`);
  } else {
    // Buscar el primer usuario activo
    const firstUser = await prisma.user.findFirst({
      where: { isActive: true },
      select: { clerkId: true, email: true }
    });
    
    if (!firstUser) {
      console.error('❌ Error: No hay usuarios en la base de datos');
      console.log('💡 Especifica un usuario con: --user-email=email@example.com');
      process.exit(1);
    }
    
    createdBy = firstUser.clerkId;
    console.log(`👤 Usuario creador (por defecto): ${firstUser.email} (${createdBy})\n`);
  }
  
  // 3. Procesar datos
  console.log('📊 Procesando datos...\n');
  
  const resultados = {
    total: 0,
    procesados: 0,
    creados: 0,
    omitidos: 0,
    errores: 0,
    duplicados: 0
  };
  
  const errores = [];
  const clientesParaCrear = []; // Array para batch insert
  const BATCH_SIZE = 100; // Insertar en lotes de 100
  
  // Primero, generar todos los emails únicos y preparar datos
  console.log('📋 Preparando datos para importación...\n');
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    resultados.total++;
    
    // Mapear columnas (case-insensitive)
    const nome = normalizeString(row['Nome'] || row['nome'] || row['NOME'] || '');
    const cognome = normalizeString(row['Cognome'] || row['cognome'] || row['COGNOME'] || '');
    const codiceFiscale = normalizeString(row['Codice Fiscale'] || row['codice fiscale'] || row['CODICE FISCALE'] || row['CodiceFiscale'] || '');
    const telefono = normalizeString(row['Telefono'] || row['telefono'] || row['TELEFONO'] || '');
    
    // Validar que al menos tenga Nome
    if (!nome) {
      resultados.omitidos++;
      continue;
    }
    
    try {
      // Generar email único usando sinemail@gmail.com con número incremental
      const email = await generateUniqueEmail();
      
      // Preparar datos
      const clienteData = {
        firstName: nome,
        lastName: cognome || '',
        fiscalCode: codiceFiscale || '',
        address: DEFAULTS.address,
        phoneNumber: telefono || '',
        email: email,
        birthPlace: DEFAULTS.birthPlace,
        birthDate: DEFAULTS.birthDate,
        isActive: true,
        createdBy: createdBy
      };
      
      clientesParaCrear.push(clienteData);
      resultados.procesados++;
      
      // Mostrar progreso cada 500 filas
      if ((i + 1) % 500 === 0) {
        console.log(`📊 Procesadas ${i + 1}/${data.length} filas...`);
      }
      
    } catch (error) {
      resultados.errores++;
      errores.push({
        fila: i + 2,
        nombre: nome,
        error: error.message
      });
    }
  }
  
  console.log(`\n✅ Preparación completada: ${clientesParaCrear.length} clientes listos para importar\n`);
  
  // Si es dry-run, solo mostrar
  if (dryRun) {
    resultados.creados = clientesParaCrear.length;
    console.log(`🔍 [DRY RUN] Se crearían ${clientesParaCrear.length} clientes`);
  } else {
    // Insertar en lotes para mejor rendimiento y evitar timeouts
    console.log(`💾 Insertando ${clientesParaCrear.length} clientes en lotes de ${BATCH_SIZE}...\n`);
    
    for (let i = 0; i < clientesParaCrear.length; i += BATCH_SIZE) {
      const batch = clientesParaCrear.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(clientesParaCrear.length / BATCH_SIZE);
      
      try {
        // Usar createMany para insertar en lote (más eficiente)
        await prisma.client.createMany({
          data: batch,
          skipDuplicates: true // Saltar duplicados sin error
        });
        
        resultados.creados += batch.length;
        console.log(`✅ Lote ${batchNum}/${totalBatches}: ${batch.length} clientes insertados (Total: ${resultados.creados})`);
        
      } catch (error) {
        // Si falla el batch, intentar insertar uno por uno
        console.log(`⚠️  Error en lote ${batchNum}, intentando insertar individualmente...`);
        
        for (const clienteData of batch) {
          try {
            await prisma.client.create({
              data: clienteData
            });
            resultados.creados++;
          } catch (individualError) {
            resultados.errores++;
            errores.push({
              fila: i + batch.indexOf(clienteData) + 2,
              nombre: clienteData.firstName,
              error: individualError.message
            });
          }
        }
      }
    }
  }
  
  // 4. Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📋 RESUMEN DE IMPORTACIÓN\n');
  console.log(`   Total de filas:        ${resultados.total}`);
  console.log(`   Procesadas:            ${resultados.procesados}`);
  console.log(`   ${dryRun ? '[DRY RUN] Se crearían:' : 'Creadas:'}              ${resultados.creados}`);
  console.log(`   Omitidas:              ${resultados.omitidos}`);
  console.log(`   Duplicados:            ${resultados.duplicados}`);
  console.log(`   Errores:               ${resultados.errores}`);
  
  if (errores.length > 0) {
    console.log('\n⚠️  Errores detallados:');
    errores.forEach(e => {
      console.log(`   Fila ${e.fila}: ${e.nombre} - ${e.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 Para guardar los datos, ejecuta sin --dry-run');
  } else {
    console.log('\n✅ Importación completada');
  }
  
  console.log('='.repeat(50));
}

// Main
async function main() {
  try {
    // Parsear argumentos
    const args = process.argv.slice(2);
    const options = {
      dryRun: args.includes('--dry-run'),
      userEmail: null
    };
    
    // Buscar --user-email
    const userEmailArg = args.find(arg => arg.startsWith('--user-email='));
    if (userEmailArg) {
      options.userEmail = userEmailArg.split('=')[1];
    }
    
    await importClientes(options);
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { importClientes };

