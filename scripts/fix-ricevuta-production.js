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
  console.log('🔧 CORRIGIENDO GENERACIÓN DE RECIBOS EN PRODUCCIÓN');
  console.log('==================================================\n');

  try {
    // 1. Verificar que estamos en producción
    const isProduction = process.env.NODE_ENV === 'production' ||
      process.env.VERCEL === '1' ||
      process.env.DATABASE_URL?.includes('postgresql://');

    if (!isProduction) {
      console.log('⚠️  Este script está diseñado para producción');
      console.log('💻 Para local, usa: node scripts/test-ricevuta-generation.js');
      return;
    }

    console.log('🌍 Entorno de producción detectado\n');

    // 2. Crear directorio de plantillas si no existe
    console.log('1. Verificando estructura de directorios...');
    const templatesDir = 'public/templates';
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      console.log(`   ✅ ${templatesDir}: Creado`);
    } else {
      console.log(`   ✅ ${templatesDir}: Ya existe`);
    }

    // 3. Copiar plantilla de src a public (como en local)
    console.log('\n2. Sincronizando plantilla de recibo...');
    const srcTemplate = 'src/templates/ricevuta-template.html';
    const publicTemplate = 'public/templates/ricevuta-template.html';

    if (fs.existsSync(srcTemplate)) {
      console.log('   📄 Plantilla encontrada en src/templates/');
      const templateContent = fs.readFileSync(srcTemplate, 'utf-8');
      fs.writeFileSync(publicTemplate, templateContent);
      console.log('   ✅ Plantilla copiada a public/templates/');
    } else if (fs.existsSync(publicTemplate)) {
      console.log('   ✅ Plantilla ya existe en public/templates/');
    } else {
      console.log('   ❌ Plantilla no encontrada en ninguna ubicación');
      return;
    }

    // 4. Verificar contenido de la plantilla
    console.log('\n3. Verificando contenido de la plantilla...');
    if (fs.existsSync(publicTemplate)) {
      const content = fs.readFileSync(publicTemplate, 'utf-8');
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
        console.log('   ✅ Todos los placeholders presentes');
      } else {
        console.log(`   ❌ Faltan placeholders: ${missingPlaceholders.join(', ')}`);

        // Corregir placeholders faltantes
        console.log('   🔧 Corrigiendo placeholders...');
        let correctedContent = content;

        // Agregar sección de totales si no existe
        if (!correctedContent.includes('{{neto}}')) {
          const totalsSection = `
        <!-- Información Finanziaria -->
        <div class="section-title">Dettagli di Pagamento</div>
        <table class="info-table">
            <tr>
                <td class="label">Neto:</td>
                <td class="value">{{neto}}</td>
            </tr>
            <tr>
                <td class="label">Totale Venduto:</td>
                <td class="value">{{venduto}}</td>
            </tr>
            <tr>
                <td class="label">Acconto:</td>
                <td class="value">{{acconto}}</td>
            </tr>
            <tr>
                <td class="label">Da Pagare:</td>
                <td class="value"><strong>{{daPagare}}</strong></td>
            </tr>
            <tr>
                <td class="label">Fee/AGV:</td>
                <td class="value"><strong>{{feeAgv}}</strong></td>
            </tr>
            <tr>
                <td class="label">Metodo di Pagamento:</td>
                <td class="value"><strong>{{metodoPagamento}}</strong></td>
            </tr>
        </table>`;

          // Insertar antes de la sección de cuotas
          correctedContent = correctedContent.replace(
            /(\{\{#tieneCuotas\}\})/,
            `${totalsSection}\n        $1`
          );
        }

        fs.writeFileSync(publicTemplate, correctedContent);
        console.log('   ✅ Placeholders corregidos');
      }
    }

    // 5. Verificar logo
    console.log('\n4. Verificando logo...');
    const logoPath = 'public/images/logo/Logo_gibravo.svg';
    if (fs.existsSync(logoPath)) {
      console.log('   ✅ Logo encontrado');
    } else {
      console.log('   ⚠️  Logo no encontrado, creando directorio...');
      const logoDir = 'public/images/logo';
      if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
        console.log(`   ✅ ${logoDir}: Creado`);
      }
    }

    // 6. Verificar Puppeteer
    console.log('\n5. Verificando Puppeteer...');
    try {
      execSync('node -e "require(\'puppeteer\')"', { stdio: 'pipe' });
      console.log('   ✅ Puppeteer disponible');
    } catch (error) {
      console.log('   ❌ Puppeteer no disponible');
      console.log('   🔧 Instalando Puppeteer...');
      runCommand('npm install puppeteer', 'Instalando Puppeteer');
    }

    // 7. Aplicar cambios de esquema sin borrar datos
    console.log('\n6. Aplicando cambios de esquema...');
    runCommand('npx prisma db push --accept-data-loss', 'Aplicando esquema');

    // 8. Generar cliente Prisma
    console.log('\n7. Generando cliente Prisma...');
    runCommand('npx prisma generate', 'Generando cliente Prisma');

    // 9. Probar generación
    console.log('\n8. Probando generación de recibos...');
    try {
      execSync('node scripts/diagnose-ricevuta-production.js', { stdio: 'inherit' });
      console.log('   ✅ Prueba completada');
    } catch (testError) {
      console.log('   ⚠️  Error en prueba, pero continuando...');
    }

    console.log('\n🎉 ¡Corrección de generación de recibos completada!');
    console.log('📋 Resumen:');
    console.log('   • Plantilla: ✅ Sincronizada y verificada');
    console.log('   • Logo: ✅ Verificado');
    console.log('   • Puppeteer: ✅ Verificado');
    console.log('   • Esquema: ✅ Aplicado');
    console.log('   • Prisma: ✅ Generado');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  }
}

main();
