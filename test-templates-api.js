// Script para probar la API de templates
const testApi = async () => {
  try {
    console.log('🔍 Testing templates API...');
    
    const response = await fetch('/api/travel-templates');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Data received:', data);
      console.log('📋 Templates count:', data.templates?.length || 0);
      
      if (data.templates && data.templates.length > 0) {
        console.log('📄 First template:', data.templates[0]);
        console.log('🔍 ACC field in first template:', data.templates[0].acc);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Ejecutar si estamos en el navegador
if (typeof window !== 'undefined') {
  testApi();
}

module.exports = { testApi };
