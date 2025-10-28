const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando base de datos para producción...\n');

async function setupProduction() {
  try {
    // Verificar que DATABASE_URL esté configurado
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurado');
      process.exit(1);
    }

    console.log('✅ DATABASE_URL encontrado');

    // Leer el script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'migrate-production.sql'), 'utf8');
    
    // Dividir el script en comandos individuales
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...\n`);

    // Ejecutar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`   ${i + 1}/${commands.length}: Ejecutando comando...`);
          
          // Usar psql para ejecutar el comando
          execSync(`psql "${process.env.DATABASE_URL}" -c "${command};"`, {
            stdio: 'pipe',
            encoding: 'utf8'
          });
          
          console.log(`   ✅ Comando ${i + 1} ejecutado exitosamente`);
        } catch (error) {
          // Algunos errores son esperados (como tablas que ya existen)
          if (error.message.includes('already exists') || 
              error.message.includes('already exists')) {
            console.log(`   ⚠️  Comando ${i + 1}: Ya existe (ignorando)`);
          } else {
            console.log(`   ❌ Error en comando ${i + 1}: ${error.message}`);
            // Continuar con el siguiente comando
          }
        }
      }
    }

    console.log('\n✅ Configuración de base de datos completada!');
    
    // Ejecutar verificación
    console.log('\n🔍 Ejecutando verificación...');
    execSync('node scripts/verify-production-setup.js', { stdio: 'inherit' });

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
}

setupProduction();
