export interface TypstDiagnostic {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  fileName?: string;
  snippet?: string;
  suggestion?: string;
}

export interface TypstCompileResult {
  html: string;
  diagnostics: TypstDiagnostic[];
}

/**
 * High-fidelity Typst AST/Markup Compiler & Diagnostic Engine
 * Converts Typst markup into structured academic HTML pages and emits Errors, Warnings, and Info logs.
 */
export function compileTypstToHtml(
  source: string,
  docTitle: string = 'Untitled Document',
  subFiles: Array<{ name: string; content: string }> = []
): TypstCompileResult {
  const diagnostics: TypstDiagnostic[] = [];

  if (!source || !source.trim()) {
    diagnostics.push({
      id: 'typst_empty',
      type: 'info',
      message: 'Dokumen Typst kosong. Masukkan kode Typst untuk memulai kompilasi.',
      line: 1,
      fileName: 'main.typ',
    });
    return { html: '<div class="typst-page-empty">Dokumen Typst Kosong</div>', diagnostics };
  }

  // 1. Resolve #include "file.typ" recursively
  const includedFileNames = new Set<string>();
  const resolveIncludes = (code: string, currentFileName: string = 'main.typ', depth: number = 0): string => {
    if (depth > 10) {
      diagnostics.push({
        id: `typst_recursion_limit_${depth}`,
        type: 'error',
        message: `Kelebihan batas rekursi #include pada file ${currentFileName}.`,
        line: 1,
        fileName: currentFileName,
      });
      return code;
    }

    const includeRegex = /#include\s+["']([^"']+)["']/g;
    return code.replace(includeRegex, (match, relPath, offset) => {
      const lineNum = code.substring(0, offset).split('\n').length;
      const targetName = relPath.replace(/^\.\//, '');
      const sub = subFiles.find((f) => f.name === targetName || f.name.endsWith('/' + targetName));

      if (!sub) {
        diagnostics.push({
          id: `typst_missing_include_${lineNum}_${targetName}`,
          type: 'error',
          message: `File import '${targetName}' tidak ditemukan di workspace project.`,
          line: lineNum,
          fileName: currentFileName,
          snippet: match,
          suggestion: `Pastikan file '${targetName}' sudah dibuat pada panel struktur file sebelah kiri.`,
        });
        return `<div style="padding: 10px; border: 1px dashed #ef4444; color: #ef4444; border-radius: 4px; margin: 8px 0; font-family: monospace; font-size: 12px;">⚠️ <strong>Typst Compiler Error:</strong> #include "${targetName}" tidak ditemukan.</div>`;
      }

      includedFileNames.add(targetName);
      diagnostics.push({
        id: `typst_included_${targetName}`,
        type: 'info',
        message: `Modul '${targetName}' berhasil di-include ke dalam dokumen utama.`,
        line: lineNum,
        fileName: currentFileName,
      });

      return `\n// --- Start Included: ${targetName} ---\n` + resolveIncludes(sub.content, targetName, depth + 1) + `\n// --- End Included: ${targetName} ---\n`;
    });
  };

  const resolvedCode = resolveIncludes(source);

  // 2. Linter & Diagnostic Checks
  const lines = resolvedCode.split('\n');
  let openParenCount = 0;
  let openBracketCount = 0;
  let totalHeadings = 0;
  let totalBlocks = 0;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (trimmed.startsWith('=')) totalHeadings++;
    if (trimmed.includes('#block') || trimmed.includes('block(')) totalBlocks++;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '(') openParenCount++;
      else if (ch === ')') openParenCount--;
      else if (ch === '[') openBracketCount++;
      else if (ch === ']') openBracketCount--;
    }

    const emptyVMatch = line.match(/#v\(\s*\)/);
    if (emptyVMatch) {
      diagnostics.push({
        id: `typst_empty_v_${lineNum}`,
        type: 'warning',
        message: `Fungsi Spasi Vertikal '#v()' di baris ${lineNum} memerlukan argumen ukuran (misal: #v(10pt) atau #v(1em)).`,
        line: lineNum,
        fileName: 'main.typ',
        snippet: line.trim(),
        suggestion: 'Tambahkan ukuran piksel/pt, misal #v(12pt).',
      });
    }
  });

  if (openParenCount !== 0) {
    diagnostics.push({
      id: 'typst_unmatched_paren',
      type: 'error',
      message: `Terdapat ${Math.abs(openParenCount)} tanda kurung '(' yang tidak sejajar/belum ditutup di dalam kode Typst.`,
      line: lines.length,
      fileName: 'main.typ',
      suggestion: "Periksa penutup ')' pada fungsi-fungsi #set, #block, atau #align.",
    });
  }

  if (openBracketCount !== 0) {
    diagnostics.push({
      id: 'typst_unmatched_bracket',
      type: 'error',
      message: `Terdapat ${Math.abs(openBracketCount)} kurung siku '[' yang tidak sejajar/belum ditutup di dalam konten Typst.`,
      line: lines.length,
      fileName: 'main.typ',
      suggestion: "Periksa penutup ']' pada blok konten Typst.",
    });
  }

  const errorCount = diagnostics.filter((d) => d.type === 'error').length;
  const warningCount = diagnostics.filter((d) => d.type === 'warning').length;

  if (errorCount === 0) {
    diagnostics.push({
      id: 'typst_success_summary',
      type: 'info',
      message: `Kompilasi Typst Berhasil (${lines.length} baris, ${totalHeadings} heading, ${totalBlocks} blok container, ${includedFileNames.size} file modul di-include).`,
      line: 1,
      fileName: 'main.typ',
    });
  } else {
    diagnostics.push({
      id: 'typst_error_summary',
      type: 'info',
      message: `Kompilasi Typst selesai dengan ${errorCount} Error dan ${warningCount} Peringatan.`,
      line: 1,
      fileName: 'main.typ',
    });
  }

  // 3. Compile Typst AST into rich HTML output
  const html = parseAndRenderTypst(resolvedCode, subFiles);

  return { html, diagnostics };
}

/**
 * Extracts a balanced group matching openChar and closeChar (handling nested quotes & nesting)
 */
function extractBalancedGroup(
  str: string,
  startPos: number,
  openChar: string,
  closeChar: string
): { content: string; endPos: number } | null {
  if (startPos < 0 || startPos >= str.length || str[startPos] !== openChar) return null;
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = startPos; i < str.length; i++) {
    const ch = str[i];
    const prev = i > startPos ? str[i - 1] : '';

    if (inString) {
      if (ch === stringChar && prev !== '\\') {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === openChar) {
      depth++;
    } else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return {
          content: str.substring(startPos + 1, i),
          endPos: i,
        };
      }
    }
  }

  return null;
}

/**
 * Helper to extract named parameter values (like header: ..., footer: ..., fill: ..., stroke: ...)
 * considering nested parens, brackets, and quotes.
 */
function extractParamValue(argsStr: string, paramName: string): string | null {
  const regex = new RegExp(`(?:^|,|\\s)${paramName}:\\s*`);
  const match = argsStr.match(regex);
  if (!match || match.index === undefined) return null;

  const valStart = match.index + match[0].length;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = valStart; i < argsStr.length; i++) {
    const ch = argsStr[i];
    const prev = i > valStart ? argsStr[i - 1] : '';

    if (inString) {
      if (ch === stringChar && prev !== '\\') inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === '(') parenDepth++;
    else if (ch === ')') {
      if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
        return argsStr.substring(valStart, i).trim();
      }
      if (parenDepth > 0) parenDepth--;
    } else if (ch === '[') bracketDepth++;
    else if (ch === ']') {
      if (bracketDepth > 0) bracketDepth--;
    } else if (ch === '{') braceDepth++;
    else if (ch === '}') {
      if (braceDepth > 0) braceDepth--;
    } else if (ch === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return argsStr.substring(valStart, i).trim();
    }
  }

  return argsStr.substring(valStart).trim();
}

/**
 * Resolves Typst 0.11+ dynamic #context { ... } expressions, counters (counter(page)), and locate() blocks.
 */
function resolveTypstContextExpr(rawExpr: string): string {
  let expr = rawExpr.trim();

  // If wrapped in context { ... } or #context { ... }
  if (/^(?:#\s*)?context\s*\{/.test(expr)) {
    const startIdx = expr.indexOf('{');
    const matched = extractBalancedGroup(expr, startIdx, '{', '}');
    if (matched) {
      let inner = matched.content;
      // Replace counter(page)...
      inner = inner.replace(/counter\s*\(\s*page\s*\)\s*\.(?:get|final)\s*\(\s*\)\s*\.first\s*\(\s*\)/g, '1');
      inner = inner.replace(/counter\s*\(\s*page\s*\)\s*\.display\s*\([^)]*\)/g, '1');
      inner = inner.replace(/counter\s*\(\s*page\s*\)/g, '1');

      // Strip let declarations and track variable values
      const varMap: Record<string, string> = { page_number: '1', total_pages: '1', page: '1' };
      const letMatches = inner.matchAll(/let\s+([a-zA-Z0-9_-]+)\s*=\s*([^;\n]+)/g);
      for (const m of letMatches) {
        varMap[m[1].trim()] = '1';
      }

      // Remove let lines
      inner = inner.replace(/let\s+[a-zA-Z0-9_-]+\s*=\s*[^;\n]+[;\n]?/g, '').trim();

      // Replace variable usages
      for (const [k, v] of Object.entries(varMap)) {
        inner = inner.replace(new RegExp(`(?:#)?\\b${k}\\b`, 'g'), v);
      }

      // If there's an align(...) or [ ... ] or direct content
      const contentBlockMatch = inner.match(/\[([\s\S]*?)\]/);
      if (contentBlockMatch && !inner.startsWith('align') && !inner.startsWith('#align') && !inner.startsWith('block') && !inner.startsWith('#block')) {
        inner = contentBlockMatch[1];
      }

      expr = inner.trim();
    }
  } else if (/^(?:#\s*)?context\s*\[/.test(expr)) {
    const startIdx = expr.indexOf('[');
    const matched = extractBalancedGroup(expr, startIdx, '[', ']');
    if (matched) {
      expr = matched.content;
    }
  } else if (/^(?:#\s*)?locate\s*\(/.test(expr)) {
    const bracketMatch = expr.match(/\[([\s\S]*?)\]/);
    if (bracketMatch) {
      expr = bracketMatch[1];
    }
  }

  // Replace counters and variables
  expr = expr.replace(/counter\s*\(\s*page\s*\)\s*\.(?:get|final)\s*\(\s*\)\s*\.first\s*\(\s*\)/g, '1');
  expr = expr.replace(/counter\s*\(\s*page\s*\)\s*\.display\s*\([^)]*\)/g, '1');
  expr = expr.replace(/#?counter\s*\(\s*page\s*\)/g, '1');
  expr = expr.replace(/#page_number\b/g, '1');
  expr = expr.replace(/#total_pages\b/g, '1');
  expr = expr.replace(/^(?:#\s*)?context\s+/g, '');

  return expr.trim();
}

/**
 * Parses color strings like rgb("#2d6a4f"), rgb(45, 106, 79), "#2d6a4f", or "green"
 */
function parseTypstColor(colorStr: string): string {
  if (!colorStr) return '#1e293b';
  const clean = colorStr.trim();

  const rgbMatch = clean.match(/rgb\(\s*["']?([^"'\s)]+)["']?\s*\)/i);
  if (rgbMatch) {
    const val = rgbMatch[1];
    return val.startsWith('#') ? val : `#${val}`;
  }

  const rgb3Match = clean.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgb3Match) {
    return `rgb(${rgb3Match[1]}, ${rgb3Match[2]}, ${rgb3Match[3]})`;
  }

  const hexMatch = clean.match(/["']?#?([a-fA-F0-9]{3,8})["']?/);
  if (hexMatch) {
    return `#${hexMatch[1]}`;
  }

  return clean.replace(/["']/g, '');
}

/**
 * Automatically computes high-contrast text color (#ffffff vs #0f172a) based on background luminance
 */
export function getContrastTextColor(bgColor: string): string {
  if (!bgColor) return '#0f172a';
  const clean = bgColor.trim().toLowerCase();
  if (clean === 'transparent' || clean === 'none') return '#0f172a';

  let r = 0, g = 0, b = 0;
  const hexMatch = clean.match(/^#?([a-f0-9]{6})$/i);
  if (hexMatch) {
    const val = parseInt(hexMatch[1], 16);
    r = (val >> 16) & 255;
    g = (val >> 8) & 255;
    b = val & 255;
  } else {
    const hex3Match = clean.match(/^#?([a-f0-9]{3})$/i);
    if (hex3Match) {
      const hex = hex3Match[1];
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      const rgbMatch = clean.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
      if (rgbMatch) {
        r = parseInt(rgbMatch[1], 10);
        g = parseInt(rgbMatch[2], 10);
        b = parseInt(rgbMatch[3], 10);
      } else {
        if (['black', 'navy', 'darkgreen', 'darkblue', 'maroon', 'purple', 'teal'].includes(clean)) return '#ffffff';
        return '#0f172a';
      }
    }
  }

  // Calculate relative perceived luminance (YIQ equation)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 145 ? '#ffffff' : '#0f172a';
}

/**
 * Main Typst Parser and HTML Renderer
 */
function parseAndRenderTypst(rawCode: string, subFiles: Array<{ name: string; content: string }> = []): string {
  let code = rawCode;

  // 1. Remove comments
  code = code.replace(/\/\/.*/g, '');
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');

  let headerHtml = '';
  let footerHtml = '';
  let globalFont = "'Inter', system-ui, sans-serif";
  let globalFontSize = '11pt';
  let globalTextColor = '#1e293b';
  let globalLeading = '1.65';

  // 2. Extract and strip #set page(...) commands with balanced matching
  let setPageIdx = code.search(/(?:#\s*)?set\s+page\s*\(/);
  while (setPageIdx !== -1) {
    const parenStart = code.indexOf('(', setPageIdx);
    const matched = extractBalancedGroup(code, parenStart, '(', ')');
    if (matched) {
      const pageArgs = matched.content;
      code = code.substring(0, setPageIdx) + code.substring(matched.endPos + 1);

      // Extract header: ...
      const headerVal = extractParamValue(pageArgs, 'header');
      if (headerVal) {
        let cleanHeader = resolveTypstContextExpr(headerVal);
        if (cleanHeader.startsWith('[') && cleanHeader.endsWith(']')) {
          const matchedGroup = extractBalancedGroup(cleanHeader, 0, '[', ']');
          if (matchedGroup && matchedGroup.endPos === cleanHeader.length - 1) {
            cleanHeader = matchedGroup.content;
          }
        }
        headerHtml = parseTypstBodyFunctions(cleanHeader, subFiles);
      }

      // Extract footer: ...
      const footerVal = extractParamValue(pageArgs, 'footer');
      if (footerVal) {
        let cleanFooter = resolveTypstContextExpr(footerVal);
        if (cleanFooter.startsWith('[') && cleanFooter.endsWith(']')) {
          const matchedGroup = extractBalancedGroup(cleanFooter, 0, '[', ']');
          if (matchedGroup && matchedGroup.endPos === cleanFooter.length - 1) {
            cleanFooter = matchedGroup.content;
          }
        }
        footerHtml = parseTypstBodyFunctions(cleanFooter, subFiles);
      }
    } else {
      break;
    }
    setPageIdx = code.search(/(?:#\s*)?set\s+page\s*\(/);
  }

  // 3. Extract and strip #set text(...) commands
  let setTextIdx = code.search(/(?:#\s*)?set\s+text\s*\(/);
  while (setTextIdx !== -1) {
    const parenStart = code.indexOf('(', setTextIdx);
    const matched = extractBalancedGroup(code, parenStart, '(', ')');
    if (matched) {
      const textArgs = matched.content;
      code = code.substring(0, setTextIdx) + code.substring(matched.endPos + 1);

      const fontM = textArgs.match(/font:\s*["']([^"']+)["']/);
      if (fontM) globalFont = `"${fontM[1]}", 'Inter', system-ui, sans-serif`;

      const sizeM = textArgs.match(/size:\s*([\d.]+\w+)/);
      if (sizeM) globalFontSize = sizeM[1];

      const fillVal = extractParamValue(textArgs, 'fill');
      if (fillVal) globalTextColor = parseTypstColor(fillVal);
    } else {
      break;
    }
    setTextIdx = code.search(/(?:#\s*)?set\s+text\s*\(/);
  }

  // 4. Extract and strip #set par(...) commands
  let setParIdx = code.search(/(?:#\s*)?set\s+par\s*\(/);
  while (setParIdx !== -1) {
    const parenStart = code.indexOf('(', setParIdx);
    const matched = extractBalancedGroup(code, parenStart, '(', ')');
    if (matched) {
      const parArgs = matched.content;
      code = code.substring(0, setParIdx) + code.substring(matched.endPos + 1);

      const leadingM = parArgs.match(/leading:\s*([\d.]+\w+)/);
      if (leadingM) globalLeading = leadingM[1];
    } else {
      break;
    }
    setParIdx = code.search(/(?:#\s*)?set\s+par\s*\(/);
  }

  // 5. Strip any other multiline #set ... (...) or set ... (...) rules cleanly
  let otherSetIdx = code.search(/(?:#\s*)?set\s+[a-zA-Z0-9_-]+\s*\(/);
  while (otherSetIdx !== -1) {
    const parenStart = code.indexOf('(', otherSetIdx);
    const matched = extractBalancedGroup(code, parenStart, '(', ')');
    if (matched) {
      code = code.substring(0, otherSetIdx) + code.substring(matched.endPos + 1);
      otherSetIdx = code.search(/(?:#\s*)?set\s+[a-zA-Z0-9_-]+\s*\(/);
    } else {
      break;
    }
  }

  // 6. Strip #show ... rules (e.g. #show heading: set text(...) or #show: template)
  let showIdx = code.search(/(?:#\s*)?show\b/);
  while (showIdx !== -1) {
    const nextNewline = code.indexOf('\n', showIdx);
    const parenStart = code.indexOf('(', showIdx);
    if (parenStart !== -1 && (nextNewline === -1 || parenStart < nextNewline)) {
      const matched = extractBalancedGroup(code, parenStart, '(', ')');
      if (matched) {
        code = code.substring(0, showIdx) + code.substring(matched.endPos + 1);
        showIdx = code.search(/(?:#\s*)?show\b/);
        continue;
      }
    }
    // Fallback single line strip
    code = code.substring(0, showIdx) + (nextNewline !== -1 ? code.substring(nextNewline + 1) : '');
    showIdx = code.search(/(?:#\s*)?show\b/);
  }

  // Strip remaining #let, #import statements
  code = code.replace(/#set\s+[\s\S]*?(?:;|\n|$)/g, '');
  code = code.replace(/#let\s+[\s\S]*?(?:;|\n|$)/g, '');
  code = code.replace(/#import\s+[\s\S]*?(?:;|\n|$)/g, '');

  // 5. Parse function calls & markup in body content
  const bodyHtml = parseTypstBodyFunctions(code, subFiles);

  const headerBanner = headerHtml
    ? `<div class="typst-header-banner" style="display: block; width: 100%; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 8px; margin-bottom: 16px; font-size: 9pt; color: #64748b;">${headerHtml}</div>`
    : '';

  const footerBanner = footerHtml
    ? `<div class="typst-footer-banner" style="display: block; width: 100%; margin-top: 24px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.06); font-size: 9pt; color: #64748b;">${footerHtml}</div>`
    : '';

  // Return wrapped in typst-paper-wrapper & typst-paper-body so DocsView.tsx getFlattenedChildNodes unwraps child nodes for multi-page pagination
  return `
    <div class="typst-paper-wrapper" style="font-family: ${globalFont}; font-size: ${globalFontSize}; color: ${globalTextColor}; line-height: ${globalLeading}; width: 100%;">
      <style>
        .typst-paper-wrapper .academic-table th {
          background-color: inherit;
          color: inherit !important;
        }
        .typst-paper-wrapper .academic-table thead th,
        .typst-paper-wrapper .academic-table thead th * {
          color: inherit !important;
        }
      </style>
      ${headerBanner}
      <div class="typst-paper-body" style="width: 100%;">
        ${bodyHtml}
      </div>
      ${footerBanner}
    </div>
  `;
}

/**
 * Parses multiline Typst functions like block(...), align(...), text(...), v(...), h(...), line(...), table(...), grid(...)
 * with or without leading '#' prefix.
 */
function parseTypstBodyFunctions(code: string, subFiles: Array<{ name: string; content: string }> = []): string {
  let str = code;

  // Process #context blocks & dynamic page counters in body
  str = str.replace(/(?:#\s*)?context\s*\{([\s\S]*?)\}/g, (match) => resolveTypstContextExpr(match));
  str = str.replace(/(?:#\s*)?context\s*\[([\s\S]*?)\]/g, '$1');
  str = str.replace(/#?counter\s*\(\s*page\s*\)\s*\.(?:get|final)\s*\(\s*\)\s*\.first\s*\(\s*\)/g, '1');
  str = str.replace(/#?counter\s*\(\s*page\s*\)\s*\.display\s*\([^)]*\)/g, '1');
  str = str.replace(/#?counter\s*\(\s*page\s*\)/g, '1');

  // Process #pagebreak() or pagebreak() or #pagebreak
  str = str.replace(/(?:#\s*)?pagebreak\s*(?:\(\s*\))?/g, '<div class="doc-page-break"></div>');

  // Process #image("...") or image(...) using balanced parentheses (handles nested rgb(), etc.)
  let imageSearchPos = 0;
  while (imageSearchPos < str.length) {
    const match = str.substring(imageSearchPos).match(/(?:#|(?<=\s|^|[(,]))image\s*\(/);
    if (!match || match.index === undefined) break;

    const imgIdx = imageSearchPos + match.index;
    const parenStart = str.indexOf('(', imgIdx);
    const argsMatch = extractBalancedGroup(str, parenStart, '(', ')');

    if (argsMatch) {
      const args = argsMatch.content;
      const srcMatch = args.match(/["']([^"']+)["']/);
      const rawSrc = srcMatch ? srcMatch[1] : '';

      let widthStyle = 'max-width: 100%;';
      let heightStyle = '';
      let borderRadiusStyle = 'border-radius: 6px;';
      let strokeStyle = '';
      let fitStyle = 'object-fit: cover;';

      const widthVal = extractParamValue(args, 'width');
      if (widthVal) widthStyle = `width: ${widthVal}; max-width: 100%;`;

      const heightVal = extractParamValue(args, 'height');
      if (heightVal) heightStyle = `height: ${heightVal};`;

      const fitVal = extractParamValue(args, 'fit');
      if (fitVal) {
        const cleanFit = fitVal.replace(/["']/g, '').trim();
        if (cleanFit === 'cover' || cleanFit === 'contain' || cleanFit === 'fill') {
          fitStyle = `object-fit: ${cleanFit};`;
        }
      }

      const radiusVal = extractParamValue(args, 'radius') || extractParamValue(args, 'corner-radius');
      if (radiusVal) borderRadiusStyle = `border-radius: ${radiusVal};`;

      const strokeVal = extractParamValue(args, 'stroke');
      if (strokeVal) {
        const parts = strokeVal.split('+').map((s) => s.trim());
        const widthPart = parts[0] || '1pt';
        const colorPart = parts[1] ? parseTypstColor(parts[1]) : '#2d6a4f';
        strokeStyle = `border: ${widthPart} solid ${colorPart};`;
      }

      const cleanPath = rawSrc.replace(/^\.\//, '').toLowerCase();
      const foundSub = subFiles?.find(
        (f) =>
          f.name.toLowerCase() === cleanPath ||
          f.name.toLowerCase().endsWith('/' + cleanPath) ||
          cleanPath.endsWith('/' + f.name.toLowerCase()) ||
          f.name.toLowerCase() === `${cleanPath}.png` ||
          f.name.toLowerCase() === `${cleanPath}.jpg` ||
          f.name.toLowerCase() === `${cleanPath}.jpeg` ||
          f.name.toLowerCase() === `${cleanPath}.webp` ||
          f.name.toLowerCase() === `${cleanPath}.svg`
      );

      let resolvedSrc = rawSrc;
      if (foundSub?.content && foundSub.content.trim()) {
        resolvedSrc = foundSub.content.trim();
      }

      const replacement = `<img src="${resolvedSrc}" alt="Dokumen Image" style="${widthStyle} ${heightStyle} ${borderRadiusStyle} ${strokeStyle} ${fitStyle} box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: inline-block; vertical-align: middle;" />`;
      str = str.substring(0, imgIdx) + replacement + str.substring(argsMatch.endPos + 1);
      imageSearchPos = imgIdx + replacement.length;
    } else {
      imageSearchPos = imgIdx + 6;
    }
  }

  // Process #table(...) or table(...)
  let searchPos = 0;
  while (searchPos < str.length) {
    const match = str.substring(searchPos).match(/(?:#|(?<=\s|^|[(,]))table\s*\(/);
    if (!match || match.index === undefined) break;

    const tableIdx = searchPos + match.index;
    const parenStart = str.indexOf('(', tableIdx);
    const matched = extractBalancedGroup(str, parenStart, '(', ')');

    if (matched) {
      const tableArgs = matched.content;

      // Count columns: columns: (auto, 1fr, 1fr) => 3 columns, or columns: 3 => 3
      let colCount = 2;
      const colVal = extractParamValue(tableArgs, 'columns');
      if (colVal) {
        if (colVal.startsWith('(')) {
          colCount = Math.max(1, colVal.split(',').length);
        } else {
          const num = parseInt(colVal, 10);
          if (!isNaN(num)) colCount = num;
        }
      }

      // Extract header fill color or general fill color
      let headerBg = '#2d6a4f';
      const fillVal = extractParamValue(tableArgs, 'fill');
      if (fillVal) {
        const rgbMatch = fillVal.match(/rgb\(\s*["']?([^"')]+)["']?\s*\)/i);
        if (rgbMatch) {
          headerBg = parseTypstColor(rgbMatch[0]);
        } else {
          const hexMatch = fillVal.match(/#([a-fA-F0-9]{3,8})/);
          if (hexMatch) {
            headerBg = `#${hexMatch[1]}`;
          }
        }
      }

      // Extract all bracketed cells [...] in tableArgs
      const cells: string[] = [];
      let idx = 0;
      while (idx < tableArgs.length) {
        const bracketStart = tableArgs.indexOf('[', idx);
        if (bracketStart === -1) break;
        const cellMatch = extractBalancedGroup(tableArgs, bracketStart, '[', ']');
        if (cellMatch) {
          cells.push(cellMatch.content);
          idx = cellMatch.endPos + 1;
        } else {
          idx = bracketStart + 1;
        }
      }

      if (cells.length > 0) {
        let tableHtml = `<table class="academic-table" style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">`;

        const headerCells = cells.slice(0, colCount);
        const bodyCells = cells.slice(colCount);

        const headerTextColor = getContrastTextColor(headerBg);
        tableHtml += `<thead style="background-color: ${headerBg} !important; color: ${headerTextColor} !important;"><tr>`;
        headerCells.forEach((c) => {
          const inner = parseTypstBodyFunctions(c, subFiles);
          tableHtml += `<th style="padding: 9px 12px; background-color: ${headerBg} !important; border-bottom: 2px solid ${headerTextColor === '#ffffff' ? 'rgba(255,255,255,0.25)' : '#1e293b'}; text-align: left; font-weight: 700; color: ${headerTextColor} !important;">${inner}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        for (let r = 0; r < bodyCells.length; r += colCount) {
          const rowItems = bodyCells.slice(r, r + colCount);
          const isEven = (r / colCount) % 2 === 1;
          const rowBg = isEven ? '#f8fafc' : '#ffffff';
          const rowTextColor = getContrastTextColor(rowBg);
          tableHtml += `<tr style="background-color: ${rowBg} !important; color: ${rowTextColor} !important;">`;
          rowItems.forEach((c) => {
            const inner = parseTypstBodyFunctions(c, subFiles);
            tableHtml += `<td style="padding: 8px 12px; background-color: ${rowBg} !important; border-bottom: 1px solid #e2e8f0; color: ${rowTextColor} !important; vertical-align: top;">${inner}</td>`;
          });
          tableHtml += `</tr>`;
        }

        tableHtml += `</tbody></table>`;
        str = str.substring(0, tableIdx) + tableHtml + str.substring(matched.endPos + 1);
        searchPos = tableIdx + tableHtml.length;
      } else {
        searchPos = tableIdx + 6;
      }
    } else {
      searchPos = tableIdx + 6;
    }
  }

  // Process #grid(...) or grid(...)
  searchPos = 0;
  while (searchPos < str.length) {
    const match = str.substring(searchPos).match(/(?:#|(?<=\s|^|[(,]))grid\s*\(/);
    if (!match || match.index === undefined) break;

    const gridIdx = searchPos + match.index;
    const parenStart = str.indexOf('(', gridIdx);
    const matched = extractBalancedGroup(str, parenStart, '(', ')');

    if (matched) {
      const gridArgs = matched.content;

      // Extract columns: (auto, auto) or columns: 2
      let colCount = 2;
      const colVal = extractParamValue(gridArgs, 'columns');
      if (colVal) {
        if (colVal.startsWith('(')) {
          colCount = Math.max(1, colVal.split(',').length);
        } else {
          const num = parseInt(colVal, 10);
          if (!isNaN(num)) colCount = num;
        }
      }

      // Extract gutter: 20pt or column-gutter: 20pt
      let gap = '16px';
      const gutterVal = extractParamValue(gridArgs, 'gutter') || extractParamValue(gridArgs, 'column-gutter');
      if (gutterVal) gap = gutterVal;

      // Split arguments into positional items, skipping named parameters (columns: ..., gutter: ..., etc.)
      const items: string[] = [];
      let idx = 0;
      while (idx < gridArgs.length) {
        while (idx < gridArgs.length && /[\s,]/.test(gridArgs[idx])) idx++;
        if (idx >= gridArgs.length) break;

        // Check if this is a named parameter: e.g. columns: ... or gutter: ...
        const namedMatch = gridArgs.substring(idx).match(/^[a-zA-Z0-9_-]+\s*:\s*/);
        if (namedMatch) {
          idx += namedMatch[0].length;
          // Skip value of named parameter
          let pDepth = 0;
          let bDepth = 0;
          let inStr = false;
          let sChar = '';
          while (idx < gridArgs.length) {
            const ch = gridArgs[idx];
            if (inStr) {
              if (ch === sChar && gridArgs[idx - 1] !== '\\') inStr = false;
              idx++;
              continue;
            }
            if (ch === '"' || ch === "'") {
              inStr = true;
              sChar = ch;
              idx++;
              continue;
            }
            if (ch === '(') pDepth++;
            else if (ch === ')') pDepth--;
            else if (ch === '[') bDepth++;
            else if (ch === ']') bDepth--;
            else if (ch === ',' && pDepth === 0 && bDepth === 0) {
              idx++;
              break;
            }
            idx++;
          }
          continue;
        }

        // Positional item (e.g. box(...), image(...), [...], or text)
        const itemStart = idx;
        let pDepth = 0;
        let bDepth = 0;
        let inStr = false;
        let sChar = '';
        while (idx < gridArgs.length) {
          const ch = gridArgs[idx];
          if (inStr) {
            if (ch === sChar && gridArgs[idx - 1] !== '\\') inStr = false;
            idx++;
            continue;
          }
          if (ch === '"' || ch === "'") {
            inStr = true;
            sChar = ch;
            idx++;
            continue;
          }
          if (ch === '(') pDepth++;
          else if (ch === ')') pDepth--;
          else if (ch === '[') bDepth++;
          else if (ch === ']') bDepth--;
          else if (ch === ',' && pDepth === 0 && bDepth === 0) {
            break;
          }
          idx++;
        }

        const itemStr = gridArgs.substring(itemStart, idx).trim();
        if (itemStr) items.push(itemStr);
        if (idx < gridArgs.length && gridArgs[idx] === ',') idx++;
      }

      // Convert columns definition
      let gridTemplateCols = `repeat(${colCount}, 1fr)`;
      if (colVal) {
        if (colVal.startsWith('(') && colVal.endsWith(')')) {
          const colDefs = colVal.slice(1, -1).split(',').map((c) => c.trim()).filter(Boolean);
          if (colDefs.length > 0) {
            gridTemplateCols = colDefs
              .map((c) => {
                if (c === '1fr' || c.endsWith('fr')) return c;
                if (c === 'auto') return 'auto';
                if (/^[\d.]+(pt|px|cm|mm|in|rem|em|%)$/.test(c)) return c;
                return '1fr';
              })
              .join(' ');
          }
        } else if (/^\d+$/.test(colVal.trim())) {
          gridTemplateCols = `repeat(${colVal.trim()}, 1fr)`;
        }
      }

      const renderedItems = items.map((item) => {
        let content = item;
        if (content.startsWith('[') && content.endsWith(']')) {
          content = content.substring(1, content.length - 1);
        }
        return parseTypstBodyFunctions(content, subFiles);
      });

      const gridHtml = `<div class="typst-grid" style="display: grid; grid-template-columns: ${gridTemplateCols}; gap: ${gap}; margin: 16px 0; width: 100%; box-sizing: border-box; align-items: start;">${renderedItems.map((c) => `<div class="typst-grid-cell" style="min-width: 0; box-sizing: border-box; display: flex; flex-direction: column; align-items: stretch; text-align: left;">${c}</div>`).join('')}</div>`;

      str = str.substring(0, gridIdx) + gridHtml + str.substring(matched.endPos + 1);
      searchPos = gridIdx + gridHtml.length;
    } else {
      searchPos = gridIdx + 5;
    }
  }

  // Process #block(...) [...], #rect(...) [...], #circle(...) [...], #box(...) [...]
  searchPos = 0;
  while (searchPos < str.length) {
    const match = str.substring(searchPos).match(/(?:#|(?<=\s|^|[(,]))(block|rect|circle|box|square|ellipse)\s*(?:\(|\[)/);
    if (!match || match.index === undefined) break;

    const blockType = match[1].toLowerCase();
    const blockIdx = searchPos + match.index;
    const isParen = str[blockIdx + match[0].length - 1] === '(';

    let argsStr = '';
    let contentStr = '';
    let endPos = -1;

    let currentPos = blockIdx + match[0].length - 1;

    let argsMatch: { content: string; endPos: number } | null = null;
    if (isParen) {
      argsMatch = extractBalancedGroup(str, currentPos, '(', ')');
      if (argsMatch) {
        argsStr = argsMatch.content;
        currentPos = argsMatch.endPos + 1;
        while (currentPos < str.length && /\s/.test(str[currentPos])) currentPos++;
      }
    }

    if (currentPos < str.length && str[currentPos] === '[') {
      const contentMatch = extractBalancedGroup(str, currentPos, '[', ']');
      if (contentMatch) {
        contentStr = contentMatch.content;
        endPos = contentMatch.endPos;
      }
    } else if (isParen && argsStr) {
      // Box or block without trailing [...], e.g. box(width: ..., height: ..., image(...))
      endPos = argsMatch ? argsMatch.endPos : currentPos - 1;
      // Extract positional items (any item not a named parameter foo: bar)
      const namedParams = ['width', 'height', 'radius', 'size', 'clip', 'stroke', 'fill', 'inset'];
      let idx = 0;
      const positionalParts: string[] = [];
      while (idx < argsStr.length) {
        while (idx < argsStr.length && /[\s,]/.test(argsStr[idx])) idx++;
        if (idx >= argsStr.length) break;

        const isNamed = namedParams.some((np) => new RegExp(`^${np}\\s*:`).test(argsStr.substring(idx)));
        let pDepth = 0;
        let bDepth = 0;
        let inStr = false;
        let sChar = '';
        const itemStart = idx;

        while (idx < argsStr.length) {
          const ch = argsStr[idx];
          if (inStr) {
            if (ch === sChar && argsStr[idx - 1] !== '\\') inStr = false;
            idx++;
            continue;
          }
          if (ch === '"' || ch === "'") {
            inStr = true;
            sChar = ch;
            idx++;
            continue;
          }
          if (ch === '(') pDepth++;
          else if (ch === ')') pDepth--;
          else if (ch === '[') bDepth++;
          else if (ch === ']') bDepth--;
          else if (ch === ',' && pDepth === 0 && bDepth === 0) {
            break;
          }
          idx++;
        }

        const chunk = argsStr.substring(itemStart, idx).trim();
        if (!isNamed && chunk) {
          positionalParts.push(chunk);
        }
        if (idx < argsStr.length && argsStr[idx] === ',') idx++;
      }
      contentStr = positionalParts.join(' ');
    }

    if (endPos > blockIdx) {
      let bg = blockType === 'block' ? '#f8fafc' : 'transparent';
      let stroke = 'none';
      let inset = '0';
      const isCircleOrEllipse = blockType === 'circle' || blockType === 'ellipse';
      const isInline = blockType === 'circle' || blockType === 'box' || blockType === 'square' || blockType === 'ellipse';
      let radius = isCircleOrEllipse ? '50%' : '0';
      let width = isInline ? 'auto' : '100%';
      let height = 'auto';
      let aspectRatioStyle = isCircleOrEllipse || blockType === 'square' ? 'aspect-ratio: 1 / 1;' : '';
      let overflowStyle = '';

      const fillVal = extractParamValue(argsStr, 'fill');
      let containerTextColor = '';
      if (fillVal) {
        bg = parseTypstColor(fillVal);
        if (bg && bg !== 'transparent' && bg !== 'none') {
          containerTextColor = `color: ${getContrastTextColor(bg)};`;
        }
      }

      const strokeVal = extractParamValue(argsStr, 'stroke');
      if (strokeVal) {
        const parts = strokeVal.split('+').map((s) => s.trim());
        const widthPart = parts[0] || '1pt';
        const colorPart = parts[1] ? parseTypstColor(parts[1]) : '#e2e8f0';
        stroke = `${widthPart} solid ${colorPart}`;
      }

      const insetVal = extractParamValue(argsStr, 'inset');
      if (insetVal) inset = insetVal;

      const radiusVal = extractParamValue(argsStr, 'radius');
      if (blockType === 'circle') {
        radius = '50%';
        if (radiusVal) {
          const radMatch = radiusVal.match(/^([\d.]+)(pt|px|cm|mm|in|rem|em)?$/);
          if (radMatch) {
            const num = parseFloat(radMatch[1]);
            const unit = radMatch[2] || 'pt';
            const diameter = `${num * 2}${unit}`;
            width = diameter;
            height = diameter;
          }
        }
      } else if (radiusVal) {
        radius = radiusVal;
        overflowStyle = 'overflow: hidden;';
      }

      const widthVal = extractParamValue(argsStr, 'width') || extractParamValue(argsStr, 'size');
      if (widthVal) width = widthVal;

      const heightVal = extractParamValue(argsStr, 'height');
      if (heightVal) height = heightVal;

      if (/clip:\s*true/i.test(argsStr) || radiusVal || isCircleOrEllipse) {
        overflowStyle = 'overflow: hidden;';
      }

      const renderedInner = parseTypstBodyFunctions(contentStr, subFiles);
      const displayStyle = isInline ? 'inline-flex' : 'block';
      const flexAlignment = isInline ? 'justify-content: center; align-items: center;' : '';
      const heightStyle = height !== 'auto' ? `height: ${height};` : '';

      const replacement = `<div style="background-color: ${bg}; ${containerTextColor} border: ${stroke}; padding: ${inset}; border-radius: ${radius}; width: ${width}; ${heightStyle} ${aspectRatioStyle} ${overflowStyle} margin: 10px auto; box-sizing: border-box; display: ${displayStyle}; ${flexAlignment} flex-shrink: 0; max-width: 100%; text-align: left;">${renderedInner}</div>`;

      str = str.substring(0, blockIdx) + replacement + str.substring(endPos + 1);
      searchPos = blockIdx + replacement.length;
    } else {
      searchPos = blockIdx + 5;
    }
  }

  // Process #align(pos)[...] or align(pos)[...]
  searchPos = 0;
  while (searchPos < str.length) {
    const match = str.substring(searchPos).match(/(?:#|(?<=\s|^|[(,]))align\s*\(/);
    if (!match || match.index === undefined) break;

    const alignIdx = searchPos + match.index;
    const parenStart = str.indexOf('(', alignIdx);
    const argsMatch = extractBalancedGroup(str, parenStart, '(', ')');

    let posStr = 'left';
    let contentStr = '';
    let endPos = -1;

    if (argsMatch) {
      posStr = argsMatch.content.trim();
      let currentPos = argsMatch.endPos + 1;
      while (currentPos < str.length && /\s/.test(str[currentPos])) currentPos++;

      if (currentPos < str.length && str[currentPos] === '[') {
        const contentMatch = extractBalancedGroup(str, currentPos, '[', ']');
        if (contentMatch) {
          contentStr = contentMatch.content;
          endPos = contentMatch.endPos;
        }
      }
    }

    if (endPos > alignIdx) {
      let textAlign = 'left';
      if (posStr.includes('right')) textAlign = 'right';
      else if (posStr.includes('center')) textAlign = 'center';
      else if (posStr.includes('left')) textAlign = 'left';

      const renderedInner = parseTypstBodyFunctions(contentStr, subFiles);
      const replacement = `<div style="text-align: ${textAlign}; width: 100%; margin: 4px 0;">${renderedInner}</div>`;
      str = str.substring(0, alignIdx) + replacement + str.substring(endPos + 1);
      searchPos = alignIdx + replacement.length;
    } else {
      searchPos = alignIdx + 5;
    }
  }

  // Process #text(args)[...] or text(args)[...] or #text[...] or text[...]
  searchPos = 0;
  while (searchPos < str.length) {
    const match = str.substring(searchPos).match(/(?:#|(?<=\s|^|[(,]))text\s*(?:\(|\[)/);
    if (!match || match.index === undefined) break;

    const textIdx = searchPos + match.index;
    const isParen = str[textIdx + match[0].length - 1] === '(';

    let argsStr = '';
    let contentStr = '';
    let endPos = -1;

    let currentPos = textIdx + match[0].length - 1;

    if (isParen) {
      const argsMatch = extractBalancedGroup(str, currentPos, '(', ')');
      if (argsMatch) {
        argsStr = argsMatch.content;
        currentPos = argsMatch.endPos + 1;
        while (currentPos < str.length && /\s/.test(str[currentPos])) currentPos++;
      }
    }

    if (currentPos < str.length && str[currentPos] === '[') {
      const contentMatch = extractBalancedGroup(str, currentPos, '[', ']');
      if (contentMatch) {
        contentStr = contentMatch.content;
        endPos = contentMatch.endPos;
      }
    }

    if (endPos > textIdx) {
      let styleStr = '';

      const sizeM = argsStr.match(/size:\s*([\d.]+\w+)/i) || argsStr.match(/\b([\d.]+(?:pt|em|px|rem))\b/i);
      if (sizeM) styleStr += `font-size: ${sizeM[1]}; `;

      const fillVal = extractParamValue(argsStr, 'fill');
      if (fillVal) {
        styleStr += `color: ${parseTypstColor(fillVal)}; `;
      }

      if (/italic:\s*true/i.test(argsStr) || /style:\s*["']italic["']/i.test(argsStr)) {
        styleStr += `font-style: italic; `;
      }

      const weightVal = extractParamValue(argsStr, 'weight');
      if (weightVal) {
        styleStr += `font-weight: ${weightVal.replace(/["']/g, '')}; `;
      } else if (/bold:\s*true/i.test(argsStr)) {
        styleStr += `font-weight: bold; `;
      }

      const fontVal = extractParamValue(argsStr, 'font');
      if (fontVal) styleStr += `font-family: ${fontVal}, sans-serif; `;

      const renderedInner = parseTypstBodyFunctions(contentStr, subFiles);
      const replacement = `<span style="${styleStr}">${renderedInner}</span>`;
      str = str.substring(0, textIdx) + replacement + str.substring(endPos + 1);
      searchPos = textIdx + replacement.length;
    } else {
      searchPos = textIdx + 4;
    }
  }

  // Process Spacing #v(size) & #h(size) or v(size) & h(size)
  str = str.replace(/(?:#\s*)?v\(\s*([\d.]+\w*)\s*\)/g, '<div style="height: $1; min-height: $1; display: block;"></div>');
  str = str.replace(/(?:#\s*)?h\(\s*([\d.]+\w*)\s*\)/g, '<span style="display: inline-block; width: $1;"></span>');

  // Process #line(...) or line(...) using balanced parentheses (handles nested rgb(...), etc.)
  let lineSearchPos = 0;
  while (lineSearchPos < str.length) {
    const match = str.substring(lineSearchPos).match(/(?:#|(?<=\s|^|[(,]))line\s*\(/);
    if (!match || match.index === undefined) break;

    const lineIdx = lineSearchPos + match.index;
    const parenStart = str.indexOf('(', lineIdx);
    const argsMatch = extractBalancedGroup(str, parenStart, '(', ')');

    if (argsMatch) {
      const args = argsMatch.content;
      let strokeColor = '#cbd5e1';
      let strokeWidth = '1pt';
      let lengthStr = '100%';

      const strokeVal = extractParamValue(args, 'stroke');
      if (strokeVal) {
        const parts = strokeVal.split('+').map((s) => s.trim());
        strokeWidth = parts[0] || '1pt';
        if (parts[1]) strokeColor = parseTypstColor(parts[1]);
        else if (strokeVal.startsWith('#') || strokeVal.startsWith('rgb(') || ['black', 'green', 'blue', 'red', 'navy'].includes(strokeVal.trim())) {
          strokeColor = parseTypstColor(strokeVal);
        }
      }
      const lenVal = extractParamValue(args, 'length');
      if (lenVal) lengthStr = lenVal;

      const replacement = `<hr style="border: none; border-top: ${strokeWidth} solid ${strokeColor}; margin: 12px 0; width: ${lengthStr};" />`;
      str = str.substring(0, lineIdx) + replacement + str.substring(argsMatch.endPos + 1);
      lineSearchPos = lineIdx + replacement.length;
    } else {
      lineSearchPos = lineIdx + 5;
    }
  }

  // Process #counter(page).display()
  str = str.replace(/(?:#\s*)?counter\(page\)\.display\([^)]*\)/g, '1');

  // Pass to inline markup parser
  return parseTypstInlineMarkup(str);
}

/**
 * Converts Typst mathematical syntax into KaTeX-compatible LaTeX math
 */
function convertTypstMathToKatex(mathStr: string): string {
  if (!mathStr || !mathStr.trim()) return '';
  let res = mathStr.trim();

  // text("...") or "..." -> \text{...}
  res = res.replace(/text\s*\(\s*["']([^"']+)["']\s*\)/g, '\\text{$1}');
  res = res.replace(/["']([^"']+)["']/g, '\\text{$1}');

  // Convert frac(...) using balanced paren matching
  let fracMatch = res.match(/(?:\\frac|frac)\s*\(/);
  while (fracMatch && fracMatch.index !== undefined) {
    const startIdx = fracMatch.index;
    const parenStart = res.indexOf('(', startIdx);
    let depth = 0;
    let commaIdx = -1;
    let endIdx = -1;
    for (let i = parenStart; i < res.length; i++) {
      const ch = res[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      } else if (ch === ',' && depth === 1) {
        commaIdx = i;
      }
    }
    if (endIdx !== -1 && commaIdx !== -1) {
      const numerator = res.substring(parenStart + 1, commaIdx).trim();
      const denominator = res.substring(commaIdx + 1, endIdx).trim();
      const replacement = `\\frac{${numerator}}{${denominator}}`;
      res = res.substring(0, startIdx) + replacement + res.substring(endIdx + 1);
    } else {
      break;
    }
    fracMatch = res.match(/(?:\\frac|frac)\s*\(/);
  }

  // Convert sqrt(...) using balanced paren matching
  let sqrtMatch = res.match(/(?:\\sqrt|sqrt)\s*\(/);
  while (sqrtMatch && sqrtMatch.index !== undefined) {
    const startIdx = sqrtMatch.index;
    const parenStart = res.indexOf('(', startIdx);
    let depth = 0;
    let endIdx = -1;
    for (let i = parenStart; i < res.length; i++) {
      const ch = res[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      const inner = res.substring(parenStart + 1, endIdx).trim();
      const replacement = `\\sqrt{${inner}}`;
      res = res.substring(0, startIdx) + replacement + res.substring(endIdx + 1);
    } else {
      break;
    }
    sqrtMatch = res.match(/(?:\\sqrt|sqrt)\s*\(/);
  }

  // Convert subscripts: I_("biomassa") -> I_{\text{biomassa}}, I_(biomassa) -> I_{\text{biomassa}}, I_(\text{biomassa}) -> I_{\text{biomassa}}
  res = res.replace(/_(\([a-zA-Z0-9_\s"'\\{}]+\)|"[^"]+"|'[^']+'|[a-zA-Z0-9]+)/g, (m, rawInner) => {
    let clean = rawInner.replace(/^\(/, '').replace(/\)$/, '').replace(/^["']/, '').replace(/["']$/, '').trim();
    if (clean.startsWith('\\text{')) return `_{${clean}}`;
    if (/^[a-zA-Z0-9]+$/.test(clean) && clean.length > 1) return `_{\\text{${clean}}}`;
    return `_{${clean}}`;
  });

  // Convert superscripts: x^("text") -> x^{\text{text}}, x^(2) -> x^{2}, x^(n) -> x^{n}
  res = res.replace(/\^(\([a-zA-Z0-9_\s"'\\{}+\-*/=]+\)|"[^"]+"|'[^']+'|[a-zA-Z0-9]+)/g, (m, rawInner) => {
    let clean = rawInner.replace(/^\(/, '').replace(/\)$/, '').replace(/^["']/, '').replace(/["']$/, '').trim();
    if (clean.startsWith('\\text{')) return `^{${clean}}`;
    return `^{${clean}}`;
  });

  // Convert sum and limits: sum_(i=1)^n or sum(i=1)^n or sum i = 1^n
  res = res.replace(/(?<!\\)\bsum\s*_\s*\{?\(?([^)}^]+)\)?\}?\s*\^\s*\{?\(?([^)}^]+)\)?\}?/g, '\\sum_{$1}^{$2}');
  res = res.replace(/(?<!\\)\bsum\s+([a-zA-Z0-9]+)\s*=\s*([a-zA-Z0-9]+)\s*\^\s*([a-zA-Z0-9]+)/g, '\\sum_{$1=$2}^{$3}');
  res = res.replace(/(?<!\\)\bsum\b/g, '\\sum');

  // Multi-letter Greek letters
  const greekLetters = [
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa',
    'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
    'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega'
  ];
  for (const g of greekLetters) {
    const r = new RegExp(`(?<!\\\\)\\b${g}\\b`, 'g');
    res = res.replace(r, `\\${g}`);
  }

  // Math operators
  res = res.replace(/(?<!\\)\bdot\b/g, '\\cdot');
  res = res.replace(/(?<!\\)\bcdot\b/g, '\\cdot');
  res = res.replace(/(?<!\\)\btimes\b/g, '\\times');
  res = res.replace(/(?<!\\)\bdiv\b/g, '\\div');
  res = res.replace(/(?<!\\)\bpm\b/g, '\\pm');
  res = res.replace(/(?<!\\)\bmp\b/g, '\\mp');
  res = res.replace(/(?<!\\)\bapprox\b/g, '\\approx');
  res = res.replace(/(?<!\\)\bneq\b/g, '\\neq');
  res = res.replace(/(?<!\\)\ble\b/g, '\\le');
  res = res.replace(/(?<!\\)\bge\b/g, '\\ge');
  res = res.replace(/(?<!\\)\binfinity\b|(?<!\\)\boo\b/g, '\\infty');
  res = res.replace(/(?<!\\)\bnabla\b/g, '\\nabla');
  res = res.replace(/(?<!\\)\bpartial\b/g, '\\partial');
  res = res.replace(/(?<!\\)\bprod\b/g, '\\prod');
  res = res.replace(/(?<!\\)\bintegral\b/g, '\\int');
  res = res.replace(/->/g, '\\rightarrow');
  res = res.replace(/=>/g, '\\Rightarrow');
  res = res.replace(/<-/g, '\\leftarrow');
  res = res.replace(/<=/g, '\\Leftarrow');

  return res;
}

/**
 * Parses inline Typst formatting (headings, math, lists, bold, italic, paragraphs)
 */
function parseTypstInlineMarkup(text: string): string {
  let res = text;
  const mathPlaceholders: Array<{ type: 'display' | 'inline'; content: string }> = [];

  // Step 1: Protect and extract Display/Block Math: $ ... $ on its own line or surrounded by whitespace
  res = res.replace(/(?:^|\n)\s*\$\s*([\s\S]*?)\s*\$\s*(?:\n|$)/g, (match, mathContent) => {
    const idx = mathPlaceholders.length;
    mathPlaceholders.push({ type: 'display', content: mathContent.trim() });
    return `\n\n«TYPSTMATHBLOCK${idx}»\n\n`;
  });

  // Step 2: Protect and extract Inline Typst math $ ... $
  res = res.replace(/(?<!\$)\$([^\$\n]+)\$(?!\$)/g, (match, mathContent) => {
    const idx = mathPlaceholders.length;
    mathPlaceholders.push({ type: 'inline', content: mathContent.trim() });
    return `«TYPSTMSLOT${idx}»`;
  });

  // Step 3: Parse Document Headings
  res = res.replace(/^=====\s+(.+)$/gm, '<h5 style="font-size: 1.0em; color: #2d6a4f; margin-top: 1.0em; margin-bottom: 0.3em; font-weight: 600;">$1</h5>');
  res = res.replace(/^====\s+(.+)$/gm, '<h4 style="font-size: 1.05em; color: #2d6a4f; margin-top: 1.1em; margin-bottom: 0.3em; font-weight: 600;">$1</h4>');
  res = res.replace(/^===\s+(.+)$/gm, '<h3 style="font-size: 1.15em; color: #2d6a4f; margin-top: 1.2em; margin-bottom: 0.4em; font-weight: 600;">$1</h3>');
  res = res.replace(/^==\s+(.+)$/gm, '<h2 style="font-size: 1.35em; color: #2d6a4f; margin-top: 1.4em; margin-bottom: 0.5em; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 4px; font-weight: 700;">$1</h2>');
  res = res.replace(/^=\s+(.+)$/gm, '<div class="doc-page-break"></div><h1 class="paper-sec-title" style="font-size: 1.7em; color: #1b4332; margin-top: 1.5em; margin-bottom: 0.6em; font-weight: 800; letter-spacing: -0.02em;">$1</h1>');

  // Step 4: Parse Bold, Italic, Strikethrough, and Underline formatting
  // 4a. Triple Bold + Italic: ***text*** or ___text___
  res = res.replace(/\*\*\*([^\*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  res = res.replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>');

  // 4b. Double Asterisk / Double Underscore Bold: **text**
  res = res.replace(/\*\*([^\*\n]+)\*\*/g, '<strong>$1</strong>');

  // 4c. Single Asterisk Typst Native Bold: *text*
  res = res.replace(/(?<=\s|^|[([{"'])\*([^\*\n\s][^\*\n]*[^\*\n\s]|[^\*\n\s])\*(?=\s|$|[.,!?;:)}\]"'])/g, '<strong>$1</strong>');

  // 4d. Double Underscore Underline: __text__
  res = res.replace(/__([^_\n]+)__/g, '<u>$1</u>');

  // 4e. Single Underscore Typst Native Italic: _text_
  res = res.replace(/(?<=\s|^|[([{"'])_([^_\n\s][^_\n]*[^_\n\s]|[^_\n\s])_(?=\s|$|[.,!?;:)}\]"'])/g, '<em>$1</em>');

  // 4f. Strikethrough: ~~text~~
  res = res.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');

  // 4g. Typographic Dashes: --- -> em-dash (—), -- -> en-dash (–)
  res = res.replace(/---/g, '—');
  res = res.replace(/--/g, '–');

  // Step 5: Parse Inline Code `code`
  res = res.replace(/`([^`\n]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-family: \'JetBrains Mono\', monospace; font-size: 0.9em; color: #0f766e;">$1</code>');

  // Step 6: Parse Lists
  // 6a. Split numbered points that were written inline (e.g. "...fisik. 2. *Jangan..." or "...fisik. 2. <strong>Jangan...")
  res = res.replace(/(?<=[.!?:]|\b)\s+(\d+[.)]\s+(?:<[^>]+>|[a-zA-Z0-9*_\`"'\(\[\{]))/g, '\n$1');

  // 6b. Unordered lists (- Item or • Item)
  res = res.replace(/^[\s\t]*[-•]\s+(.+)$/gm, '<li class="typst-ul-item" style="margin-bottom: 5px; text-align: left;">$1</li>');
  res = res.replace(/(<li class="typst-ul-item"[^>]*>[\s\S]*?<\/li>\s*)+/g, '<ul style="margin: 8px 0; padding-left: 20px; text-align: left; list-style-position: outside;">\n$&</ul>');

  // 6c. Ordered lists (+ Item or 1. Item or 1) Item)
  res = res.replace(/^[\s\t]*(?:\+|\d+[.)])\s+(.+)$/gm, '<li class="typst-ol-item" style="margin-bottom: 5px; text-align: left;">$1</li>');
  res = res.replace(/(<li class="typst-ol-item"[^>]*>[\s\S]*?<\/li>\s*)+/g, '<ol style="margin: 8px 0; padding-left: 20px; text-align: left; list-style-position: outside;">\n$&</ol>');

  // Step 7: Parse Line break \
  res = res.replace(/\\$/gm, '<br />');

  // Step 8: Clean up remaining unparsed #function syntax lines that weren't caught (never strip hex colors like #ffffff or #2d6a4f)
  res = res.replace(/(?<![:"'=&#])#(?!([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b)([a-zA-Z_][a-zA-Z0-9_-]*)\s*(?:\([^)]*\)|\[[^\]]*\])?/g, '');

  // Step 9: Restore Math Placeholders with converted KaTeX markup (clean and pristine)
  res = res.replace(/«TYPSTMATHBLOCK(\d+)»/g, (_, idxStr) => {
    const item = mathPlaceholders[parseInt(idxStr, 10)];
    if (!item) return '';
    const converted = convertTypstMathToKatex(item.content);
    return `<div class="katex-display" style="text-align: center; margin: 18px 0; font-size: 1.15em; overflow-x: auto;">$$ ${converted} $$</div>`;
  });

  res = res.replace(/«TYPSTMSLOT(\d+)»/g, (_, idxStr) => {
    const item = mathPlaceholders[parseInt(idxStr, 10)];
    if (!item) return '';
    const converted = convertTypstMathToKatex(item.content);
    return `$${converted}$`;
  });

  // Step 10: Split into paragraphs
  const blocks = res
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      if (
        b.startsWith('<h') ||
        b.startsWith('<div') ||
        b.startsWith('<ul') ||
        b.startsWith('<ol') ||
        b.startsWith('<hr') ||
        b.startsWith('<table') ||
        b.startsWith('<span') ||
        b.startsWith('<img') ||
        b.startsWith('<figure')
      ) {
        return b;
      }
      return `<p style="margin: 0 0 10px 0; line-height: 1.65; text-align: justify;">${b}</p>`;
    });

  return blocks.join('\n');
}
