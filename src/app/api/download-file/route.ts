import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dskliu1ig',
    api_key: process.env.CLOUDINARY_API_KEY || '538724966551851',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'Q1fP7-pH6iiltPbFNkqPn0d93no',
  });
}

// Esta ruta debe ser pública para permitir descargas de archivos
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'documento';

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL del archivo no proporcionada' }, { status: 400 });
    }

    // Validar que la URL sea de Cloudinary o una URL válida
    if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    // Detectar si es una URL de Cloudinary y si es un archivo raw (no imagen)
    const isCloudinary = fileUrl.includes('cloudinary.com') || fileUrl.includes('res.cloudinary.com');
    // Es un archivo raw si:
    // 1. Está en /raw/upload/, O
    // 2. Está en /image/upload/ pero la extensión del archivo no es una imagen
    const hasRawPath = fileUrl.includes('/raw/upload/');
    const hasImagePath = fileUrl.includes('/image/upload/');
    const isImageExtension = filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) || fileUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
    const isRawFile = isCloudinary && (hasRawPath || (hasImagePath && !isImageExtension));

    let response: Response;
    let buffer: Buffer;

    try {
      if (isCloudinary && isRawFile) {
        // Para archivos raw de Cloudinary, intentar diferentes estrategias
        // Los PDFs pueden estar en /image/upload/ aunque no sean imágenes
        
        // Estrategia 1: Si está en /raw/upload/, usar resource_type: 'raw'
        let urlMatch = fileUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+?)(?:\?|$)/);
        if (urlMatch) {
          const publicId = urlMatch[1];
          const signedUrl = cloudinary.url(publicId, {
            resource_type: 'raw',
            secure: true,
            sign_url: true,
          });
          response = await fetch(signedUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
        } else {
          // Estrategia 2: Si está en /image/upload/, extraer public_id
          // Los PDFs subidos con 'auto' terminan aquí pero Cloudinary los trata como raw
          urlMatch = fileUrl.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\?|$)/);
          if (urlMatch) {
            const publicId = urlMatch[1];
            
            // Para archivos en /image/upload/ que no son imágenes (PDFs subidos con 'auto')
            // Intentar primero como 'raw' porque aunque estén en /image/, son archivos raw
            const signedRawUrl = cloudinary.url(publicId, {
              resource_type: 'raw',
              secure: true,
              sign_url: true,
            });
            
            response = await fetch(signedRawUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });
            
            // Si falla como raw, intentar como image
            if (!response.ok) {
              const signedImageUrl = cloudinary.url(publicId, {
                resource_type: 'image',
                secure: true,
                sign_url: true,
              });
              response = await fetch(signedImageUrl, {
                method: 'GET',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
              });
            }
          } else {
            // Si no podemos extraer el public_id, usar la URL original
            response = await fetch(fileUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });
          }
        }
      } else {
        // Para imágenes o URLs no-Cloudinary, usar fetch normal
        response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
      }

      if (!response.ok) {
        return NextResponse.json(
          { error: `Error al descargar el archivo: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      // Obtener el contenido del archivo
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      // Verificar que el buffer no esté vacío
      if (!buffer || buffer.length === 0) {
        return NextResponse.json(
          { error: 'El archivo descargado está vacío' },
          { status: 500 }
        );
      }

      // Determinar el tipo de contenido basado en la extensión del archivo
      const extension = filename.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';

      switch (extension) {
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'doc':
          contentType = 'application/msword';
          break;
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'xls':
          contentType = 'application/vnd.ms-excel';
          break;
        case 'xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        default:
          // Intentar obtener el content-type de la respuesta original
          const originalContentType = response.headers.get('content-type');
          if (originalContentType) {
            contentType = originalContentType;
          }
      }

      // Devolver el archivo con headers para forzar la descarga
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (fetchError) {
      return NextResponse.json(
        { error: 'Error al descargar el archivo desde la URL proporcionada' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

