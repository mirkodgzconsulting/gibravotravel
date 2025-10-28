require('dotenv').config();

async function testCronNotificaciones() {
  try {
    console.log('🧪 Probando cron job de notificaciones...\n');
    
    const url = 'http://localhost:3000/api/cron/notificaciones';
    const secret = process.env.CRON_SECRET || 'test-secret';
    
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
    console.error('❌ Error ejecutando cron:', error);
  }
}

testCronNotificaciones();
