import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Importar los datos del Excel generados
import { EXCEL_DATA } from '../../../lib/migration-data';

function parseDate(dateValue: any) {
  if (!dateValue) return null;
  // Lógica para parsear fechas
  return new Date();
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario es ADMIN o TI
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || !['ADMIN', 'TI'].includes(user.role)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    console.log('🚀 Iniciando migración desde Vercel...');
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Procesar cada registro
    for (let i = 0; i < EXCEL_DATA.length; i++) {
      const row = EXCEL_DATA[i];
      
      try {
        // Mapear los datos
        const clientData = {
          firstName: row['Nome']?.toString().trim() || '',
          lastName: row['Cognome']?.toString().trim() || '',
          fiscalCode: row['Codice Fiscale']?.toString().trim() || 'N/A',
          address: row['Indirizzo']?.toString().trim() || '',
          email: row['E-mail']?.toString().trim() || '',
          phoneNumber: row['Telefono']?.toString().trim() || '',
          birthPlace: row['Nato a']?.toString().trim() || 'Italia',
          birthDate: parseDate(row['Data di nascita']) || new Date(),
          documents: null,
          createdBy: userId,
          isActive: true
        };

        // Limpiar valores problemáticos
        if (clientData.lastName === 'undefined' || clientData.lastName === '') {
          clientData.lastName = 'Apellido_No_Disponible';
        }
        if (clientData.email === 'undefined') {
          clientData.email = '';
        }
        if (clientData.fiscalCode === 'undefined') {
          clientData.fiscalCode = 'N/A';
        }

        // Validaciones básicas
        if (!clientData.firstName || !clientData.lastName) {
          console.log(`⚠️  Fila ${i + 1}: Datos incompletos, saltando...`);
          skippedCount++;
          continue;
        }

        // Si no hay email, generar uno temporal
        if (!clientData.email) {
          clientData.email = `temp_${clientData.firstName.toLowerCase().replace(/\s+/g, '')}_${clientData.lastName.toLowerCase().replace(/\s+/g, '')}_${i + 1}@temp.com`;
        }

        // Verificar si el email ya existe
        const existingClient = await prisma.client.findUnique({
          where: { email: clientData.email }
        });

        if (existingClient) {
          console.log(`⚠️  Fila ${i + 1}: Cliente ya existe, saltando...`);
          skippedCount++;
          continue;
        }

        // Crear el cliente
        await prisma.client.create({
          data: clientData
        });

        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`✅ Procesados: ${successCount} registros`);
        }

      } catch (error) {
        errorCount++;
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
        console.log(`❌ Fila ${i + 1}: Error - ${error}`);
      }
    }

    console.log('🎉 Migración completada!');
    console.log(`📊 RESUMEN:`);
    console.log(`✅ Registros insertados: ${successCount}`);
    console.log(`⚠️  Registros saltados: ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);

    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: EXCEL_DATA.length,
        successCount,
        skippedCount,
        errorCount
      },
      errors: errors.slice(0, 10) // Solo los primeros 10 errores
    });

  } catch (error) {
    console.error('❌ Error en migración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
