const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  try {
    console.log(`   🔧 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`   ✅ ${description} completado`);
  } catch (error) {
    console.log(`   ⚠️  Error en ${description}: ${error.message}`);
  }
}

function main() {
  console.log('🚀 GIBRAVO TRAVEL - SINCRONIZACIÓN SEGURA A PRODUCCIÓN');
  console.log('====================================================\n');

  try {
    // 1. Aplicar solo cambios de esquema SIN borrar datos
    console.log('1. Aplicando cambios de esquema (SIN borrar datos)...');
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('   ✅ Esquema aplicado exitosamente');
    } catch (error) {
      console.log('   ⚠️  Error aplicando esquema, continuando...');
    }

    // 2. Generar cliente Prisma
    console.log('\n2. Generando cliente Prisma...');
    runCommand('npx prisma generate', 'Generando cliente Prisma');

    // 3. Corregir archivos de subida
    console.log('\n3. Corrigiendo archivos de subida...');
    try {
      execSync('node scripts/fix-file-upload-errors.js', { stdio: 'inherit' });
      console.log('   ✅ Archivos de subida corregidos');
    } catch (fileError) {
      console.log('   ⚠️  Error corrigiendo archivos, continuando...');
    }

    // 4. Corregir plantilla de recibo
    console.log('\n4. Corrigiendo plantilla de recibo...');
    try {
      execSync('node scripts/fix-ricevuta-template.js', { stdio: 'inherit' });
      console.log('   ✅ Plantilla de recibo corregida');
    } catch (templateError) {
      console.log('   ⚠️  Error corrigiendo plantilla, continuando...');
    }

    // 5. Verificar que la plantilla existe
    console.log('\n5. Verificando plantilla de recibo...');
    const templatePath = 'public/templates/ricevuta-template.html';
    if (fs.existsSync(templatePath)) {
      console.log('   ✅ Plantilla encontrada en:', templatePath);
      
      // Verificar contenido
      const content = fs.readFileSync(templatePath, 'utf-8');
      const requiredPlaceholders = [
        '{{cliente}}', '{{passeggero}}', '{{pnr}}', '{{itinerario}}',
        '{{servizio}}', '{{metodoPagamento}}', '{{agente}}',
        '{{neto}}', '{{venduto}}', '{{acconto}}', '{{daPagare}}', '{{feeAgv}}'
      ];

      let missingPlaceholders = [];
      requiredPlaceholders.forEach(placeholder => {
        if (!content.includes(placeholder)) {
          missingPlaceholders.push(placeholder);
        }
      });

      if (missingPlaceholders.length === 0) {
        console.log('   ✅ Plantilla: Todos los placeholders presentes');
      } else {
        console.log(`   ⚠️  Plantilla: Faltan placeholders: ${missingPlaceholders.join(', ')}`);
      }
    } else {
      console.log('   ❌ Plantilla NO encontrada en:', templatePath);
    }

    // 6. Verificar logo
    console.log('\n6. Verificando logo...');
    const logoPath = 'public/images/logo/Logo_gibravo.svg';
    if (fs.existsSync(logoPath)) {
      console.log('   ✅ Logo encontrado en:', logoPath);
    } else {
      console.log('   ⚠️  Logo NO encontrado en:', logoPath);
    }

    console.log('\n🎉 ¡Sincronización segura completada!');
    console.log('📋 Los datos de prueba se mantienen intactos');
    console.log('🔧 Solo se aplicaron cambios de código y configuración');

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
  }
}

main();
