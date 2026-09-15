import { DocItem, DocSubFile } from '../store/useDocsStore';

/**
 * Builds a high-density, AST-like smart outline and content context for AI Co-Author.
 * Guarantees that large spreadsheets (100+ rows), large slide decks (20+ slides),
 * and multi-file LaTeX/Typst projects fit completely within prompt token budgets.
 */
export function buildSmartDocContext(
  doc: DocItem | null | undefined,
  activeSubFile?: DocSubFile | null
): string {
  if (!doc) return '';

  const format = doc.format || 'latex';
  const subFiles = doc.files || [];
  const activeFile = activeSubFile || subFiles.find((f) => f.id === doc.activeFileId) || subFiles[0];
  const activeContent = activeFile?.content || doc.content || '';

  const fileTree = subFiles.length > 0
    ? subFiles.map((f) => `- ${f.name} (${f.content.length} chars)`).join('\n')
    : `- Main document (${activeContent.length} chars)`;

  let formatSpecificSummary = '';

  // ── 1. ANTSHEET / SPREADSHEET SMART SUMMARY ───────────────────────────────
  if (format === 'sheet') {
    formatSpecificSummary = summarizeAntsheetWorkbook(activeContent);
  }
  // ── 2. SLIDE PRESENTATION SMART SUMMARY ───────────────────────────────────
  else if (format === 'slide') {
    formatSpecificSummary = summarizeSlideDeck(activeContent);
  }
  // ── 3. TYPST / LATEX / MARKDOWN SMART SUMMARY ─────────────────────────────
  else {
    formatSpecificSummary = summarizeDocumentStructure(activeContent, format, subFiles);
  }

  return `\n\nPROJECT FILES & ARCHITECTURE:
- Project Title: "${doc.title}"
- Format: ${format}
- Currently Open File: ${activeFile ? activeFile.name : 'Main Document'}
- File Tree:
${fileTree}

${formatSpecificSummary}
CURRENT FILE ACTIVE CONTENT:
\`\`\`
${activeContent.slice(0, 3500)}
\`\`\``;
}

/**
 * Parses and summarizes an AntSheet workbook into high-density metadata.
 */
function summarizeAntsheetWorkbook(content: string): string {
  if (!content) return '';
  const lines = content.split('\n');

  const sheets: string[] = [];
  const formulas: string[] = [];
  const charts: string[] = [];
  const validations: string[] = [];
  let metaLines: string[] = [];
  let cellCount = 0;
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') && trimmed.length > 2) {
      sheets.push(trimmed.slice(2).trim());
    } else if (trimmed.startsWith('## ')) {
      currentSection = trimmed.slice(3).toLowerCase();
    } else if (currentSection === 'meta' && trimmed && !trimmed.startsWith('#')) {
      metaLines.push(trimmed);
    } else if (currentSection === 'charts' && trimmed.includes('=')) {
      charts.push(trimmed);
    } else if (currentSection === 'datavalidation' && trimmed.includes('=')) {
      validations.push(trimmed);
    } else if (trimmed.includes('=')) {
      cellCount++;
      if (trimmed.includes('"=') || trimmed.includes("='") || /=\s*"?SUM|AVG|IF|VLOOKUP|COUNT/i.test(trimmed)) {
        if (formulas.length < 10) formulas.push(trimmed);
      }
    }
  }

  return `SPREADSHEET WORKBOOK INTELLIGENCE:
- Total Sheets: ${sheets.length || 1} (${sheets.join(', ') || 'Sheet1'})
- Total Data Cells: ~${cellCount}
${metaLines.length > 0 ? `- Grid Meta: ${metaLines.join(' | ')}\n` : ''}${charts.length > 0 ? `- Charts Configured: ${charts.join('; ')}\n` : ''}${formulas.length > 0 ? `- Key Formulas: ${formulas.join('; ')}\n` : ''}${validations.length > 0 ? `- Data Validation Rules: ${validations.join('; ')}\n` : ''}`;
}

/**
 * Parses and outlines a full Slide Presentation deck.
 */
function summarizeSlideDeck(content: string): string {
  if (!content) return '';
  const slideBlocks = content.split(/\n---\n/);
  const outline: string[] = [];

  slideBlocks.forEach((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return;
    const lines = trimmed.split('\n');

    let title = `Slide ${idx + 1}`;
    let layout = '';
    const bullets: string[] = [];

    for (const line of lines) {
      const l = line.trim();
      if (l.startsWith('# ') && title === `Slide ${idx + 1}`) {
        title = l.slice(2).trim();
      } else if (l.startsWith('<!--') && l.includes('layout:')) {
        layout = l.replace(/<!--\s*|\s*-->/g, '');
      } else if (l.startsWith('- ') || l.startsWith('* ')) {
        if (bullets.length < 3) bullets.push(l.slice(2).trim());
      }
    }

    outline.push(
      `  Slide ${idx + 1}: "${title}" ${layout ? `[${layout}]` : ''} ${
        bullets.length > 0 ? `→ (${bullets.join(', ')})` : ''
      }`
    );
  });

  return `SLIDE DECK OUTLINE (${slideBlocks.length} total slides):
${outline.join('\n')}\n`;
}

/**
 * Extracts headings, chapters, and sections tree from LaTeX / Typst / Markdown.
 */
function summarizeDocumentStructure(content: string, format: string, subFiles: DocSubFile[]): string {
  if (!content) return '';
  const lines = content.split('\n');
  const headings: string[] = [];
  const imports: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (format === 'latex') {
      const secMatch = trimmed.match(/\\(chapter|section|subsection)\*?\{([^}]+)\}/);
      if (secMatch && headings.length < 15) {
        headings.push(`${secMatch[1]}: "${secMatch[2]}"`);
      }
      const inputMatch = trimmed.match(/\\(input|include)\{([^}]+)\}/);
      if (inputMatch) {
        imports.push(inputMatch[2]);
      }
    } else if (format === 'typst') {
      const typMatch = trimmed.match(/^(=+)\s+(.+)$/);
      if (typMatch && headings.length < 15) {
        headings.push(`Level ${typMatch[1].length}: "${typMatch[2]}"`);
      }
    } else {
      const mdMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (mdMatch && headings.length < 15) {
        headings.push(`H${mdMatch[1].length}: "${mdMatch[2]}"`);
      }
    }
  }

  const otherFilesSummary = subFiles
    .filter((f) => f.content && f.name !== 'main.tex' && f.name !== 'main.typ')
    .slice(0, 4)
    .map((f) => `- ${f.name}: ${f.content.slice(0, 180).replace(/\n+/g, ' ')}...`)
    .join('\n');

  return `DOCUMENT OUTLINE & KEY SECTIONS:
- Headings: ${headings.join(' → ') || 'Root Document'}
${imports.length > 0 ? `- Modular Imports: ${imports.join(', ')}\n` : ''}${otherFilesSummary ? `\nModule Excerpts:\n${otherFilesSummary}\n` : ''}`;
}
