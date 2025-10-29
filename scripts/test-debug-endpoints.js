const https = require('https');
const http = require('http');

// Configuración
const PRODUCTION_URL = 'https://gibravotravel.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

async function testDebugEndpoints() {
  console.log('🧪 PROBANDO ENDPOINTS DE DEBUG');
  console.log('==============================');

  // Probar en local primero
  console.log('\n1. Probando en LOCAL...');
  await testEndpoint(`${LOCAL_URL}/api/debug/clerk`, 'GET');
  
  console.log('\n2. Probando creación de usuario en LOCAL...');
  await testEndpoint(`${LOCAL_URL}/api/debug/test-user-creation`, 'POST', {
    email: `test-local-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'Local',
    phoneNumber: '+1234567890',
    role: 'USER'
  });

  // Probar en producción
  console.log('\n3. Probando en PRODUCCIÓN...');
  await testEndpoint(`${PRODUCTION_URL}/api/debug/clerk`, 'GET');
  
  console.log('\n4. Probando creación de usuario en PRODUCCIÓN...');
  await testEndpoint(`${PRODUCTION_URL}/api/debug/test-user-creation`, 'POST', {
    email: `test-prod-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'Production',
    phoneNumber: '+1234567890',
    role: 'USER'
  });
}

async function testEndpoint(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          console.log(`   ${method} ${url}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response:`, JSON.stringify(jsonResponse, null, 2));
          
          if (jsonResponse.success) {
            console.log('   ✅ Éxito');
          } else {
            console.log('   ❌ Error');
          }
        } catch (parseError) {
          console.log(`   ${method} ${url}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response (raw):`, responseData);
          console.log('   ❌ Error parseando JSON');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ${method} ${url}`);
      console.log(`   ❌ Error de conexión: ${error.message}`);
      resolve();
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

testDebugEndpoints();
