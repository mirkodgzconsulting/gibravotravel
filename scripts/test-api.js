// Script para probar la API directamente
const testClerkId = 'user_33SQggnVckEUlVdo4wdvivN5KaW';

async function testAPI() {
  try {
    console.log('🔍 Probando API directamente...');
    console.log('ClerkId:', testClerkId);
    
    const response = await fetch(`http://localhost:3000/api/user/role?clerkId=${testClerkId}`);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Solo ejecutar si estamos en un entorno donde fetch está disponible
if (typeof fetch !== 'undefined') {
  testAPI();
} else {
  console.log('❌ fetch no está disponible en este entorno');
}
