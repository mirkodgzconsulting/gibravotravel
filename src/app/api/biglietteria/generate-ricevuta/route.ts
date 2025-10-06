import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { recordId } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Obtener el registro de la base de datos
    const record = await prisma.biglietteria.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    // Leer la plantilla Word
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'ricevuta-template.docx');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 500 }
      );
    }

    const content = fs.readFileSync(templatePath, 'binary');

    // Cargar el documento con PizZip
    const zip = new PizZip(content);

    // Crear instancia de Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Preparar los datos para reemplazar en la plantilla
    const data = {
      cliente: record.cliente || '',
      indirizzo: record.indirizzo || '',
      // Puedes agregar más campos aquí cuando estés listo
      // data: record.data ? new Date(record.data).toLocaleDateString('it-IT') : '',
      // servizio: record.servizio || '',
      // itinerario: record.itinerario || '',
      // passeggero: record.passeggero || '',
      // venduto: record.venduto ? `€${record.venduto.toFixed(2)}` : '',
      // acconto: record.acconto ? `€${record.acconto.toFixed(2)}` : '',
      // dapagare: record.daPagare ? `€${record.daPagare.toFixed(2)}` : '',
      // pnr: record.pnr || '',
    };

    // Reemplazar los placeholders con los datos
    doc.render(data);

    // Generar el documento
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Crear el nombre del archivo
    const fileName = `Ricevuta_${record.cliente.replace(/\s+/g, '_')}_${new Date().getTime()}.docx`;

    // Retornar el documento como respuesta
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error generating ricevuta:', error);
    return NextResponse.json(
      { error: 'Error generating document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

