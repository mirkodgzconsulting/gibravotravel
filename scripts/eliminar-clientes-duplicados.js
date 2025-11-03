#!/usr/bin/env node

/**
 * 🗑️ ELIMINAR CLIENTES DUPLICADOS
 * ================================
 * 
 * Este script elimina clientes duplicados basándose en firstName + lastName
 * Mantiene el registro más antiguo y elimina los más nuevos
 * 
 * Uso:
 *   node scripts/eliminar-clientes-duplicados.js [--dry-run]
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function eliminarDuplicados(dryRun = false) {
  console.log('🔍 BUSCANDO CLIENTES DUPLICADOS\n');
  console.log(`   Modo: ${dryRun ? '🔍 DRY RUN (no eliminará datos)' : '🗑️  ELIMINAR'}`);
  console.log('');

  try {
    // Obtener todos los clientes ordenados por fecha de creación
    const todosClientes = await prisma.client.findMany({
      orderBy: {
        createdAt: 'asc' // El más antiguo primero
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true
      }
    });

    console.log(`📊 Total de clientes en la base de datos: ${todosClientes.length}\n`);

    // Agrupar por nombre + apellido
    const gruposPorNombre = {};
    
    todosClientes.forEach(cliente => {
      const key = `${cliente.firstName.trim().toLowerCase()}|${(cliente.lastName || '').trim().toLowerCase()}`;
      
      if (!gruposPorNombre[key]) {
        gruposPorNombre[key] = [];
      }
      
      gruposPorNombre[key].push(cliente);
    });

    // Encontrar duplicados (grupos con más de 1 cliente)
    const duplicados = Object.entries(gruposPorNombre)
      .filter(([key, clientes]) => clientes.length > 1)
      .map(([key, clientes]) => ({
        nombre: key.split('|')[0],
        apellido: key.split('|')[1],
        clientes: clientes.sort((a, b) => a.createdAt - b.createdAt), // Ordenar por fecha
        cantidad: clientes.length
      }));

    console.log(`🔍 Duplicados encontrados: ${duplicados.length} grupos\n`);

    if (duplicados.length === 0) {
      console.log('✅ No se encontraron duplicados');
      return;
    }

    // Mostrar resumen
    let totalAEliminar = 0;
    duplicados.forEach(grupo => {
      const mantener = grupo.clientes[0]; // El más antiguo
      const eliminar = grupo.clientes.slice(1); // Los demás
      
      totalAEliminar += eliminar.length;
      
      if (!dryRun) {
        console.log(`📋 ${grupo.nombre} ${grupo.apellido}:`);
        console.log(`   ✅ Mantener: ${mantener.email} (${mantener.createdAt.toISOString()})`);
        eliminar.forEach(c => {
          console.log(`   🗑️  Eliminar: ${c.email} (${c.createdAt.toISOString()})`);
        });
      }
    });

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total duplicados: ${duplicados.length} grupos`);
    console.log(`   ${dryRun ? '[DRY RUN] Se eliminarían:' : 'Se eliminarán:'} ${totalAEliminar} clientes`);
    console.log(`   Quedarían: ${todosClientes.length - totalAEliminar} clientes únicos\n`);

    if (dryRun) {
      console.log('💡 Para eliminar realmente, ejecuta sin --dry-run');
      return;
    }

    // Confirmar eliminación
    console.log('⚠️  ADVERTENCIA: Esta operación eliminará clientes duplicados');
    console.log(`   Se eliminarán ${totalAEliminar} clientes duplicados\n`);

    // Eliminar duplicados (mantener el más antiguo)
    let eliminados = 0;
    for (const grupo of duplicados) {
      const mantener = grupo.clientes[0];
      const idsAEliminar = grupo.clientes.slice(1).map(c => c.id);

      try {
        const resultado = await prisma.client.deleteMany({
          where: {
            id: {
              in: idsAEliminar
            }
          }
        });

        eliminados += resultado.count;
        console.log(`✅ Eliminados ${resultado.count} duplicados de "${grupo.nombre} ${grupo.apellido}"`);
      } catch (error) {
        console.error(`❌ Error eliminando duplicados de "${grupo.nombre} ${grupo.apellido}":`, error.message);
      }
    }

    // Verificar resultado final
    const finalCount = await prisma.client.count();
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 RESUMEN FINAL\n');
    console.log(`   Clientes eliminados: ${eliminados}`);
    console.log(`   Clientes restantes:  ${finalCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Main
async function main() {
  try {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    await eliminarDuplicados(dryRun);

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { eliminarDuplicados };

