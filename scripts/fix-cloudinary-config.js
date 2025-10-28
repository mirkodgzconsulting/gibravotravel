const { v2 as cloudinary } = require('cloudinary');

function fixCloudinaryConfig() {
  console.log('🔧 Corrigiendo configuración de Cloudinary...\n');

  try {
    // 1. Verificar si CLOUDINARY_URL está disponible
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    
    if (cloudinaryUrl) {
      console.log('✅ CLOUDINARY_URL encontrado');
      console.log(`📊 URL: ${cloudinaryUrl.substring(0, 20)}...`);
      
      // Configurar Cloudinary usando la URL
      cloudinary.config({
        secure: true
      });
      
      console.log('✅ Cloudinary configurado usando CLOUDINARY_URL');
    } else {
      console.log('❌ CLOUDINARY_URL no encontrado');
      console.log('📝 Configurando con valores por defecto...');
      
      // Configurar con valores por defecto (como TOUR BUS)
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
        api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
        api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
      });
      
      console.log('✅ Cloudinary configurado con valores por defecto');
    }

    // 2. Probar la configuración
    console.log('\n2. Probando configuración de Cloudinary...');
    
    cloudinary.api.ping()
      .then(result => {
        console.log('✅ Cloudinary: Conexión exitosa');
        console.log(`📊 Status: ${result.status}`);
      })
      .catch(error => {
        console.log(`❌ Cloudinary: Error - ${error.message}`);
      });

    // 3. Mostrar configuración actual
    console.log('\n3. Configuración actual de Cloudinary:');
    const config = cloudinary.config();
    console.log(`   • Cloud Name: ${config.cloud_name || 'No configurado'}`);
    console.log(`   • API Key: ${config.api_key ? 'Configurado' : 'No configurado'}`);
    console.log(`   • API Secret: ${config.api_secret ? 'Configurado' : 'No configurado'}`);
    console.log(`   • Secure: ${config.secure || false}`);

    console.log('\n✅ Configuración de Cloudinary corregida!');

  } catch (error) {
    console.error('❌ Error configurando Cloudinary:', error);
  }
}

fixCloudinaryConfig();
