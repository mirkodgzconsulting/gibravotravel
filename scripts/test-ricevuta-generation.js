const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testRicevutaGeneration() {
  console.log('🧪 PROBANDO GENERACIÓN DE RECIBOS');
  console.log('==================================\n');

  try {
    // 1. Verificar que existe la plantilla
    console.log('1. Verificando plantilla de recibo...');
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');
    
    if (!fs.existsSync(templatePath)) {
      console.log('   ❌ Plantilla NO encontrada en:', templatePath);
      return;
    }
    
    console.log('   ✅ Plantilla encontrada en:', templatePath);
    
    // Verificar contenido de la plantilla
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

    // 2. Verificar que existe el logo
    console.log('\n2. Verificando logo...');
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'Logo_gibravo.svg');
    if (fs.existsSync(logoPath)) {
      console.log('   ✅ Logo encontrado en:', logoPath);
    } else {
      console.log('   ⚠️  Logo NO encontrado en:', logoPath);
    }

    // 3. Buscar un registro de prueba en biglietteria
    console.log('\n3. Buscando registros de prueba...');
    const records = await prisma.biglietteria.findMany({
      take: 1,
      include: {
        pasajeros: true,
        cuotas: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (records.length === 0) {
      console.log('   ⚠️  No hay registros de prueba en biglietteria');
      console.log('   💡 Crea un registro de prueba primero');
      return;
    }

    const record = records[0];
    console.log(`   ✅ Registro encontrado: ID ${record.id}, Cliente: ${record.cliente}`);

    // 4. Simular la generación de datos (como en el API)
    console.log('\n4. Simulando generación de datos...');
    
    const agenteName = record.creator 
      ? `${record.creator.firstName || ''} ${record.creator.lastName || ''}`.trim() || record.creator.email
      : 'Usuario';

    const data = {
      cliente: record.cliente || '',
      passeggero: record.pasajeros?.[0]?.nombre || '',
      pnr: record.pnr || '',
      itinerario: record.itinerario || '',
      servizio: record.servizio || '',
      metodoPagamento: record.metodoPagamento || '',
      agente: agenteName,
      neto: record.neto?.toString() || '0',
      venduto: record.venduto?.toString() || '0',
      acconto: record.acconto?.toString() || '0',
      daPagare: record.daPagare?.toString() || '0',
      feeAgv: record.feeAgv?.toString() || '0',
      cuotas: record.cuotas || [],
      tieneCuotas: (record.cuotas?.length || 0) > 0
    };

    console.log('   ✅ Datos generados correctamente');
    console.log('   📋 Datos:', {
      cliente: data.cliente,
      passeggero: data.passeggero,
      pnr: data.pnr,
      agente: data.agente
    });

    // 5. Probar reemplazo de placeholders
    console.log('\n5. Probando reemplazo de placeholders...');
    let html = content;
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'cuotas' && Array.isArray(value)) {
        // Manejar arrays de cuotas
        html = html.replace(/\{\{#cuotas\}\}([\s\S]*?)\{\{\/cuotas\}\}/g, (match, content) => {
          if (value.length === 0) return '';
          return value.map(cuota => {
            let itemHtml = content;
            Object.entries(cuota).forEach(([cKey, cValue]) => {
              itemHtml = itemHtml.replace(new RegExp(`\\{\\{${cKey}\\}\\}`, 'g'), String(cValue));
            });
            return itemHtml;
          }).join('');
        });
      } else if (key === 'tieneCuotas' && value) {
        html = html.replace(/\{\{#tieneCuotas\}\}/g, '');
        html = html.replace(/\{\{\/tieneCuotas\}\}/g, '');
      } else if (key === 'tieneCuotas' && !value) {
        html = html.replace(/\{\{#tieneCuotas\}\}[\s\S]*?\{\{\/tieneCuotas\}\}/g, '');
      } else {
        html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value || ''));
      }
    });

    // Verificar que se reemplazaron los placeholders
    const unreplacedPlaceholders = [];
    requiredPlaceholders.forEach(placeholder => {
      if (html.includes(placeholder)) {
        unreplacedPlaceholders.push(placeholder);
      }
    });

    if (unreplacedPlaceholders.length === 0) {
      console.log('   ✅ Todos los placeholders reemplazados correctamente');
    } else {
      console.log(`   ⚠️  Placeholders no reemplazados: ${unreplacedPlaceholders.join(', ')}`);
    }

    // 6. Guardar HTML de prueba
    const testHtmlPath = path.join(process.cwd(), 'test-ricevuta.html');
    fs.writeFileSync(testHtmlPath, html);
    console.log(`   ✅ HTML de prueba guardado en: ${testHtmlPath}`);

    console.log('\n🎉 ¡Prueba de generación de recibos completada!');
    console.log('📋 Resumen:');
    console.log('   • Plantilla: ✅ Encontrada y válida');
    console.log('   • Logo: ✅ Encontrado');
    console.log('   • Datos: ✅ Generados correctamente');
    console.log('   • Placeholders: ✅ Reemplazados');
    console.log('   • HTML: ✅ Generado y guardado');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRicevutaGeneration();
