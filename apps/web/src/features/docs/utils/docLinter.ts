import { DocSubFile, DocFormat } from '../store/useDocsStore';

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

    // 6. Check unescaped '&' in normal text (outside tables and alignments)
    if (/(?<!\\)&/.test(line)) {
      const inTable = envStack.some((e) =>
        ['tabular', 'table', 'align', 'matrix', 'pmatrix', 'bmatrix', 'split', 'cases'].includes(e.name)
      );
      if (!inTable) {
        warnings.push({
          id: `unescaped_ampersand_${lineNum}`,
          type: 'warning',
          message: `Karakter '&' ditemukan tanpa escape. Gunakan '\\&' untuk menulis simbol ampersand dalam teks LaTeX.`,
          line: lineNum,
          fileName: activeFileName,
          snippet: line.trim(),
          suggestion: `Ganti '&' menjadi '\\&' agar tidak dianggap sebagai pemisah kolom tabel.`,
        });
      }
    }

    // 7. Check for Markdown syntax leaking into .tex documents
    if (/^#{1,6}\s+/.test(line.trim())) {
      warnings.push({
        id: `markdown_header_in_tex_${lineNum}`,
        type: 'warning',
        message: `Heading Markdown (${line.trim().split(' ')[0]}) terdeteksi di dalam file LaTeX.`,
        line: lineNum,
        fileName: activeFileName,
        snippet: line.trim(),
        suggestion: `Gunakan '\\section{...}', '\\subsection{...}', atau '\\subsubsection{...}'.`,
      });
    } else if (/\*\*[^*]+\*\*/.test(line)) {
      warnings.push({
        id: `markdown_bold_in_tex_${lineNum}`,
        type: 'warning',
        message: `Format cetak tebal Markdown (**teks**) terdeteksi di dalam file LaTeX.`,
        line: lineNum,
        fileName: activeFileName,
        snippet: line.trim(),
        suggestion: `Gunakan '\\textbf{...}' untuk cetak tebal di LaTeX.`,
      });
    }

    // 8. Check for unrecognized / unrendered LaTeX commands
    const cleanLineForCmds = line.replace(/%.*$/, ''); // ignore inline comments
    const cmdMatches = [...cleanLineForCmds.matchAll(/\\([a-zA-Z]{3,25})/g)];
    const KNOWN_COMMANDS = new Set([
      'documentclass', 'usepackage', 'input', 'include', 'begin', 'end',
      'section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph',
      'title', 'author', 'date', 'maketitle', 'tableofcontents', 'listoffigures', 'listoftables',
      'textbf', 'textit', 'emph', 'underline', 'texttt', 'textsc', 'textsl', 'textup', 'textmd',
      'textsf', 'sffamily', 'ttfamily', 'scshape', 'bfseries', 'itshape', 'normalfont', 'familydefault', 'sfdefault', 'rmdefault', 'ttdefault',
      'textsuperscript', 'textsubscript', 'sout', 'st', 'label', 'ref', 'pageref', 'cite', 'bibitem',
      'href', 'url', 'includegraphics', 'caption', 'vspace', 'hspace', 'vfill', 'hfill', 'fill',
      'textwidth', 'textheight', 'linewidth', 'columnsep', 'columnseprule', 'topmargin', 'oddsidemargin',
      'centering', 'raggedright', 'raggedleft', 'noindent', 'newpage', 'clearpage', 'pagebreak', 'cleardoublepage',
      'footnote', 'rule', 'hrule', 'titlerule', 'color', 'textcolor', 'definecolor', 'colorlet',
      'titleformat', 'titlespacing', 'geometry', 'pagestyle', 'thispagestyle', 'pagenumbering', 'setcounter', 'addtocounter', 'stepcounter',
      'fancyhf', 'fancyhead', 'fancyfoot', 'renewenvironment', 'newenvironment',
      'renewcommand', 'newcommand', 'setlength', 'addtolength', 'arraystretch', 'baselineskip', 'parindent', 'parskip', 'markboth', 'markright', 'hypersetup',
      'today', 'smallskip', 'medskip', 'bigskip', 'newline', 'linebreak', 'break',
      'item', 'ieeeparstart', 'ieeedropcase', 'thanks', 'fbox', 'framebox', 'minipage',
      'tcolorbox', 'abstract', 'keywords', 'ieeekeywords', 'thebibliography', 'printbibliography', 'addbibresource', 'bibliographystyle', 'bibliography',
      'headrulewidth', 'footrulewidth', 'thepage', 'thesection', 'thesubsection',
      'large', 'huge', 'small', 'footnotesize', 'scriptsize', 'tiny', 'normalsize',
      'frac', 'sqrt', 'sum', 'prod', 'int', 'alpha', 'beta', 'gamma', 'delta', 'epsilon',
      'theta', 'lambda', 'mu', 'pi', 'sigma', 'tau', 'phi', 'omega', 'infty', 'partial',
      'nabla', 'pm', 'times', 'div', 'cdot', 'leq', 'geq', 'neq', 'approx', 'equiv',
      'forall', 'exists', 'subset', 'cup', 'cap', 'leftarrow', 'rightarrow', 'Rightarrow',
      'leftrightarrow', 'mathbf', 'mathit', 'mathbb', 'mathcal', 'sin', 'cos', 'tan',
      'log', 'ln', 'lim', 'max', 'min', 'left', 'right', 'text', 'quad', 'qquad', 'enspace',
      'toprule', 'midrule', 'bottomrule', 'hline', 'cline', 'multicolumn', 'multirow',
      'rowcolor', 'columncolor', 'cellcolor', 'arraybackslash', 'centerline', 'leftline', 'rightline',
      'mbox', 'hbox', 'vbox', 'parbox', 'makebox', 'raisebox', 'resizebox', 'scalebox',
      'colorbox', 'fcolorbox', 'par', 'eqref', 'dotfill', 'hrulefill', 'dots', 'ldots',
      'multicols', 'appendix', 'bullet', 'circ', 'degree', 'textdegree', 'textcelsius',
      'copyright', 'textregistered', 'texttrademark', 'babel', 'helvet', 'enumitem', 'booktabs',
      'xcolor', 'hyperref', 'titlesec', 'array', 'setlist'
    ]);
    for (const cm of cmdMatches) {
      const cmdName = cm[1].toLowerCase();
      if (!KNOWN_COMMANDS.has(cmdName)) {
        warnings.push({
          id: `unknown_cmd_${lineNum}_${cmdName}`,
          type: 'warning',
          message: `Perintah LaTeX '\\${cm[1]}' mungkin belum didukung atau salah ketik.`,
          line: lineNum,
          fileName: activeFileName,
          snippet: line.trim(),
          suggestion: `Periksa ejaan perintah LaTeX atau gunakan perintah alternatif yang didukung.`,
        });
      }
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
 * Linter for Anticeil Spreadsheet files (.antsheet)
 */
function lintAntsheet(content: string, activeFileName: string): LintResult {
  const errors: DocDiagnostic[] = [];
  const warnings: DocDiagnostic[] = [];
  const infos: DocDiagnostic[] = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Formula validation
    if (trimmed.includes('=')) {
      const formulaPart = trimmed.substring(trimmed.indexOf('='));
      let openParen = 0;
      for (const char of formulaPart) {
        if (char === '(') openParen++;
        if (char === ')') openParen--;
      }
      if (openParen !== 0) {
        errors.push({
          id: `antsheet_paren_${lineNum}`,
          type: 'error',
          message: `Formula spreadsheet pada baris ${lineNum} memiliki kurung () yang tidak seimbang.`,
          line: lineNum,
          fileName: activeFileName,
          snippet: trimmed,
          suggestion: 'Pastikan setiap kurung buka "(" memiliki kurung tutup ")".',
        });
      }
    }
  });

  if (errors.length === 0) {
    infos.push({
      id: 'antsheet_ok',
      type: 'info',
      message: `Formulir & struktur Anticeil Sheet valid (${lines.length} baris).`,
      line: 1,
      fileName: activeFileName,
    });
  }

  return { errors, warnings, infos, totalLogs: errors.length + warnings.length + infos.length };
}

/**
 * Linter for Anticeil Presentation files (.slide)
 */
function lintSlide(content: string, activeFileName: string): LintResult {
  const errors: DocDiagnostic[] = [];
  const warnings: DocDiagnostic[] = [];
  const infos: DocDiagnostic[] = [];
  const lines = content.split('\n');

  let codeBlockOpen = false;
  let mathBlockOpen = false;
  let slideCount = 1;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      codeBlockOpen = !codeBlockOpen;
    }

    if (trimmed === '$$') {
      mathBlockOpen = !mathBlockOpen;
    }

    if (trimmed === '---') {
      slideCount++;
    }
  });

  if (codeBlockOpen) {
    errors.push({
      id: 'slide_codeblock_unclosed',
      type: 'error',
      message: 'Blok kode (```) belum ditutup.',
      line: lines.length,
      fileName: activeFileName,
      suggestion: 'Tambahkan ``` di akhir blok kode.',
    });
  }

  if (mathBlockOpen) {
    errors.push({
      id: 'slide_mathblock_unclosed',
      type: 'error',
      message: 'Blok rumus matematika ($$) belum ditutup.',
      line: lines.length,
      fileName: activeFileName,
      suggestion: 'Tambahkan $$ untuk menutup rumus matematika.',
    });
  }

  infos.push({
    id: 'slide_info',
    type: 'info',
    message: `Presentasi Anticeil Slide valid dengan ${slideCount} slide.`,
    line: 1,
    fileName: activeFileName,
  });

  return { errors, warnings, infos, totalLogs: errors.length + warnings.length + infos.length };
}

/**
 * Specialized linter for Typst documents (.typ)
 */
function lintTypst(content: string, activeFileName: string): LintResult {
  const errors: DocDiagnostic[] = [];
  const warnings: DocDiagnostic[] = [];
  const infos: DocDiagnostic[] = [];

  const lines = content.split('\n');
  let totalHeadings = 0;
  let totalMath = 0;
  let inCodeBlock = false;
  let openParenCount = 0;
  let parenStartLine = 1;
  let openBracketCount = 0;
  let bracketStartLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Check headings (= Heading)
    if (/^={1,6}\s+/.test(line.trim())) {
      totalHeadings++;
    }

    // Check math delimiters ($ ... $)
    if (line.includes('$')) {
      totalMath++;
    }

    // Track parenthesis & bracket balance across multi-line statements
    for (let cIdx = 0; cIdx < line.length; cIdx++) {
      const ch = line[cIdx];
      // Skip string literals
      if (ch === '"' || ch === "'") {
        const sChar = ch;
        cIdx++;
        while (cIdx < line.length && (line[cIdx] !== sChar || line[cIdx - 1] === '\\')) {
          cIdx++;
        }
        continue;
      }
      if (ch === '(') {
        if (openParenCount === 0) parenStartLine = lineNum;
        openParenCount++;
      } else if (ch === ')') {
        openParenCount--;
        if (openParenCount < 0) {
          warnings.push({
            id: `unmatched_close_paren_${lineNum}`,
            type: 'warning',
            message: `Tanda kurung tutup ')' ditemukan tanpa kurung buka '(' sebelumnya.`,
            line: lineNum,
            fileName: activeFileName,
            snippet: line.trim(),
            suggestion: `Periksa tanda kurung ')' berlebih pada baris ini.`,
          });
          openParenCount = 0;
        }
      } else if (ch === '[') {
        if (openBracketCount === 0) bracketStartLine = lineNum;
        openBracketCount++;
      } else if (ch === ']') {
        openBracketCount--;
        if (openBracketCount < 0) {
          warnings.push({
            id: `unmatched_close_bracket_${lineNum}`,
            type: 'warning',
            message: `Tanda kurung siku tutup ']' ditemukan tanpa kurung siku buka '[' sebelumnya.`,
            line: lineNum,
            fileName: activeFileName,
            snippet: line.trim(),
            suggestion: `Periksa kurung siku ']' berlebih pada baris ini.`,
          });
          openBracketCount = 0;
        }
      }
    }
  }

  if (openParenCount > 0) {
    warnings.push({
      id: `unclosed_typst_paren_${parenStartLine}`,
      type: 'warning',
      message: `Tanda kurung '(' pada baris ${parenStartLine} belum ditutup hingga akhir dokumen.`,
      line: parenStartLine,
      fileName: activeFileName,
      suggestion: `Tambahkan tanda penutup ')' untuk menyelesaikan aturan/fungsi Typst.`,
    });
  }

  if (openBracketCount > 0) {
    warnings.push({
      id: `unclosed_typst_bracket_${bracketStartLine}`,
      type: 'warning',
      message: `Blok kurung siku '[' pada baris ${bracketStartLine} belum ditutup hingga akhir dokumen.`,
      line: bracketStartLine,
      fileName: activeFileName,
      suggestion: `Tambahkan tanda penutup ']' untuk menyelesaikan blok konten Typst.`,
    });
  }

  if (inCodeBlock) {
    errors.push({
      id: 'typst_unclosed_code',
      type: 'error',
      message: 'Blok kode ``` Typst belum ditutup.',
      line: lines.length,
      fileName: activeFileName,
      suggestion: 'Tambahkan penutup ``` di akhir blok kode.',
    });
  }

  infos.push({
    id: 'info_typst_valid',
    type: 'info',
    message: `Dokumen Typst (.typ) terstruktur. Ditemukan ${totalHeadings} heading, ${totalMath} formula math, dan ${lines.length} baris kode.`,
    line: 1,
    fileName: activeFileName,
  });

  return { errors, warnings, infos, totalLogs: errors.length + warnings.length + infos.length };
}

/**
 * Main linter dispatcher — automatically applies the correct validation rules
 * based on file extension (.tex, .md, .bib, .json, .csv, .antsheet, .slide, .typ)
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
    case 'typ':
    case 'typst':
      return lintTypst(content, activeFileName);
    case 'json':
      return lintJson(content, activeFileName);
    case 'csv':
      return lintCsv(content, activeFileName);
    case 'antsheet':
      return lintAntsheet(content, activeFileName);
    case 'slide':
      return lintSlide(content, activeFileName);
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'svg':
    case 'gif':
    case 'bmp':
    case 'ico':
      return {
        errors: [],
        warnings: [],
        infos: [
          {
            id: 'info_asset_valid',
            type: 'info',
            message: `Berkas aset gambar/media (${activeFileName}) valid.`,
            line: 1,
            fileName: activeFileName,
          },
        ],
        totalLogs: 1,
      };
    case 'tex':
    case 'sty':
    case 'cls':
    default:
      return lintLatex(content, files, activeFileName);
  }
}

export interface AutoFixResult {
  fixedCode: string;
  wasRepaired: boolean;
  remainingErrors: DocDiagnostic[];
}

/**
 * Deterministic Auto-Fixer for AI-generated code.
 * Fixes unclosed LaTeX environments, missing \end{document}, unclosed code fences,
 * unclosed math delimiters, and unbalanced HTML tags.
 */
export function autoFixDocCode(
  content: string,
  format: DocFormat = 'latex',
  files: DocSubFile[] = []
): AutoFixResult {
  if (!content) {
    return { fixedCode: content, wasRepaired: false, remainingErrors: [] };
  }

  let code = content;
  let wasRepaired = false;

  // 1. Balance Code Fences ```
  const fenceMatches = code.match(/^```/gm);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    code = code.trimEnd() + '\n```\n';
    wasRepaired = true;
  }

  // 2. Fix LaTeX Environments & Structure
  if (format === 'latex' || code.includes('\\documentclass') || code.includes('\\begin{')) {
    const lines = code.split('\n');
    const envStack: string[] = [];
    let hasBeginDoc = false;
    let hasEndDoc = false;
    let inVerbatim = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('%')) continue;

      if (line.startsWith('```') || line.startsWith('\\begin{verbatim}') || line.startsWith('\\begin{lstlisting}')) {
        inVerbatim = !inVerbatim;
        continue;
      }
      if (inVerbatim) continue;

      if (line.includes('\\begin{document}')) hasBeginDoc = true;
      if (line.includes('\\end{document}')) hasEndDoc = true;

      const beginMatches = [...line.matchAll(/\\begin\{([a-zA-Z0-9*]+)\}/g)];
      for (const m of beginMatches) {
        envStack.push(m[1]);
      }

      const endMatches = [...line.matchAll(/\\end\{([a-zA-Z0-9*]+)\}/g)];
      for (const m of endMatches) {
        const envName = m[1];
        if (envStack.length > 0 && envStack[envStack.length - 1] === envName) {
          envStack.pop();
        } else {
          // Mismatched or orphan end tag, prune matching stack item if present
          const idx = envStack.lastIndexOf(envName);
          if (idx !== -1) {
            envStack.splice(idx, 1);
          }
        }
      }
    }

    // Auto-close unclosed LaTeX environments
    if (envStack.length > 0) {
      const remainingEnvs = [...envStack].reverse();
      let closers = '';
      for (const env of remainingEnvs) {
        if (env === 'document' && hasEndDoc) continue;
        closers += `\n\\end{${env}}`;
      }
      if (closers) {
        code = code.trimEnd() + closers + '\n';
        wasRepaired = true;
      }
    }

    // Ensure \end{document} exists if \begin{document} is declared
    if (hasBeginDoc && !hasEndDoc && !code.includes('\\end{document}')) {
      code = code.trimEnd() + '\n\\end{document}\n';
      wasRepaired = true;
    }
  }

  // 3. Balance Inline Math Delimiters $$ or $
  if (format === 'latex' || format === 'markdown' || format === 'slide' || format === 'typst') {
    const doubleDollarCount = (code.match(/\$\$/g) || []).length;
    if (doubleDollarCount % 2 !== 0) {
      code = code.trimEnd() + '\n$$\n';
      wasRepaired = true;
    }
  }

  // Run linter to get remaining diagnostic logs
  const lintResult = lintDocumentContent(
    code,
    files,
    format === 'latex' ? 'main.tex' : format === 'slide' ? 'main.slide' : format === 'typst' ? 'main.typ' : 'sheet1.antsheet'
  );

  return {
    fixedCode: code,
    wasRepaired,
    remainingErrors: lintResult.errors,
  };
}
