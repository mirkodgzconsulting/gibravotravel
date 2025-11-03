import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Contador global para emails sinemail
let sinemailCounter = 0;

function normalizeString(str: string | undefined): string {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

async function generateUniqueEmail(): Promise<string> {
  let email: string;
  let index = sinemailCounter;
  
  if (index === 0) {
    email = 'sinemail@gmail.com';
  } else {
    email = `sinemail${index}@gmail.com`;
  }
  
  // Verificar si existe en la BD
  const existing = await prisma.client.findUnique({
    where: { email }
  });
  
  if (existing) {
    // Si existe, usar siguiente número
    sinemailCounter++;
    return generateUniqueEmail();
  }
  
  // Email disponible, incrementar contador para siguiente cliente y devolver este
  sinemailCounter++;
  
  return email;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea ADMIN o TI
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, email: true, clerkId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && user.role !== 'TI') {
      return NextResponse.json({ 
        error: 'Solo administradores pueden ejecutar esta acción' 
      }, { status: 403 });
    }

    // Leer el archivo Excel
    // En Vercel, los archivos en /public se sirven como estáticos
    // Necesitamos leerlo desde la URL pública o del sistema de archivos
    
    let workbook;
    let fileBuffer;
    
    // Método 1: Intentar leer desde el sistema de archivos (local y algunas configuraciones de Vercel)
    const possiblePaths = [
      join(process.cwd(), 'public', 'dataClientes.xlsx'),
      join(process.cwd(), '.next', 'static', 'dataClientes.xlsx'),
      join(process.cwd(), 'dataClientes.xlsx'),
    ];

    let found = false;
    for (const excelPath of possiblePaths) {
      try {
        fileBuffer = await readFile(excelPath);
        workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        console.log(`✅ Archivo encontrado en sistema de archivos: ${excelPath}`);
        found = true;
        break;
      } catch (error) {
        // Continuar intentando otras rutas
        continue;
      }
    }

    // Método 2: Si no se encuentra en el sistema de archivos, descargar desde URL pública
    if (!found) {
      try {
        // Obtener la URL base desde el request
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const host = request.headers.get('host') || 
                     process.env.VERCEL_URL || 
                     'localhost:3000';
        const baseUrl = `${protocol === 'http' ? 'http' : 'https'}://${host}`;
        
        const fileUrl = `${baseUrl}/dataClientes.xlsx`;
        console.log(`📥 Intentando descargar desde URL: ${fileUrl}`);
        
        const response = await fetch(fileUrl, {
          // En Vercel, necesitamos hacer la petición como si fuera externa
          headers: {
            'User-Agent': 'GiBravo-Import-Service'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        console.log(`✅ Archivo descargado desde URL pública`);
        found = true;
      } catch (error) {
        console.error('❌ Error descargando desde URL:', error);
        // Log adicional para debugging
        console.error('Headers disponibles:', {
          host: request.headers.get('host'),
          protocol: request.headers.get('x-forwarded-proto'),
          vercelUrl: process.env.VERCEL_URL
        });
      }
    }

    if (!found || !workbook) {
      return NextResponse.json({ 
        error: 'No se encuentra el archivo dataClientes.xlsx',
        details: 'El archivo debe estar en /public/dataClientes.xlsx y ser accesible públicamente',
        suggestion: 'Verifica que el archivo esté en el repositorio en /public/dataClientes.xlsx'
      }, { status: 404 });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📄 Encontradas ${data.length} filas en el archivo`);

    // Resetear contador
    sinemailCounter = 0;

    // Procesar datos
    const resultados = {
      total: 0,
      procesados: 0,
      creados: 0,
      omitidos: 0,
      errores: 0,
      duplicados: 0
    };

    const errores: Array<{ fila: number; nombre: string; error: string }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, any>;
      resultados.total++;

      // Mapear columnas (case-insensitive)
      const nome = normalizeString(row['Nome'] || row['nome'] || row['NOME'] || '');
      const cognome = normalizeString(row['Cognome'] || row['cognome'] || row['COGNOME'] || '');
      const codiceFiscale = normalizeString(
        row['Codice Fiscale'] || row['codice fiscale'] || row['CODICE FISCALE'] || row['CodiceFiscale'] || ''
      );
      const telefono = normalizeString(row['Telefono'] || row['telefono'] || row['TELEFONO'] || '');

      // Validar que al menos tenga Nome
      if (!nome) {
        resultados.omitidos++;
        continue;
      }

      try {
        // Generar email único
        const email = await generateUniqueEmail();

        // Verificar si ya existe por email
        const existing = await prisma.client.findUnique({
          where: { email }
        });

        if (existing) {
          resultados.duplicados++;
          continue;
        }

        // Preparar datos
        const clienteData = {
          firstName: nome,
          lastName: cognome || '',
          fiscalCode: codiceFiscale || '',
          address: '',
          phoneNumber: telefono || '',
          email: email,
          birthPlace: '',
          birthDate: new Date('1900-01-01'),
          isActive: true,
          createdBy: user.clerkId
        };

        // Crear cliente en la base de datos
        await prisma.client.create({
          data: clienteData
        });

        resultados.creados++;
        resultados.procesados++;

      } catch (error) {
        resultados.errores++;
        errores.push({
          fila: i + 2,
          nombre: nome,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Importación completada',
      resultados,
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error('Error en importación:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

