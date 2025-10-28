const fs = require('fs');
const path = require('path');

function fixRicevutaTemplate() {
  console.log('🔧 Corrigiendo plantilla de recibo...\n');

  try {
    // 1. Crear directorio templates si no existe
    const templatesDir = 'public/templates';
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      console.log(`✅ ${templatesDir}: Creado`);
    } else {
      console.log(`✅ ${templatesDir}: Ya existe`);
    }

    // 2. Verificar si existe la plantilla en src
    const srcTemplate = 'src/templates/ricevuta-template.html';
    const publicTemplate = 'public/templates/ricevuta-template.html';

    if (fs.existsSync(srcTemplate)) {
      console.log('✅ Plantilla encontrada en src/templates/');
      
      // Copiar de src a public
      const templateContent = fs.readFileSync(srcTemplate, 'utf-8');
      fs.writeFileSync(publicTemplate, templateContent);
      console.log('✅ Plantilla copiada a public/templates/');
    } else if (fs.existsSync(publicTemplate)) {
      console.log('✅ Plantilla ya existe en public/templates/');
    } else {
      console.log('⚠️  Plantilla no encontrada, creando una básica...');
      
      // Crear plantilla básica
      const basicTemplate = `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ricevuta</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            font-size: 12px;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        
        .logo {
            width: 150px;
            height: auto;
            margin-bottom: 10px;
        }
        
        .title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        
        .subtitle {
            font-size: 14px;
            color: #666;
            margin: 5px 0 0 0;
        }
        
        .info-section {
            margin-bottom: 25px;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .info-label {
            font-weight: bold;
            width: 120px;
            flex-shrink: 0;
        }
        
        .info-value {
            flex: 1;
        }
        
        .passengers-section {
            margin: 25px 0;
        }
        
        .passengers-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        
        .passenger-item {
            margin-bottom: 8px;
            padding: 5px;
            background-color: #f9f9f9;
        }
        
        .totals-section {
            margin-top: 30px;
            border-top: 2px solid #333;
            padding-top: 20px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .total-label {
            font-weight: bold;
        }
        
        .total-value {
            font-weight: bold;
        }
        
        .final-total {
            font-size: 16px;
            font-weight: bold;
            border-top: 1px solid #333;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="logo.png" alt="Logo" class="logo">
        <h1 class="title">RICEVUTA</h1>
        <p class="subtitle">Documento generato automaticamente - Gibravo Travel</p>
    </div>
    
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span class="info-value">{{cliente}}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Passeggero:</span>
            <span class="info-value">{{passeggero}}</span>
        </div>
        <div class="info-row">
            <span class="info-label">PNR:</span>
            <span class="info-value">{{pnr}}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Itinerario:</span>
            <span class="info-value">{{itinerario}}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Servizio:</span>
            <span class="info-value">{{servizio}}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Metodo di Pagamento:</span>
            <span class="info-value">{{metodoPagamento}}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Agente:</span>
            <span class="info-value">{{agente}}</span>
        </div>
    </div>
    
    <div class="totals-section">
        <div class="total-row">
            <span class="total-label">Neto:</span>
            <span class="total-value">€{{neto}}</span>
        </div>
        <div class="total-row">
            <span class="total-label">Venduto:</span>
            <span class="total-value">€{{venduto}}</span>
        </div>
        <div class="total-row">
            <span class="total-label">Acconto:</span>
            <span class="total-value">€{{acconto}}</span>
        </div>
        <div class="total-row">
            <span class="total-label">Da Pagare:</span>
            <span class="total-value">€{{daPagare}}</span>
        </div>
        <div class="total-row final-total">
            <span class="total-label">Fee/AGV:</span>
            <span class="total-value">€{{feeAgv}}</span>
        </div>
    </div>
    
    <div class="footer">
        <p>Este documento no puede ser modificado</p>
    </div>
</body>
</html>`;
      
      fs.writeFileSync(publicTemplate, basicTemplate);
      console.log('✅ Plantilla básica creada en public/templates/');
    }

    // 3. Verificar que la plantilla existe y es válida
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
        console.log('✅ Plantilla: Todos los placeholders presentes');
      } else {
        console.log(`⚠️  Plantilla: Faltan placeholders: ${missingPlaceholders.join(', ')}`);
      }

      console.log(`✅ Plantilla de recibo lista en: ${publicTemplate}`);
    } else {
      console.log('❌ Error: No se pudo crear la plantilla');
    }

    console.log('\n✅ Corrección de plantilla de recibo completada!');

  } catch (error) {
    console.error('❌ Error corrigiendo plantilla de recibo:', error);
  }
}

fixRicevutaTemplate();
