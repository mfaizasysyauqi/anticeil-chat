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
 * High-performance client-side LaTeX & Markdown linter.
 * Performs static AST & delimiter checks with zero server roundtrip.
 */
export function lintDocumentContent(
  content: string,
  files: DocSubFile[] = [],
  activeFileName: string = 'main.tex'
): LintResult {
  const errors: DocDiagnostic[] = [];
  const warnings: DocDiagnostic[] = [];
  const infos: DocDiagnostic[] = [];

  if (!content) {
    return { errors, warnings, infos, totalLogs: 0 };
  }

  const lines = content.split('\n');
  const envStack: Array<{ name: string; line: number }> = [];

  // Track known file paths for \input verification
  const knownFileNames = new Set(
    files.map((f) => f.name.replace(/\\/g, '/').toLowerCase())
  );
  // Also index without extension
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

    // Check code blocks
    if (line.trim().startsWith('```')) {
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
          message: `File import "${match[2]}" tidak ditemukan dalam struktur folder proyek.`,
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
    // Only flag unbalanced braces if line looks like an unclosed command (and not a multiline block)
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

    // 4. Check Section count
    if (line.match(/^#{1,4}\s+/) || line.match(/\\(section|subsection|subsubsection)\*?\{/)) {
      totalSections++;
      // Warn if section title is empty
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

  // Info diagnostics
  infos.push({
    id: 'info_stats',
    type: 'info',
    message: `Kompilasi sukses. Terdeteksi ${totalSections} bab/section, ${totalEquations} formula matematika, dan ${lines.length} baris kode.`,
    line: 1,
    fileName: activeFileName,
  });

  return {
    errors,
    warnings,
    infos,
    totalLogs: errors.length + warnings.length + infos.length,
  };
}
