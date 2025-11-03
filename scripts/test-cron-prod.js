require('dotenv').config();

async function testCronProduccion() {
  try {
    console.log('🧪 Probando cron job de notificaciones en PRODUCCIÓN...\n');
    
    // URL de producción
    const url = 'https://systems.gibravo.it/api/cron/notificaciones';
    const secret = 'a96655e9ec5db18f88660b263a54157bc16571d1ab2eac0e3c4a7cf7f1338f31';
    
    console.log('📡 URL:', url);
    console.log('🔑 Secret:', secret.substring(0, 10) + '...\n');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Cron ejecutado exitosamente');
      console.log('📊 Resultado:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Error:', data);
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando cron:', error.message);
  }
}

testCronProduccion();

