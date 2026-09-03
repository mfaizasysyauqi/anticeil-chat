import { DocSubFile } from '../store/useDocsStore';

export interface DocDiagnostic {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  line: number; // 1-indexed
  column?: number;
  fileName?: string;
  fileId?: string;
  snippet?: string;
  suggestion?: string;
}

export interface LintResult {
  errors: DocDiagnostic[];
  warnings: DocDiagnostic[];
  infos: DocDiagnostic[];
  totalLogs: number;
}

/**
 * Specialized linter for LaTeX documents (.tex, .sty, .cls)
 */
function lintLatex(content: string, files: DocSubFile[], activeFileName: string): LintResult {
  const errors: DocDiagnostic[] = [];
  const warnings: DocDiagnostic[] = [];
  const infos: DocDiagnostic[] = [];

  const lines = content.split('\n');
  const envStack: Array<{ name: string; line: number }> = [];

  // Track known file paths for \input verification
  const knownFileNames = new Set(
    files.map((f) => f.name.replace(/\\/g, '/').toLowerCase())
  );
  for (const f of files) {
    const clean = f.name.replace(/\\/g, '/').toLowerCase();
    const withoutExt = clean.replace(/\.[^/.]+$/, '');
    knownFileNames.add(withoutExt);
    const parts = clean.split('/');
    const baseName = parts[parts.length - 1];
    knownFileNames.add(baseName);
    knownFileNames.add(baseName.replace(/\.[^/.]+$/, ''));
  }

  let totalEquations = 0;
  let totalSections = 0;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // Check verbatim / code blocks
    if (line.trim().startsWith('```') || line.trim().startsWith('\\begin{verbatim}') || line.trim().startsWith('\\begin{lstlisting}')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // 1. Check Unmatched \begin{env} and \end{env}
    const beginMatches = [...line.matchAll(/\\begin\{([a-zA-Z0-9*]+)\}/g)];
    for (const match of beginMatches) {
      const envName = match[1];
      envStack.push({ name: envName, line: lineNum });
      if (['equation', 'align', 'gather', 'matrix', 'pmatrix', 'bmatrix'].includes(envName)) {
        totalEquations++;
      }
    }

    const endMatches = [...line.matchAll(/\\end\{([a-zA-Z0-9*]+)\}/g)];
    for (const match of endMatches) {
      const envName = match[1];
      if (envStack.length === 0) {
        errors.push({
          id: `unmatched_end_${lineNum}_${envName}`,
          type: 'error',
          message: `\\end{${envName}} ditemukan tanpa \\begin{${envName}} sebelumnya.`,
          line: lineNum,
          fileName: activeFileName,
          snippet: line.trim(),
          suggestion: `Hapus \\end{${envName}} atau tambahkan \\begin{${envName}} di atas.`,
        });
      } else {
        const last = envStack.pop()!;
        if (last.name !== envName) {
          errors.push({
            id: `mismatched_env_${lineNum}`,
            type: 'error',
            message: `Environment tidak cocok: dibuka dengan \\begin{${last.name}} (baris ${last.line}), tapi ditutup dengan \\end{${envName}}.`,
            line: lineNum,
            fileName: activeFileName,
            snippet: line.trim(),
            suggestion: `Ganti menjadi \\end{${last.name}} agar sesuai dengan pembukanya.`,
          });
        }
      }
    }

    // 2. Check Unresolved \input{...} or \include{...}
    const inputMatches = [...line.matchAll(/\\(input|include)\{([^}]+)\}/g)];
    for (const match of inputMatches) {
      const importPath = match[2].trim().replace(/\\/g, '/').toLowerCase();
      if (files.length > 0 && !knownFileNames.has(importPath)) {
        warnings.push({
          id: `missing_import_${lineNum}`,
          type: 'warning',
          message: `File import "${match[2]}" tidak ditemukan dalam struktur file proyek.`,
          line: lineNum,
          fileName: activeFileName,
          snippet: line.trim(),
          suggestion: `Pastikan nama file dan foldernya cocok di Struktur File.`,
        });
      }
    }

    // 3. Check Braces Balance in LaTeX Commands
    let openBraces = 0;
    let inEscaped = false;
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '\\') {
        inEscaped = true;
        continue;
      }
      if (!inEscaped) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
      }
      inEscaped = false;
    }
    if (openBraces > 0 && (line.includes('\\frac{') || line.includes('\\textbf{') || line.includes('\\textit{') || line.includes('\\section{'))) {
      if (!lines[i + 1]?.includes('}')) {
        warnings.push({
          id: `unclosed_brace_${lineNum}`,
          type: 'warning',
          message: `Kemungkinan kurung kurawal '{' belum ditutup pada baris ini.`,
          line: lineNum,
          fileName: activeFileName,
          snippet: line.trim(),
          suggestion: `Periksa penutup kurung '}' untuk perintah LaTeX.`,
        });
      }
    }

    // 4. Check Section count & empty sections
    if (line.match(/^#{1,4}\s+/) || line.match(/\\(section|subsection|subsubsection)\*?\{/)) {
      totalSections++;
      if (line.match(/\\(section|subsection)\*?\{\s*\}/) || line.trim() === '#' || line.trim() === '##') {
        warnings.push({
          id: `empty_section_${lineNum}`,
          type: 'warning',
          message: `Judul bab/section kosong.`,
          line: lineNum,
          fileName: activeFileName,
          snippet: line.trim(),
          suggestion: `Tambahkan judul pada bagian ini.`,
        });
      }
    }

    // 5. Check Math Syntax
    if (line.includes('$$') || line.includes('$')) {
      totalEquations++;
    }
  }

  // Check any remaining unclosed environments
  while (envStack.length > 0) {
    const unclosed = envStack.pop()!;
    errors.push({
      id: `unclosed_begin_${unclosed.line}`,
      type: 'error',
      message: `\\begin{${unclosed.name}} di baris ${unclosed.line} belum ditutup sampai akhir dokumen.`,
      line: unclosed.line,
      fileName: activeFileName,
      suggestion: `Tambahkan \\end{${unclosed.name}} di akhir bagian ini.`,
    });
  }

  infos.push({
    id: 'info_stats_latex',
    type: 'info',
    message: `Kompilasi LaTeX sukses. Terdeteksi ${totalSections} bab/section, ${totalEquations} formula matematika, dan ${lines.length} baris kode.`,
    line: 1,
    fileName: activeFileName,
  });

  return { errors, warnings, infos, totalLogs: errors.length + warnings.length + infos.length };
}

/**
 * Specialized linter for Markdown documents (.md, .markdown)
 */
function lintMarkdown(content: string, activeFileName: string): LintResult {
  const errors: DocDiagnostic[] = [];
  const warnings: DocDiagnostic[] = [];
  const infos: DocDiagnostic[] = [];

  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockStartLine = 0;
  let totalHeaders = 0;
  let totalLinks = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // 1. Code block toggles
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockStartLine = lineNum;
      } else {
        inCodeBlock = false;
      }
      continue;
    }
    if (inCodeBlock) continue;

    // 2. Empty Header check
    if (/^#{1,6}\s*$/.test(line.trim())) {
      warnings.push({
        id: `empty_md_header_${lineNum}`,
        type: 'warning',
        message: `Heading Markdown kosong tanpa teks judul.`,
        line: lineNum,
        fileName: activeFileName,
        snippet: line.trim(),
        suggestion: `Tambahkan judul setelah tanda '#' atau hapus baris ini.`,
      });
    } else if (/^#{1,6}\s+/.test(line)) {
      totalHeaders++;
    }

    // 3. Broken link format: [text]()
    const emptyLinkMatches = [...line.matchAll(/\[([^\]]+)\]\(\s*\)/g)];
    for (const match of emptyLinkMatches) {
      warnings.push({
        id: `empty_md_link_${lineNum}`,
        type: 'warning',
        message: `Link "${match[1]}" tidak memiliki URL tujuan (tanda kurung kosong).`,
        line: lineNum,
        fileName: activeFileName,
        snippet: line.trim(),
        suggestion: `Isi URL tujuan di dalam tanda kurung () atau hapus format link.`,
      });
    }

    // 4. Broken image format: ![]() with no URL
    const emptyImgMatches = [...line.matchAll(/!\[([^\]]*)\]\(\s*\)/g)];
    for (const _ of emptyImgMatches) {
      warnings.push({
        id: `empty_md_image_${lineNum}`,
        type: 'warning',
        message: `Tag gambar Markdown memiliki URL sumber kosong.`,
        line: lineNum,
        fileName: activeFileName,
        snippet: line.trim(),
        suggestion: `Masukkan path/URL gambar di dalam kurung ().`,
      });
    }

    // Count links
    const linkMatches = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (linkMatches) totalLinks += linkMatches.length;
  }

  // Check unclosed code fence
  if (inCodeBlock) {
    errors.push({
      id: `unclosed_md_code_block_${codeBlockStartLine}`,
      type: 'error',
      message: `Code block Markdown yang dibuka pada baris ${codeBlockStartLine} belum ditutup dengan '\`\`\`'.`,
      line: codeBlockStartLine,
      fileName: activeFileName,
      suggestion: `Tambahkan penutup \`\`\` di akhir blok kode.`,
    });
  }

  infos.push({
    id: 'info_stats_md',
    type: 'info',
    message: `Analisis Markdown selesai. Ditemukan ${totalHeaders} heading, ${totalLinks} tautan, dan ${lines.length} baris teks.`,
    line: 1,
    fileName: activeFileName,
  });

  return { errors, warnings, infos, totalLogs: errors.length + warnings.length + infos.length };
}

/**
 * Specialized linter for BibTeX bibliography (.bib)
 */
function lintBibtex(content: string, activeFileName: string): LintResult {
  const errors: DocDiagnostic[] = [];
  const warnings: DocDiagnostic[] = [];
  const infos: DocDiagnostic[] = [];

  const lines = content.split('\n');
  let currentEntryType: string | null = null;
  let currentEntryLine = 0;
  let currentEntryKey: string | null = null;
  let entryBraceDepth = 0;
  let hasTitle = false;
  let hasAuthorOrEditor = false;
  let totalEntries = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();

    // Skip empty lines & comments
    if (!line || line.startsWith('%')) continue;

    // Detect BibTeX entry start: @article{key, @book{key, etc.
    const entryStartMatch = line.match(/^@([a-zA-Z]+)\s*\{\s*([^,]*),?/);
    if (entryStartMatch && !currentEntryType) {
      currentEntryType = entryStartMatch[1].toLowerCase();
      currentEntryLine = lineNum;
      currentEntryKey = entryStartMatch[2].trim();
      entryBraceDepth = 1;
      hasTitle = false;
      hasAuthorOrEditor = false;
      totalEntries++;

      if (!currentEntryKey) {
        warnings.push({
          id: `missing_bib_key_${lineNum}`,
          type: 'warning',
          message: `Entri BibTeX @${currentEntryType} tidak memiliki citation key unik.`,
          line: lineNum,
          fileName: activeFileName,
          snippet: line,
          suggestion: `Tambahkan citation key setelah tanda '{', misalnya: @${currentEntryType}{vaswani2017attention,`,
        });
      }
      continue;
    }

    if (currentEntryType) {
      // Count braces
      for (const char of line) {
        if (char === '{') entryBraceDepth++;
        if (char === '}') entryBraceDepth--;
      }

      // Check required fields
      if (/^\s*title\s*=/i.test(line)) hasTitle = true;
      if (/^\s*(author|editor)\s*=/i.test(line)) hasAuthorOrEditor = true;

      // Entry closed
      if (entryBraceDepth <= 0) {
        const standardTypes = ['article', 'book', 'inproceedings', 'conference', 'phdthesis', 'techreport'];
        if (standardTypes.includes(currentEntryType)) {
          if (!hasTitle) {
            warnings.push({
              id: `missing_title_${currentEntryLine}`,
              type: 'warning',
              message: `Entri BibTeX @${currentEntryType} (${currentEntryKey || 'unnamed'}) tidak memiliki field 'title'.`,
              line: currentEntryLine,
              fileName: activeFileName,
              suggestion: `Tambahkan: title = {Judul Publikasi},`,
            });
          }
          if (!hasAuthorOrEditor) {
            warnings.push({
              id: `missing_author_${currentEntryLine}`,
              type: 'warning',
              message: `Entri BibTeX @${currentEntryType} (${currentEntryKey || 'unnamed'}) tidak memiliki field 'author'.`,
              line: currentEntryLine,
              fileName: activeFileName,
              suggestion: `Tambahkan: author = {Nama Penulis},`,
            });
          }
        }
        currentEntryType = null;
        currentEntryKey = null;
        entryBraceDepth = 0;
      }
    }
  }

  // Check unclosed entry at EOF
  if (currentEntryType && entryBraceDepth > 0) {
    errors.push({
      id: `unclosed_bib_entry_${currentEntryLine}`,
      type: 'error',
      message: `Entri BibTeX @${currentEntryType} di baris ${currentEntryLine} belum ditutup sampai akhir file.`,
      line: currentEntryLine,
      fileName: activeFileName,
      suggestion: `Tambahkan tanda penutup '}' di akhir entri.`,
    });
  }

  infos.push({
    id: 'info_stats_bib',
    type: 'info',
    message: `Format BibTeX valid. Berhasil memuat ${totalEntries} entri referensi pustaka.`,
    line: 1,
    fileName: activeFileName,
  });

  return { errors, warnings, infos, totalLogs: errors.length + warnings.length + infos.length };
}

/**
 * Specialized linter for JSON (.json)
 */
function lintJson(content: string, activeFileName: string): LintResult {
  const errors: DocDiagnostic[] = [];
  const warnings: DocDiagnostic[] = [];
  const infos: DocDiagnostic[] = [];

  try {
    const parsed = JSON.parse(content);
    const keyCount = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
    infos.push({
      id: 'info_json_valid',
      type: 'info',
      message: `JSON valid. Berisi ${keyCount} root properties.`,
      line: 1,
      fileName: activeFileName,
    });
  } catch (err: any) {
    const msg = err?.message || 'Syntax Error';
    // Try to extract line number from JSON parse error if available
    const lineMatch = msg.match(/line (\d+)/i) || msg.match(/position (\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;

    errors.push({
      id: `json_syntax_error`,
      type: 'error',
      message: `Sintaks JSON tidak valid: ${msg}`,
      line,
      fileName: activeFileName,
      suggestion: `Periksa tanda koma berlebih, tanda kutip ganda, atau kurung kurawal yang belum tertutup.`,
    });
  }

  return { errors, warnings, infos, totalLogs: errors.length + warnings.length + infos.length };
}

/**
 * Specialized linter for CSV (.csv)
 */
function lintCsv(content: string, activeFileName: string): LintResult {
  const errors: DocDiagnostic[] = [];
  const warnings: DocDiagnostic[] = [];
  const infos: DocDiagnostic[] = [];

  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length > 0) {
    const headerCols = lines[0].split(',').length;
    for (let i = 1; i < lines.length; i++) {
      const rowCols = lines[i].split(',').length;
      if (rowCols !== headerCols) {
        warnings.push({
          id: `csv_col_mismatch_${i + 1}`,
          type: 'warning',
          message: `Jumlah kolom pada baris ${i + 1} (${rowCols}) tidak sama dengan header (${headerCols}).`,
          line: i + 1,
          fileName: activeFileName,
          suggestion: `Sesuaikan jumlah pemisah koma agar konsisten dengan header.`,
        });
      }
    }

    infos.push({
      id: 'info_csv_valid',
      type: 'info',
      message: `CSV terstruktur: ${lines.length} baris data dengan ${headerCols} kolom.`,
      line: 1,
      fileName: activeFileName,
    });
  }

  return { errors, warnings, infos, totalLogs: errors.length + warnings.length + infos.length };
}

/**
 * Main linter dispatcher — automatically applies the correct validation rules
 * based on file extension (.tex, .md, .bib, .json, .csv, etc.)
 */
export function lintDocumentContent(
  content: string,
  files: DocSubFile[] = [],
  activeFileName: string = 'main.tex'
): LintResult {
  if (!content || !content.trim()) {
    return {
      errors: [],
      warnings: [],
      infos: [
        {
          id: 'info_empty',
          type: 'info',
          message: `File kosong (${activeFileName}).`,
          line: 1,
          fileName: activeFileName,
        },
      ],
      totalLogs: 1,
    };
  }

  const ext = activeFileName.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'bib':
      return lintBibtex(content, activeFileName);
    case 'md':
    case 'markdown':
      return lintMarkdown(content, activeFileName);
    case 'json':
      return lintJson(content, activeFileName);
    case 'csv':
      return lintCsv(content, activeFileName);
    case 'tex':
    case 'sty':
    case 'cls':
    default:
      return lintLatex(content, files, activeFileName);
  }
}
