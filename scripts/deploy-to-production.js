#!/usr/bin/env node

/**
 * 🚀 GIBRAVO TRAVEL - DEPLOY A PRODUCCIÓN
 * =======================================
 * 
 * Script para migrar fácilmente de desarrollo local a producción
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('🚀 GIBRAVO TRAVEL - DEPLOY A PRODUCCIÓN');
  console.log('=======================================\n');

  const command = process.argv[2];

  switch (command) {
    case 'check':
      console.log('🔍 Verificando preparación para deploy...\n');
      
      // Verificar que no hay archivos .env.local en commit
      try {
        const result = execSync('git status --porcelain', { encoding: 'utf8' });
        if (result.includes('.env.local')) {
          console.log('⚠️  ADVERTENCIA: .env.local está en el staging area');
          console.log('   Este archivo NO debe subirse a producción');
        } else {
          console.log('✅ .env.local no está en staging (correcto)');
        }
      } catch (error) {
        console.log('ℹ️  No se pudo verificar git status');
      }

      // Verificar que el build funciona
      console.log('\n🔧 Verificando que el build funciona...');
      try {
        execSync('npm run build', { stdio: 'pipe' });
        console.log('✅ Build exitoso');
      } catch (error) {
        console.log('❌ Build falló - revisa los errores antes de hacer deploy');
        process.exit(1);
      }

      console.log('\n🎉 Todo listo para deploy!');
      console.log('\n📋 Pasos para deploy:');
      console.log('   1. git add .');
      console.log('   2. git commit -m "mensaje descriptivo"');
      console.log('   3. git push origin main');
      console.log('   4. Vercel desplegará automáticamente');
      break;

    case 'build':
      console.log('🔧 Ejecutando build de producción...');
      try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('\n✅ Build completado exitosamente');
      } catch (error) {
        console.log('\n❌ Build falló');
        process.exit(1);
      }
      break;

    case 'commit':
      const message = process.argv[3] || 'feat: actualización de funcionalidades';
      console.log(`📝 Haciendo commit: "${message}"`);
      try {
        execSync('git add .', { stdio: 'inherit' });
        execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
        console.log('✅ Commit realizado');
      } catch (error) {
        console.log('❌ Error en commit:', error.message);
      }
      break;

    case 'push':
      console.log('🚀 Haciendo push a producción...');
      try {
        execSync('git push origin main', { stdio: 'inherit' });
        console.log('✅ Push completado');
        console.log('🌐 Vercel desplegará automáticamente');
      } catch (error) {
        console.log('❌ Error en push:', error.message);
      }
      break;

    case 'full':
      console.log('🚀 Deploy completo a producción...');
      try {
        // Build
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build exitoso');

        // Commit
        const message = process.argv[3] || 'feat: actualización de funcionalidades';
        execSync('git add .', { stdio: 'inherit' });
        execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
        console.log('✅ Commit realizado');

        // Push
        execSync('git push origin main', { stdio: 'inherit' });
        console.log('✅ Push completado');

        console.log('\n🎉 Deploy completo exitoso!');
        console.log('🌐 Vercel desplegará automáticamente');
      } catch (error) {
        console.log('❌ Error en deploy:', error.message);
        process.exit(1);
      }
      break;

    default:
      console.log('📋 Comandos disponibles:');
      console.log('   npm run deploy check           - Verificar preparación');
      console.log('   npm run deploy build           - Solo build');
      console.log('   npm run deploy commit "msg"    - Solo commit');
      console.log('   npm run deploy push            - Solo push');
      console.log('   npm run deploy full "msg"      - Deploy completo');
      console.log('\n🎯 Flujo recomendado:');
      console.log('   1. npm run deploy check        - Verificar todo');
      console.log('   2. npm run deploy full "msg"   - Deploy completo');
      break;
  }
}

main();

