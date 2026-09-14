import { DocItem, DocFormat } from '../store/useDocsStore';
import { compileLatexToHtml } from './latexCompiler';
import { compileTypstToHtml } from './typstCompiler';
import { getBundledDocContent } from './docResolver';

export type PaperSizeId = 'a4' | 'letter' | 'legal' | 'a5' | 'b5' | 'custom';

export interface PaperSizeConfig {
  id: PaperSizeId;
  name: string;
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
  description: string;
}

export const PAPER_SIZES: PaperSizeConfig[] = [
  { id: 'a4', name: 'A4', widthMm: 210, heightMm: 297, widthPx: 794, heightPx: 1123, description: '210 × 297 mm (Standar Internasional)' },
  { id: 'letter', name: 'Letter', widthMm: 215.9, heightMm: 279.4, widthPx: 816, heightPx: 1056, description: '8.5 × 11 in (Standar US)' },
  { id: 'legal', name: 'Legal', widthMm: 215.9, heightMm: 355.6, widthPx: 816, heightPx: 1344, description: '8.5 × 14 in (Dokumen Hukum)' },
  { id: 'a5', name: 'A5', widthMm: 148, heightMm: 210, widthPx: 559, heightPx: 794, description: '148 × 210 mm (Buku Saku)' },
  { id: 'b5', name: 'B5', widthMm: 176, heightMm: 250, widthPx: 665, heightPx: 945, description: '176 × 250 mm (Monograf Ilmiah)' },
];

export function detectPaperSizeFromCode(code: string): PaperSizeId {
  if (!code) return 'a4';
  const lower = code.toLowerCase();

  // LaTeX patterns
  if (lower.includes('a4paper')) return 'a4';
  if (lower.includes('letterpaper')) return 'letter';
  if (lower.includes('legalpaper')) return 'legal';
  if (lower.includes('a5paper')) return 'a5';
  if (lower.includes('b5paper')) return 'b5';

  // Typst patterns: #set page(paper: "...")
  const typstMatch = lower.match(/#set\s+page\s*\([^)]*paper\s*:\s*["']([^"']+)["']/);
  if (typstMatch && typstMatch[1]) {
    const p = typstMatch[1];
    if (p.includes('a4')) return 'a4';
    if (p.includes('us-letter') || p.includes('letter')) return 'letter';
    if (p.includes('us-legal') || p.includes('legal')) return 'legal';
    if (p.includes('a5')) return 'a5';
    if (p.includes('b5')) return 'b5';
  }

  return 'a4';
}

export interface BuildPreviewOptions {
  doc: DocItem;
  theme?: string;
  language?: 'id' | 'en';
  paperSizeId?: PaperSizeId;
  customPaperWidthMm?: number;
  customPaperHeightMm?: number;
}

export function buildDocumentPreviewHtml({
  doc,
  theme = 'dark',
  language = 'id',
  paperSizeId,
  customPaperWidthMm = 210,
  customPaperHeightMm = 297,
}: BuildPreviewOptions): string {
  const raw = getBundledDocContent(doc) || doc.content || '';
  if (!raw.trim()) {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#64748b;font-size:13px;background:${theme === 'light' ? '#cbd5e1' : '#070a10'};">
          ${language === 'id' ? 'Dokumen belum memiliki konten.' : 'No document content yet.'}
        </body>
      </html>
    `;
  }

  const isLight = theme === 'light';
  const effectivePaperSize = paperSizeId || detectPaperSizeFromCode(raw);

  let paperWidthPx = 794;
  let paperHeightPx = 1123;
  let widthMm = 210;
  let heightMm = 297;

  if (effectivePaperSize === 'custom') {
    widthMm = customPaperWidthMm;
    heightMm = customPaperHeightMm;
    paperWidthPx = Math.max(200, Math.round(customPaperWidthMm * 3.779528));
    paperHeightPx = Math.max(200, Math.round(customPaperHeightMm * 3.779528));
  } else {
    const cfg = PAPER_SIZES.find((p) => p.id === effectivePaperSize) || PAPER_SIZES[0];
    paperWidthPx = cfg.widthPx;
    paperHeightPx = cfg.heightPx;
    widthMm = cfg.widthMm;
    heightMm = cfg.heightMm;
  }

  const isTypst =
    doc.format === 'typst' ||
    raw.includes('#set page') ||
    raw.includes('#block(') ||
    raw.startsWith('= ');

  let compiledDocHtml = '';
  if (doc.format === 'sheet') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; background: ${
              isLight ? '#f8fafc' : '#0f172a'
            }; color: ${isLight ? '#0f172a' : '#f1f5f9'}; }
            h2 { margin-top: 0; font-size: 16px; border-bottom: 1px solid ${isLight ? '#e2e8f0' : '#334155'}; padding-bottom: 8px; }
            pre { background: ${isLight ? '#ffffff' : '#1e293b'}; padding: 16px; border-radius: 8px; font-size: 12px; border: 1px solid ${
              isLight ? '#e2e8f0' : '#334155'
            }; font-family: 'JetBrains Mono', monospace; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h2>📊 ${doc.title || 'Spreadsheet'} (AntSheet Model)</h2>
          <pre>${escapeHtml(doc.content)}</pre>
        </body>
      </html>
    `;
  } else if (doc.format === 'slide') {
    const slides = doc.content.split(/^---$/m);
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: ${
              isLight ? '#f8fafc' : '#070a10'
            }; color: ${isLight ? '#0f172a' : '#f1f5f9'}; }
            .slide-card { background: ${isLight ? '#ffffff' : '#1e293b'}; border: 1px solid ${
              isLight ? '#e2e8f0' : '#334155'
            }; border-radius: 10px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
            .slide-header { font-size: 11px; font-weight: 700; color: #8B5CF6; text-transform: uppercase; margin-bottom: 8px; }
            .slide-body { white-space: pre-wrap; font-size: 13px; line-height: 1.6; }
          </style>
        </head>
        <body>
          ${slides
            .map(
              (s, i) => `
            <div class="slide-card">
              <div class="slide-header">Slide ${i + 1}</div>
              <div class="slide-body">${escapeHtml(s.trim())}</div>
            </div>
          `
            )
            .join('')}
        </body>
      </html>
    `;
  } else if (isTypst) {
    compiledDocHtml = compileTypstToHtml(raw, doc.title, doc.files).html;
  } else {
    compiledDocHtml = compileLatexToHtml(raw, doc.title, doc.files);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- KaTeX CSS & JS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
  
  <!-- Marked Markdown Parser -->
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
  
  <!-- Mermaid Diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>

  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      background-color: ${isLight ? '#cbd5e1' : '#070a10'};
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      overflow-x: hidden;
      overflow-y: auto;
    }
    #page-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 24px 16px;
      width: 100%;
      min-height: 100%;
      box-sizing: border-box;
      overflow-x: hidden;
    }
    #scaler-outer {
      position: relative;
      margin: 0 auto;
      flex-shrink: 0;
      overflow: visible;
    }
    #scaler-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: ${paperWidthPx}px;
      transform-origin: 0 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .paper-sheet-page {
      position: relative;
      width: ${paperWidthPx}px;
      height: ${paperHeightPx}px;
      min-height: ${paperHeightPx}px;
      max-height: ${paperHeightPx}px;
      margin-bottom: 24px;
      background: #ffffff;
      padding: 56px 64px 64px;
      border-radius: 2px;
      box-sizing: border-box;
      overflow: hidden;
      box-shadow: ${
        isLight
          ? '0 4px 18px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.08)'
          : '0 6px 24px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
      line-height: 1.7;
      font-size: 14.5px;
      color: #1a202c;
    }
    .paper-sheet-page:last-child {
      margin-bottom: 0;
    }
    .paper-page-content {
      width: 100%;
      position: relative;
    }
    .paper-page-footer {
      position: absolute;
      bottom: 24px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      font-family: 'Inter', system-ui, sans-serif;
      user-select: none;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Inter', system-ui, sans-serif;
      color: #0f172a;
      font-weight: 700;
      line-height: 1.3;
      margin-top: 1.2em;
      margin-bottom: 0.4em;
    }
    h1 { font-size: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    h2 { font-size: 19px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    h3 { font-size: 15.5px; }
    p { margin-top: 0; margin-bottom: 0.9em; }
    a { color: #0073ea; text-decoration: none; }
    a:hover { text-decoration: underline; }
    blockquote {
      margin: 1.1em 0;
      padding: 8px 16px;
      border-left: 4px solid #0073ea;
      background: #f8fafc;
      color: #475569;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.2em 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 11px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
    tr:nth-child(even) { background-color: #f8fafc; }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      color: #0f172a;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 14px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 12.5px;
      margin: 1em 0;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    .katex-display {
      margin: 1em 0 !important;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 4px 0;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    /* Slim and elegant preview scrollbar */
    html {
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
    }
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.45);
      border-radius: 6px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.75);
    }
    /* Academic Paper Styling (IEEE / Nature Style) */
    .academic-paper-wrapper {
      width: 100%;
    }
    .academic-paper-header {
      text-align: center;
      margin-bottom: 20px;
    }
    .academic-paper-title {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.25;
      color: #0f172a;
      margin: 0 0 10px 0;
      border-bottom: none;
      padding-bottom: 0;
      text-align: center;
    }
    .academic-paper-title .paper-formatted-block {
      margin: 4px auto;
      text-align: center;
    }
    .academic-paper-author {
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
      margin-bottom: 6px;
      text-align: center;
    }
    .academic-paper-date {
      font-size: 11px;
      color: #64748b;
      text-align: center;
    }
    .academic-paper-abstract-card {
      margin: 16px 0 24px;
      padding: 12px 18px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0073ea;
      border-radius: 4px;
      font-size: 13px;
      line-height: 1.6;
    }
    .academic-paper-abstract-text {
      text-align: justify;
      color: #334155;
    }
    .abstract-badge {
      font-weight: 700;
      font-style: italic;
      color: #0f172a;
    }
    .academic-paper-keywords {
      margin-top: 8px;
      font-size: 12px;
      color: #475569;
    }
    .paper-sec-title {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 14.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-align: center;
      margin: 22px 0 10px;
      text-transform: uppercase;
      color: #0f172a;
      border-bottom: none;
    }
    .paper-subsec-title {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      font-style: italic;
      margin: 16px 0 6px;
      color: #1e293b;
      border-bottom: none;
    }
    .paper-subsubsec-title {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12.5px;
      font-weight: 600;
      margin: 12px 0 4px;
      color: #334155;
    }
    .paper-para {
      text-align: justify;
      text-justify: inter-word;
      text-indent: 1.5em;
      margin-bottom: 0.7em;
      line-height: 1.65;
      font-size: 14px;
      color: #1e293b;
    }
    .paper-cite {
      color: #0073ea;
      font-weight: 600;
      font-size: 12.5px;
    }
    .paper-references {
      margin-top: 28px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
    .paper-ref-list {
      padding-left: 24px;
      font-size: 12.5px;
      line-height: 1.55;
      color: #334155;
    }
    .paper-ref-list li {
      margin-bottom: 6px;
    }
    /* Academic Tables (IEEE Style) */
    .academic-table-card {
      margin: 20px auto;
      width: 100%;
      max-width: 100%;
      text-align: center;
      display: block;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .academic-table-caption {
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-align: center;
      margin-bottom: 8px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .tab-label {
      font-weight: 800;
      color: #0f172a;
    }
    .academic-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 auto;
      font-size: 12.5px;
      line-height: 1.5;
      color: #1e293b;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      table-layout: auto;
    }
    .academic-table th {
      border-bottom: 1px solid #0f172a;
      padding: 7px 12px;
      font-weight: 700;
      text-align: left;
      white-space: nowrap;
      background-color: inherit;
      color: inherit;
    }
    .academic-table thead th,
    .academic-table thead th strong,
    .academic-table thead th span,
    .academic-table thead th b,
    .academic-table thead th p {
      color: inherit !important;
    }
    .academic-table td {
      border: none;
      border-bottom: 1px solid #e2e8f0;
      padding: 7px 12px;
      text-align: left;
      vertical-align: top;
      word-break: normal;
    }
    .academic-table tr:last-child td {
      border-bottom: none;
    }
    .paper-list {
      padding-left: 24px;
      margin: 8px 0 14px 0;
      font-size: 13.5px;
      line-height: 1.6;
      color: #1e293b;
    }
    .paper-list li {
      margin-bottom: 4px;
    }
    .paper-quote {
      margin: 14px 0;
      padding: 8px 16px;
      border-left: 3px solid #0073ea;
      background: #f8fafc;
      color: #334155;
      font-style: italic;
      font-size: 13px;
    }
    .paper-code {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 12px;
      margin: 14px 0;
      overflow-x: auto;
    }
    /* Table of Contents / Daftar Isi Card */
    .academic-toc-card {
      margin: 18px 0 24px 0;
      padding: 16px 20px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .academic-toc-title {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-align: center;
      margin-bottom: 12px;
      color: #0f172a;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .academic-toc-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .academic-toc-item {
      display: flex;
      align-items: baseline;
      font-size: 12.5px;
      color: #1e293b;
      line-height: 1.5;
    }
    .academic-toc-item.level-1 {
      font-weight: 600;
      color: #0f172a;
    }
    .academic-toc-item.level-2 {
      padding-left: 18px;
      font-size: 12px;
      color: #334155;
    }
    .academic-toc-item.level-3 {
      padding-left: 36px;
      font-size: 11.5px;
      color: #64748b;
    }
    .toc-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      margin-right: 8px;
      color: #0284c7;
      flex-shrink: 0;
    }
    .toc-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #cbd5e1;
      margin: 0 8px;
      height: 1px;
      min-width: 20px;
    }
    .toc-bullet {
      font-size: 11px;
      color: #94a3b8;
      flex-shrink: 0;
    }
    .doc-page-break {
      width: 100%;
      height: 0;
      margin: 0;
      padding: 0;
      border: none;
      visibility: hidden;
    }
    .academic-callout {
      margin: 14px 0;
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 13px;
      line-height: 1.55;
    }
    .academic-theorem, .academic-lemma {
      border-left: 3px solid #0284c7;
      background-color: #f0f9ff;
    }
    .academic-proof {
      border-left: 3px solid #64748b;
      background-color: #f8fafc;
    }
    .proof-label {
      font-weight: 700;
      font-style: italic;
    }
    .qed {
      float: right;
      font-size: 11px;
      color: #0f172a;
    }
    .academic-definition {
      border-left: 3px solid #10b981;
      background-color: #f0fdf4;
    }
    /* Titlepage & Cover Sheet Styling */
    .paper-cover-sheet .paper-page-content {
      min-height: calc(100% - 20px);
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      text-align: center !important;
      box-sizing: border-box;
      width: 100%;
    }
    .paper-cover-sheet .paper-page-content > * {
      text-align: center !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }
    .paper-cover-sheet .paper-page-footer {
      display: none !important;
    }
    .paper-titlepage {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 100%;
      margin: auto 0;
      box-sizing: border-box;
      padding: 24px 12px;
    }
    .paper-cover-sheet table,
    .paper-titlepage table {
      border-collapse: collapse !important;
      border: none !important;
      border-top: 2px solid #0f172a !important;
      border-bottom: 2px solid #0f172a !important;
      margin: 16px auto !important;
      background: transparent !important;
      width: auto !important;
      max-width: 100% !important;
    }
    .paper-cover-sheet table th,
    .paper-cover-sheet table td,
    .paper-titlepage table th,
    .paper-titlepage table td {
      border: none !important;
      border-bottom: none !important;
      padding: 6px 14px !important;
      background: transparent !important;
      text-align: left !important;
      vertical-align: top !important;
    }
    .paper-cover-sheet tr:nth-child(even),
    .paper-titlepage tr:nth-child(even) {
      background-color: transparent !important;
    }
    .tcolorbox {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      line-height: 1.55;
    }
    .paper-formatted-block {
      width: 100%;
      word-break: break-word;
      margin: 4px 0;
    }
    /* Description List (LaTeX \begin{description}) */
    .paper-description {
      margin: 12px 0 16px 0;
      padding: 0;
      width: 100%;
    }
    .paper-desc-row {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      margin-bottom: 7px;
      line-height: 1.55;
    }
    .paper-desc-term {
      font-weight: 700;
      color: #0f172a;
      min-width: 140px;
      flex-shrink: 0;
      margin-right: 12px;
      font-size: 13.5px;
    }
    .paper-desc-def {
      margin: 0;
      color: #334155;
      flex: 1;
      font-size: 13.5px;
    }
    .paper-footnote-ref {
      font-size: 10px;
      font-weight: 700;
      color: #0073ea;
      cursor: help;
      margin-left: 2px;
    }
    .paper-minipage {
      display: inline-block;
      vertical-align: top;
      box-sizing: border-box;
      padding: 4px;
    }
    @page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: 0;
    }
    @media print {
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      html, body {
        overflow: visible !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
      }
      #page-container {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        overflow: visible !important;
        display: block !important;
      }
      #scaler-outer {
        margin: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      #scaler-wrapper {
        position: static !important;
        transform: none !important;
        width: 100% !important;
        display: block !important;
        overflow: visible !important;
      }
      .paper-sheet-page {
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        border: none !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        width: 100% !important;
        height: 100vh !important;
        min-height: 100vh !important;
        max-height: 100vh !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }
      .academic-table-card, pre, .katex-display {
        overflow: visible !important;
      }
    }
  </style>
</head>
<body>
  <div id="page-container">
    <div id="scaler-outer">
      <div id="scaler-wrapper">
        <div id="rendered-pages-container"></div>
      </div>
    </div>
  </div>

  <div id="rendered-content-raw" style="position: absolute; top: -99999px; left: -99999px; width: ${paperWidthPx - 128}px; visibility: hidden; pointer-events: none;"></div>

  <script type="application/json" id="docs-raw-markdown">${JSON.stringify(raw).replace(/<\/script/gi, '<\\/script')}</script>
  <script type="application/json" id="docs-precompiled-html">${JSON.stringify(compiledDocHtml).replace(/<\/script/gi, '<\\/script')}</script>

  <script>
    window.addEventListener('error', function(e) {
      try {
        window.parent.postMessage({
          type: 'DOCS_PREVIEW_ERROR',
          message: e.message || String(e),
          lineno: e.lineno,
          colno: e.colno
        }, '*');
      } catch (err) {}
    });

    window.addEventListener('unhandledrejection', function(e) {
      try {
        window.parent.postMessage({
          type: 'DOCS_PREVIEW_ERROR',
          message: e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Promise Rejection'
        }, '*');
      } catch (err) {}
    });

    const rawMarkdown = JSON.parse(document.getElementById('docs-raw-markdown').textContent || '""');
    const precompiledHtml = JSON.parse(document.getElementById('docs-precompiled-html').textContent || '""');
    
    if (typeof marked !== 'undefined' && marked.setOptions) {
      marked.setOptions({ gfm: true, breaks: true });
    }

    const rawContainer = document.getElementById('rendered-content-raw');
    const pagedContainer = document.getElementById('rendered-pages-container');
    const isLight = ${isLight};
    const paperWidthPx = ${paperWidthPx};
    const paperHeightPx = ${paperHeightPx};

    try {
      if (precompiledHtml) {
        rawContainer.innerHTML = precompiledHtml;
      } else if (typeof marked !== 'undefined' && marked.parse) {
        rawContainer.innerHTML = marked.parse(rawMarkdown);
      } else {
        rawContainer.textContent = rawMarkdown;
      }
    } catch (e) {
      rawContainer.innerHTML = precompiledHtml || rawMarkdown;
    }

    // KaTeX
    try {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(rawContainer, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\\\(', right: '\\\\)', display: false},
            {left: '\\\\[', right: '\\\\]', display: true}
          ],
          throwOnError: false
        });
      }
    } catch (e) {}

    // Mermaid
    try {
      if (typeof mermaid !== 'undefined' && mermaid.initialize) {
        mermaid.initialize({ startOnLoad: true, theme: 'default', fontFamily: 'Inter, system-ui, sans-serif' });
      }
    } catch (e) {}

    function createPageSheet(pageIndex) {
      const sheet = document.createElement('div');
      sheet.className = 'paper-sheet-page';
      sheet.setAttribute('data-page-number', pageIndex);

      const content = document.createElement('div');
      content.className = 'paper-page-content';
      sheet.appendChild(content);

      const footer = document.createElement('div');
      footer.className = 'paper-page-footer';
      footer.textContent = pageIndex;
      sheet.appendChild(footer);

      return { sheet, content };
    }

    var totalPagesCount = 1;

    function getFlattenedChildNodes(container) {
      var result = [];
      function traverse(node) {
        if (!node) return;
        if (
          node.tagName === 'DIV' &&
          node.children &&
          node.children.length > 0 &&
          (node.classList.contains('academic-paper-wrapper') ||
            node.classList.contains('academic-paper-body') ||
            node.classList.contains('typst-paper-wrapper') ||
            node.classList.contains('typst-paper-body') ||
            node.classList.contains('typst-page-container') ||
            node.id === 'rendered-content-raw')
        ) {
          Array.from(node.children).forEach(traverse);
        } else if (node.querySelector && node.querySelector('.doc-page-break')) {
          Array.from(node.children).forEach(traverse);
        } else {
          result.push(node);
        }
      }
      Array.from(container.children).forEach(traverse);
      return result;
    }

    function hasVisibleContent(container) {
      if (!container) return false;
      if (
        container.querySelector &&
        container.querySelector(
          'img, svg, canvas, table, iframe, .paper-titlepage, .academic-toc-card, .tcolorbox, .paper-formatted-block, .academic-callout, .paper-minipage'
        )
      ) {
        return true;
      }
      return container.textContent && container.textContent.trim().length > 0;
    }

    function paginateAndRender() {
      try {
        pagedContainer.innerHTML = '';
        const childNodes = getFlattenedChildNodes(rawContainer);
        if (childNodes.length === 0) {
          const { sheet } = createPageSheet(1);
          pagedContainer.appendChild(sheet);
          return 1;
        }

        const availableHeight = paperHeightPx - 130;
        let currentPageNum = 1;
        let { sheet: currentSheet, content: currentContent } = createPageSheet(currentPageNum);
        pagedContainer.appendChild(currentSheet);

        childNodes.forEach(function(node) {
          if (node.tagName === 'P' && !hasVisibleContent(node) && !(node.querySelector && node.querySelector('.doc-page-break'))) {
            return;
          }

          const isPageBreak =
            (node.classList && node.classList.contains('doc-page-break')) ||
            (node.querySelector && node.querySelector('.doc-page-break') !== null) ||
            (node.tagName === 'HR' && node.style && node.style.pageBreakAfter === 'always');

          const isChapterHeading =
            (node.tagName === 'H1' && !node.classList.contains('academic-paper-title')) ||
            (node.classList && (node.classList.contains('paper-sec-title') || node.classList.contains('doc-chapter-title'))) ||
            (node.textContent && /^(\\s*)(Bab\\s+\\d+|Chapter\\s+\\d+)/i.test(node.textContent.trim()));

          if (isPageBreak || (isChapterHeading && hasVisibleContent(currentContent))) {
            if (hasVisibleContent(currentContent)) {
              currentPageNum++;
              const next = createPageSheet(currentPageNum);
              currentSheet = next.sheet;
              currentContent = next.content;
              pagedContainer.appendChild(currentSheet);
            }
            if (isPageBreak) return;
          }

          const clone = node.cloneNode(true);
          currentContent.appendChild(clone);

          if (currentContent.offsetHeight > availableHeight && currentContent.children.length > 1) {
            currentContent.removeChild(clone);
            currentPageNum++;
            const next = createPageSheet(currentPageNum);
            currentSheet = next.sheet;
            currentContent = next.content;
            pagedContainer.appendChild(currentSheet);
            currentContent.appendChild(clone);
          }
        });

        // Prune trailing empty pages
        while (pagedContainer.children.length > 1) {
          const lastSheet = pagedContainer.lastElementChild;
          const lastContent = lastSheet ? lastSheet.querySelector('.paper-page-content') : null;
          if (!lastContent || !hasVisibleContent(lastContent)) {
            pagedContainer.removeChild(lastSheet);
            currentPageNum = Math.max(1, currentPageNum - 1);
          } else {
            break;
          }
        }

        function toRomanLower(num) {
          if (num <= 0) return '';
          var romanMap = [
            [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
            [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
            [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
          ];
          var res = '';
          for (var i = 0; i < romanMap.length; i++) {
            while (num >= romanMap[i][0]) {
              res += romanMap[i][1];
              num -= romanMap[i][0];
            }
          }
          return res;
        }

        var allSheets = Array.from(pagedContainer.children);
        var hasFrontMatter = allSheets.some(function(sh) {
          return (
            sh.querySelector('.paper-titlepage') !== null ||
            sh.querySelector('.academic-toc-card') !== null ||
            sh.querySelector('[data-numbering="roman"]') !== null
          );
        });

        var romanCounter = 1;
        var arabicCounter = 1;
        var isMainMatter = !hasFrontMatter;

        allSheets.forEach(function(sh, idx) {
          var c = sh.querySelector('.paper-page-content');
          var f = sh.querySelector('.paper-page-footer');
          if (!c || !f) return;

          var isCover =
            c.querySelector('.paper-titlepage') !== null ||
            c.querySelector('.doc-page-empty-style') !== null ||
            c.querySelector('.typst-cover-page') !== null ||
            (idx === 0 && allSheets.length > 1 && (c.querySelector('.academic-paper-header') !== null || c.querySelector('h1') !== null));

          if (isCover) {
            sh.classList.add('paper-cover-sheet');
            f.textContent = '';
            f.style.display = 'none';
            return;
          }

          if (c.querySelector('[data-numbering="arabic"]') !== null) {
            isMainMatter = true;
          } else if (c.querySelector('[data-numbering="roman"]') !== null) {
            isMainMatter = false;
          } else if (hasFrontMatter && c.querySelector('.paper-sec-title') !== null) {
            isMainMatter = true;
          }

          var counterEl = c.querySelector('[data-page]');
          if (counterEl) {
            var targetP = parseInt(counterEl.getAttribute('data-page') || '', 10);
            if (!isNaN(targetP)) {
              if (isMainMatter) arabicCounter = targetP;
              else romanCounter = targetP;
            }
          }

          if (!isMainMatter) {
            f.textContent = toRomanLower(romanCounter);
            f.style.display = 'block';
            romanCounter++;
          } else {
            f.textContent = String(arabicCounter);
            f.style.display = 'block';
            arabicCounter++;
          }
        });

        if (typeof renderMathInElement === 'function') {
          try {
            renderMathInElement(pagedContainer, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\\\(', right: '\\\\)', display: false},
                {left: '\\\\[', right: '\\\\]', display: true}
              ],
              throwOnError: false
            });
          } catch (kErr) {}
        }

        totalPagesCount = currentPageNum;
        applyScaling();
        
        try {
          window.parent.postMessage({
            type: 'DOCS_PAGES_COUNT',
            count: totalPagesCount
          }, '*');
        } catch (mErr) {}

        return currentPageNum;
      } catch (paginateErr) {
        console.error('Pagination error:', paginateErr);
        pagedContainer.innerHTML = '';
        const { sheet, content } = createPageSheet(1);
        content.innerHTML = rawContainer.innerHTML;
        pagedContainer.appendChild(sheet);
        applyScaling();
        return 1;
      }
    }

    var currentZoomPercent = 0; // 0 = Auto Fit Width

    function applyScaling() {
      const scalerWrapper = document.getElementById('scaler-wrapper');
      const scalerOuter = document.getElementById('scaler-outer');
      const pageContainer = document.getElementById('page-container');
      if (!scalerWrapper || !scalerOuter) return;

      const clientW = (pageContainer ? pageContainer.clientWidth : 0) || window.innerWidth;
      const paddingHorizontal = 36;
      const availableW = Math.max(100, clientW - paddingHorizontal);

      let scale = 1;
      if (currentZoomPercent > 0) {
        scale = currentZoomPercent / 100;
        scalerOuter.style.width = Math.round(paperWidthPx * scale) + 'px';
        scalerOuter.style.maxWidth = 'none';
        if (pageContainer) pageContainer.style.overflowX = 'auto';
        document.documentElement.style.overflowX = 'auto';
      } else {
        scale = availableW / paperWidthPx;
        scalerOuter.style.width = Math.round(paperWidthPx * scale) + 'px';
        scalerOuter.style.maxWidth = '100%';
        if (pageContainer) pageContainer.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
      }

      scalerWrapper.style.transform = 'scale(' + scale + ')';
      const unscaledH = scalerWrapper.offsetHeight;
      scalerOuter.style.height = Math.round(unscaledH * scale) + 'px';
      scalerWrapper.style.width = paperWidthPx + 'px';

      try {
        window.parent.postMessage({
          type: 'DOCS_PREVIEW_SCALE',
          scale: Math.round(scale * 100),
          totalPages: totalPagesCount
        }, '*');
      } catch (e) {}
    }

    window.addEventListener('message', function(event) {
      if (!event.data) return;
      if (event.data.type === 'SET_ZOOM' || event.data.type === 'DOCS_SET_ZOOM') {
        currentZoomPercent = event.data.zoom === 'auto' ? 0 : (Number(event.data.zoom) || 0);
        applyScaling();
      } else if (event.data.type === 'SCROLL_TO_PAGE' || event.data.type === 'DOCS_GO_TO_PAGE') {
        const pNum = event.data.pageNumber || event.data.page || 1;
        const targetSheet = document.querySelector('.paper-sheet-page[data-page-number="' + pNum + '"]');
        if (targetSheet) {
          targetSheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (event.data.type === 'DOCS_SET_INVERTED') {
        const pages = document.querySelectorAll('.paper-sheet-page');
        for (let i = 0; i < pages.length; i++) {
          pages[i].style.filter = event.data.inverted
            ? 'invert(0.92) hue-rotate(180deg) contrast(1.05)'
            : 'none';
        }
      }
    });

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function() {
        if (currentZoomPercent === 0) applyScaling();
      });
      ro.observe(document.documentElement);
    }

    window.addEventListener('resize', function() {
      if (currentZoomPercent === 0) applyScaling();
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', paginateAndRender);
    } else {
      setTimeout(paginateAndRender, 50);
    }
  </script>
</body>
</html>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
