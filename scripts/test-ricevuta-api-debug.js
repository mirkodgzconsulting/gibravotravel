const fetch = require('node-fetch');

async function testRicevutaApiDebug() {
  console.log('🧪 PROBANDO API DE GENERACIÓN DE RECIBOS CON DEBUG');
  console.log('==================================================');

  try {
    // Usar el ID del registro que sabemos que tiene cuotas
    const recordId = 'cmh6i0x7r0004v1fk7kthucpb';
    
    console.log(`\n1. Probando API con recordId: ${recordId}`);
    
    const response = await fetch('http://localhost:3000/api/biglietteria/generate-ricevuta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recordId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error en la respuesta:', response.status);
      console.log('Error details:', errorText);
      return;
    }

    console.log('✅ API respondió correctamente');
    console.log('📄 Generando PDF...');
    
    const pdfBuffer = await response.buffer();
    console.log(`✅ PDF generado: ${pdfBuffer.length} bytes`);
    
    // Guardar el PDF para revisar
    const fs = require('fs');
    fs.writeFileSync('test-ricevuta-debug.pdf', pdfBuffer);
    console.log('📁 PDF guardado como: test-ricevuta-debug.pdf');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRicevutaApiDebug();
