import { DocItem } from '../store/useDocsStore';

export interface ZipFileInput {
  name: string;
  content: string | Uint8Array;
}

// Precomputed CRC-32 table for fast checksums
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c >>> 0;
}

function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Creates a standard PKZIP Blob (Method 0 - Store) without external dependencies.
 */
export function createZipBlob(files: ZipFileInput[]): Blob {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  const encoder = new TextEncoder();
  const date = new Date();
  const dosTime =
    ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)) & 0xffff;
  const dosDate =
    (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;

  for (const file of files) {
    const cleanName = file.name.replace(/\\/g, '/').replace(/^\/+/, '');
    const nameBytes = encoder.encode(cleanName);

    let dataBytes: Uint8Array;
    if (typeof file.content === 'string') {
      if (file.content.startsWith('data:') && file.content.includes(';base64,')) {
        try {
          const base64Str = file.content.split(';base64,')[1];
          const binaryStr = atob(base64Str);
          dataBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            dataBytes[i] = binaryStr.charCodeAt(i);
          }
        } catch {
          dataBytes = encoder.encode(file.content);
        }
      } else {
        dataBytes = encoder.encode(file.content);
      }
    } else {
      dataBytes = file.content;
    }

    const crc = computeCrc32(dataBytes);
    const size = dataBytes.length;

    // Local Header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const viewL = new DataView(localHeader.buffer);
    viewL.setUint32(0, 0x04034b50, true); // Signature
    viewL.setUint16(4, 20, true); // Version needed (2.0)
    viewL.setUint16(6, 0x0800, true); // UTF-8 filename flag
    viewL.setUint16(8, 0, true); // Compression: Store (0)
    viewL.setUint16(10, dosTime, true);
    viewL.setUint16(12, dosDate, true);
    viewL.setUint32(14, crc, true);
    viewL.setUint32(18, size, true); // Compressed size
    viewL.setUint32(22, size, true); // Uncompressed size
    viewL.setUint16(26, nameBytes.length, true);
    viewL.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    localHeaders.push(localHeader, dataBytes);

    // Central Directory Header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const viewC = new DataView(centralHeader.buffer);
    viewC.setUint32(0, 0x02014b50, true); // Signature
    viewC.setUint16(4, 20, true); // Version made by
    viewC.setUint16(6, 20, true); // Version needed
    viewC.setUint16(8, 0x0800, true); // UTF-8 flag
    viewC.setUint16(10, 0, true); // Store
    viewC.setUint16(12, dosTime, true);
    viewC.setUint16(14, dosDate, true);
    viewC.setUint32(16, crc, true);
    viewC.setUint32(20, size, true);
    viewC.setUint32(24, size, true);
    viewC.setUint16(28, nameBytes.length, true);
    viewC.setUint16(30, 0, true); // Extra length
    viewC.setUint16(32, 0, true); // Comment length
    viewC.setUint16(34, 0, true); // Disk start
    viewC.setUint16(36, 0, true); // Internal attrs
    viewC.setUint32(38, 0, true); // External attrs
    viewC.setUint32(42, offset, true); // Local header offset
    centralHeader.set(nameBytes, 46);

    centralHeaders.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) centralDirSize += ch.length;

  // End of Central Directory (22 bytes)
  const eocd = new Uint8Array(22);
  const viewE = new DataView(eocd.buffer);
  viewE.setUint32(0, 0x06054b50, true);
  viewE.setUint16(4, 0, true);
  viewE.setUint16(6, 0, true);
  viewE.setUint16(8, files.length, true);
  viewE.setUint16(10, files.length, true);
  viewE.setUint32(12, centralDirSize, true);
  viewE.setUint32(16, centralDirOffset, true);
  viewE.setUint16(20, 0, true);

  const totalLength = centralDirOffset + centralDirSize + 22;
  const out = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of [...localHeaders, ...centralHeaders, eocd]) {
    out.set(part, pos);
    pos += part.length;
  }

  return new Blob([out.buffer], { type: 'application/zip' });
}

function sanitizeFolderName(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'anticeil_project';
}

/**
/**
 * Packs a document project into a ZIP containing a root folder and files with canonical folder structure & extensions:
 * - LaTeX -> folder with .tex, .bib, .sty, subfiles, etc.
 * - Typst -> folder with .typ, subfiles, etc.
 * - Sheet -> folder with .antsheet, .csv, etc.
 * - Slide -> folder with .slide, .md, etc.
 * - Markdown -> folder with .md, subfiles, etc.
 */
export function downloadDocAsZip(doc: DocItem): void {
  const folderName = sanitizeFolderName(doc.title || 'anticeil_project');
  const zipFiles: ZipFileInput[] = [];

  const subFiles = doc.files && doc.files.length > 0 ? doc.files : [];
  const format = doc.format || 'latex';

  let defaultMainName = 'main.tex';
  if (format === 'typst') {
    defaultMainName = 'main.typ';
  } else if (format === 'sheet') {
    defaultMainName = 'sheet1.antsheet';
  } else if (format === 'slide') {
    defaultMainName = 'main.slide';
  } else if (format === 'markdown') {
    defaultMainName = 'main.md';
  }

  if (subFiles.length > 0) {
    const includedNames = new Set<string>();

    subFiles.forEach((file) => {
      const cleanName = file.name.replace(/\\/g, '/');
      const fileContent = file.content || (file.isMain ? doc.content : '') || '';
      zipFiles.push({
        name: `${folderName}/${cleanName}`,
        content: fileContent,
      });
      includedNames.add(cleanName);
    });

    // If main file wasn't explicitly included in subFiles list, add it
    const hasMain = subFiles.some((f) => f.isMain) || includedNames.has(defaultMainName);
    if (!hasMain && doc.content) {
      zipFiles.push({
        name: `${folderName}/${defaultMainName}`,
        content: doc.content,
      });
    }
  } else {
    // Single-file project
    zipFiles.push({
      name: `${folderName}/${defaultMainName}`,
      content: doc.content || '',
    });
  }

  const zipBlob = createZipBlob(zipFiles);
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${folderName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
