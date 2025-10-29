const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO PLANTILLA EN PRODUCCIÓN');
console.log('=====================================\n');

// 1. Verificar plantilla local
console.log('1. Verificando plantilla local...');
const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.html');

if (fs.existsSync(templatePath)) {
  const content = fs.readFileSync(templatePath, 'utf-8');
  console.log('   ✅ Plantilla local existe');
  console.log(`   📏 Tamaño: ${content.length} caracteres`);
  
  // Verificar contenido específico
  const hasCuotasPendientes = content.includes('Cuotas Pendientes');
  const hasNoteDiPagamento = content.includes('Note di Pagamento');
  const fontSize = content.match(/font-size:\s*(\d+)px/);
  
  console.log(`   🔍 Contiene "Cuotas Pendientes": ${hasCuotasPendientes ? '✅' : '❌'}`);
  console.log(`   🔍 Contiene "Note di Pagamento": ${hasNoteDiPagamento ? '❌ (debería estar)' : '✅ (correcto)'}`);
  console.log(`   📏 Font-size base: ${fontSize ? fontSize[1] + 'px' : 'No encontrado'}`);
  
  // Verificar tamaños específicos
  const logoHeight = content.match(/\.logo\s*\{[^}]*height:\s*(\d+)px/);
  const headerFontSize = content.match(/\.header-title h1[^}]*font-size:\s*(\d+)px/);
  
  console.log(`   🖼️  Logo height: ${logoHeight ? logoHeight[1] + 'px' : 'No encontrado'}`);
  console.log(`   📝 Header font-size: ${headerFontSize ? headerFontSize[1] + 'px' : 'No encontrado'}`);
  
} else {
  console.log('   ❌ Plantilla local no existe');
}

// 2. Verificar si hay cache o problemas
console.log('\n2. Verificando posibles problemas...');
console.log('   📁 Directorio public/templates:');
const templatesDir = path.join(process.cwd(), 'public', 'templates');
if (fs.existsSync(templatesDir)) {
  const files = fs.readdirSync(templatesDir);
  console.log(`   📄 Archivos: ${files.join(', ')}`);
} else {
  console.log('   ❌ Directorio no existe');
}

// 3. Verificar timestamp de modificación
console.log('\n3. Verificando timestamp...');
if (fs.existsSync(templatePath)) {
  const stats = fs.statSync(templatePath);
  console.log(`   📅 Última modificación: ${stats.mtime.toISOString()}`);
  console.log(`   📊 Tamaño del archivo: ${stats.size} bytes`);
}

console.log('\n✅ Verificación completada');
