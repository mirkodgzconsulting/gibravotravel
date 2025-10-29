// Script para probar los datos de agentes
const fetch = require('node-fetch');

async function testAgentData() {
  try {
    console.log('🔍 Probando datos de agentes...');
    
    // Fetch datos de biglietteria
    const biglietteriaResponse = await fetch('http://localhost:3000/api/biglietteria');
    const biglietteriaData = await biglietteriaResponse.json();
    
    console.log('📊 Biglietteria - Total records:', biglietteriaData.records?.length || 0);
    
    if (biglietteriaData.records && biglietteriaData.records.length > 0) {
      console.log('📋 Primeros 3 registros:');
      biglietteriaData.records.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. Creator:`, record.creator);
        console.log(`     CreadoPor:`, record.creadoPor);
        console.log(`     Data:`, record.data);
        console.log('---');
      });
      
      // Agrupar por creator
      const creators = new Set();
      biglietteriaData.records.forEach(record => {
        if (record.creator?.firstName && record.creator?.lastName) {
          const name = `${record.creator.firstName} ${record.creator.lastName}`.trim();
          creators.add(name);
        } else if (record.creadoPor) {
          creators.add(record.creadoPor);
        } else {
          creators.add('Sin asignar');
        }
      });
      
      console.log('👥 Agentes únicos encontrados:', Array.from(creators));
    }
    
    // Fetch datos de tour-aereo
    const tourAereoResponse = await fetch('http://localhost:3000/api/tour-aereo');
    const tourAereoData = await tourAereoResponse.json();
    
    console.log('✈️ Tour Aereo - Total tours:', tourAereoData.tours?.length || 0);
    
    if (tourAereoData.tours && tourAereoData.tours.length > 0) {
      console.log('📋 Primeros 3 tours:');
      tourAereoData.tours.slice(0, 3).forEach((tour, index) => {
        console.log(`  ${index + 1}. Creator:`, tour.creator);
        console.log(`     CreadoPor:`, tour.creadoPor);
        console.log(`     FechaViaje:`, tour.fechaViaje);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAgentData();
