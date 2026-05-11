/** Allegato tour (campo legacy `pdfFile`): validazione e upload Cloudinary. */

export const TOUR_ATTACHMENT_MAX_BYTES = 50 * 1024 * 1024;

const ALLOWED_EXT = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  'txt',
  'rtf',
  'csv',
  'zip',
  '7z',
]);

export function getTourAttachmentExtension(fileName: string): string | null {
  const parts = fileName.split('.');
  if (parts.length < 2) return null;
  const ext = parts.pop();
  return ext ? ext.toLowerCase() : null;
}

/** Messaggio in italiano, oppure null se valido / file vuoto. */
export function validateTourAttachmentFile(file: File): string | null {
  if (!file || file.size <= 0) return null;
  if (file.size > TOUR_ATTACHMENT_MAX_BYTES) {
    return `Il file è troppo grande. Massimo ${TOUR_ATTACHMENT_MAX_BYTES / (1024 * 1024)} MB.`;
  }
  const ext = getTourAttachmentExtension(file.name);
  if (!ext) {
    return 'Il file deve avere un\'estensione (es. .pdf, .jpg, .docx).';
  }
  if (!ALLOWED_EXT.has(ext)) {
    return `Formato non consentito (.${ext}). Ammessi: PDF, immagini, Office, OpenDocument, ZIP, TXT, CSV…`;
  }
  return null;
}

/** Attributo HTML `accept` per il selettore file (indicativo). */
export const TOUR_ATTACHMENT_INPUT_ACCEPT = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml',
  'application/pdf',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
  '.txt',
  '.rtf',
  '.csv',
  '.zip',
  '.7z',
].join(',');

export function tourAttachmentCloudinaryResourceType(fileName: string): 'image' | 'raw' {
  const ext = getTourAttachmentExtension(fileName);
  if (!ext) return 'raw';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(ext)) return 'image';
  return 'raw';
}
