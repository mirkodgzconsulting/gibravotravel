const https = require('https');
const http = require('http');

async function triggerPostDeploy() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const url = `${baseUrl}/api/post-deploy`;
  
  console.log(`🚀 Ejecutando post-deploy en: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Post-deploy ejecutado exitosamente');
      console.log('📋 Resultados:');
      data.results?.forEach(result => console.log(`   ${result}`));
    } else {
      console.error('❌ Error en post-deploy:', data.message);
      if (data.error) {
        console.error('   Detalles:', data.error);
      }
    }

  } catch (error) {
    console.error('❌ Error ejecutando post-deploy:', error.message);
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  triggerPostDeploy();
}

module.exports = { triggerPostDeploy };
