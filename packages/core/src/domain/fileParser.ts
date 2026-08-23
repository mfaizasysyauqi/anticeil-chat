import { FileAttachment } from '../types';
import { validateFileUpload } from './storageLimits';

/**
 * Parses uploaded files purely client-side into structured text or base64 data.
 * Supports: PDF, TXT, Markdown, DOCX, XLSX, CSV, PPTX, JSON, Source Code, and Images.
 */
export async function parseUploadedFile(file: File, currentStorageUsage = 0): Promise<FileAttachment> {
  const validation = validateFileUpload(file, currentStorageUsage);
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }

  const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const name = file.name;
  const size = file.size;
  const type = file.type || getMimeFromExtension(name);
  const isImage = type.startsWith('image/');

  if (isImage) {
    const base64 = await readFileAsBase64(file);
    return {
      id,
      name,
      type,
      size,
      content: base64,
      isImage: true,
    };
  }

  const extension = name.split('.').pop()?.toLowerCase() || '';

  // Plain text & Code formats
  if (
    isTextExtension(extension) ||
    type.includes('text') ||
    type.includes('json') ||
    type.includes('javascript') ||
    type.includes('typescript')
  ) {
    const text = await readFileAsText(file);
    return {
      id,
      name,
      type,
      size,
      content: text,
      isImage: false,
    };
  }

  // CSV & Spreadsheet formats
  if (extension === 'csv' || extension === 'tsv') {
    const csvText = await readFileAsText(file);
    return {
      id,
      name,
      type: 'text/csv',
      size,
      content: formatCsvToReadable(csvText),
      isImage: false,
    };
  }

  // Binary Office & PDF formats (extracted via client-side stream parser)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const extractedText = extractTextFromBinary(new Uint8Array(arrayBuffer), extension);

    return {
      id,
      name,
      type,
      size,
      content: extractedText.trim() || `[Document: ${name} (${formatBytes(size)}) - Binary content loaded]`,
      isImage: false,
    };
  } catch (err) {
    console.warn(`[ChatByok] Client extraction fallback for ${name}:`, err);
    const fallbackText = await readFileAsText(file).catch(() => '');
    return {
      id,
      name,
      type,
      size,
      content: fallbackText || `[Document: ${name} (${formatBytes(size)})]`,
      isImage: false,
    };
  }
}

/**
 * Reads a file as UTF-8 text string.
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Reads an image file as base64 data URL.
 */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Fast client-side text extractor for binary documents (PDF, DOCX, XLSX, PPTX).
 */
function extractTextFromBinary(bytes: Uint8Array, extension: string): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const rawString = decoder.decode(bytes);

  // PDF Text Stream Extractor
  if (extension === 'pdf') {
    const textChunks: string[] = [];
    const textBlockRegex = /BT[\s\S]*?ET/g;
    let match: RegExpExecArray | null;

    while ((match = textBlockRegex.exec(rawString)) !== null) {
      const block = match[0];
      const textMatches = block.match(/\((.*?)\)\s*Tj/g) || block.match(/\[(.*?)\]\s*TJ/g);
      if (textMatches) {
        for (const tm of textMatches) {
          const clean = tm
            .replace(/[()\[\]]|Tj|TJ/g, '')
            .replace(/\\([()\\])/g, '$1')
            .trim();
          if (clean.length > 0) textChunks.push(clean);
        }
      }
    }

    if (textChunks.length > 0) {
      return textChunks.join(' ');
    }
  }

  // Office Open XML (DOCX, PPTX, XLSX) string extractor
  if (['docx', 'pptx', 'xlsx'].includes(extension)) {
    const xmlTagsRegex = /<[^>]+>/g;
    const readable = rawString
      .replace(xmlTagsRegex, ' ')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract printable sentences
    const words = readable.split(' ').filter((w) => w.length > 1 && /^[a-zA-Z0-9.,?!'"$%-]+$/.test(w));
    if (words.length > 10) {
      return words.slice(0, 4000).join(' ');
    }
  }

  // Generic clean printable ASCII extraction
  const cleanPrintable = rawString
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanPrintable.slice(0, 3000);
}

/**
 * Formats CSV text into clean, aligned markdown table for the LLM.
 */
function formatCsvToReadable(csv: string): string {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return '';

  const parsedRows = lines.slice(0, 50).map((line) => {
    return line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
  });

  if (parsedRows.length < 2) return csv;

  const header = `| ${parsedRows[0].join(' | ')} |`;
  const separator = `| ${parsedRows[0].map(() => '---').join(' | ')} |`;
  const body = parsedRows
    .slice(1)
    .map((row) => `| ${row.join(' | ')} |`)
    .join('\n');

  return `${header}\n${separator}\n${body}${lines.length > 50 ? `\n\n*(Showing first 50 rows of ${lines.length} total)*` : ''}`;
}

function isTextExtension(ext: string): boolean {
  const textExts = [
    'txt', 'md', 'markdown', 'json', 'ts', 'tsx', 'js', 'jsx', 'py',
    'html', 'css', 'scss', 'yaml', 'yml', 'xml', 'sql', 'sh', 'bash',
    'env', 'ini', 'toml', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'cs',
    'rb', 'php', 'swift', 'kt', 'dart'
  ];
  return textExts.includes(ext);
}

function getMimeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'pdf': return 'application/pdf';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'csv': return 'text/csv';
    case 'json': return 'application/json';
    case 'md': return 'text/markdown';
    default: return 'text/plain';
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
