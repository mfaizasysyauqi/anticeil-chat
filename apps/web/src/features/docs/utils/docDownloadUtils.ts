import { DocItem } from '../store/useDocsStore';
import { downloadDocAsZip } from './zipUtils';
import { compileLatexToHtml } from './latexCompiler';
import { compileTypstToHtml } from './typstCompiler';

/**
 * Get the main file extension for a given document format.
 */
export function getDocFileExtension(format: string): string {
  switch (format) {
    case 'latex':
      return 'tex';
    case 'typst':
      return 'typ';
    case 'sheet':
      return 'antsheet';
    case 'slide':
      return 'slide';
    case 'markdown':
    default:
      return 'md';
  }
}

/**
 * Downloads the main source file of a document.
 */
export function downloadDocSource(doc: DocItem): void {
  const ext = getDocFileExtension(doc.format);
  const mainSub = doc.files?.find((f) => f.isMain) || doc.files?.[0];
  const content = mainSub ? mainSub.content : doc.content || '';
  const fileName = `${(doc.title || 'document').replace(/[/\\?%*:|"<>]/g, '_')}.${ext}`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the full project bundle as a ZIP archive.
 */
export function downloadDocZip(doc: DocItem): void {
  downloadDocAsZip(doc);
}

/**
 * Compiles and triggers immediate Print / Save as PDF for a document.
 */
export function printOrSavePdf(doc: DocItem): void {
  let compiledHtml = '';
  const title = doc.title || 'Document';

  if (doc.format === 'latex') {
    compiledHtml = compileLatexToHtml(doc.content, title, doc.files);
  } else if (doc.format === 'typst') {
    const res = compileTypstToHtml(doc.content, title, doc.files);
    compiledHtml = res.html;
  } else if (doc.format === 'sheet') {
    // For sheet: simple formatted table or raw content
    compiledHtml = `
      <div style="font-family: sans-serif; padding: 24px;">
        <h2>${title}</h2>
        <pre style="background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 12px; white-space: pre-wrap;">${escapeHtml(doc.content)}</pre>
      </div>
    `;
  } else if (doc.format === 'slide') {
    // For slide: formatted slides preview
    const slides = doc.content.split(/^---$/m);
    compiledHtml = `
      <div style="font-family: sans-serif; padding: 24px;">
        <h2>${title}</h2>
        ${slides
          .map(
            (s, idx) => `
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #ffffff; page-break-inside: avoid;">
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">Slide ${idx + 1}</div>
            <div style="white-space: pre-wrap; font-size: 13px;">${escapeHtml(s.trim())}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  } else {
    // Markdown
    compiledHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; line-height: 1.6; color: #1e293b;">
        <h1 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">${title}</h1>
        <div style="white-space: pre-wrap; font-size: 14px; margin-top: 16px;">${escapeHtml(doc.content)}</div>
      </div>
    `;
  }

  // Create an iframe to print cleanly without pop-up blocking issues
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    // Fallback to window.open
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
            <style>
              @page { size: A4; margin: 15mm; }
              @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            ${compiledHtml}
            <script>
              window.onload = function() { window.print(); };
            <\/script>
          </body>
        </html>
      `);
      win.document.close();
    }
    return;
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
        <style>
          @page { size: A4; margin: 15mm; }
          body { margin: 0; padding: 0; background: #ffffff; color: #0f172a; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${compiledHtml}
      </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print failed, falling back:', err);
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 400);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
