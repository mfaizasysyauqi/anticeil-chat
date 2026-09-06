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
  const html = parseAndRenderTypst(resolvedCode);

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
      if (parenDepth === 0 && bracketDepth === 0) {
        return argsStr.substring(valStart, i).trim();
      }
      parenDepth--;
    } else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth--;
    else if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
      return argsStr.substring(valStart, i).trim();
    }
  }

  return argsStr.substring(valStart).trim();
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
 * Main Typst Parser and HTML Renderer
 */
function parseAndRenderTypst(rawCode: string): string {
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
  let setPageIdx = code.search(/#set\s+page\s*\(/);
  while (setPageIdx !== -1) {
    const parenStart = code.indexOf('(', setPageIdx);
    const matched = extractBalancedGroup(code, parenStart, '(', ')');
    if (matched) {
      const pageArgs = matched.content;
      code = code.substring(0, setPageIdx) + code.substring(matched.endPos + 1);

      // Extract header: ...
      const headerVal = extractParamValue(pageArgs, 'header');
      if (headerVal) {
        headerHtml = parseTypstBodyFunctions(headerVal);
      }

      // Extract footer: ...
      const footerVal = extractParamValue(pageArgs, 'footer');
      if (footerVal) {
        footerHtml = parseTypstBodyFunctions(footerVal);
      }
    } else {
      break;
    }
    setPageIdx = code.search(/#set\s+page\s*\(/);
  }

  // 3. Extract and strip #set text(...) commands
  let setTextIdx = code.search(/#set\s+text\s*\(/);
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
    setTextIdx = code.search(/#set\s+text\s*\(/);
  }

  // 4. Extract and strip #set par(...) commands
  let setParIdx = code.search(/#set\s+par\s*\(/);
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
    setParIdx = code.search(/#set\s+par\s*\(/);
  }

  // Strip remaining #set, #show, #let, #import statements
  code = code.replace(/#set\s+[\s\S]*?(?:;|\n|$)/g, '');
  code = code.replace(/#show\s+[\s\S]*?(?:;|\n|$)/g, '');
  code = code.replace(/#let\s+[\s\S]*?(?:;|\n|$)/g, '');
  code = code.replace(/#import\s+[\s\S]*?(?:;|\n|$)/g, '');

  // 5. Parse function calls & markup in body content
  const bodyHtml = parseTypstBodyFunctions(code);

  const headerBanner = headerHtml
    ? `<div class="typst-header-banner" style="display: flex; justify-content: flex-end; width: 100%; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 8px; margin-bottom: 16px; font-size: 9pt; color: #64748b;">${headerHtml}</div>`
    : '';

  const footerBanner = footerHtml
    ? `<div class="typst-footer-banner" style="display: flex; justify-content: center; width: 100%; margin-top: 24px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.06); font-size: 9pt; color: #64748b;">${footerHtml}</div>`
    : '';

  // Return wrapped in typst-paper-wrapper & typst-paper-body so DocsView.tsx getFlattenedChildNodes unwraps child nodes for multi-page pagination
  return `
    <div class="typst-paper-wrapper" style="font-family: ${globalFont}; font-size: ${globalFontSize}; color: ${globalTextColor}; line-height: ${globalLeading}; width: 100%;">
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
function parseTypstBodyFunctions(code: string): string {
  let str = code;

  // Process #pagebreak() or pagebreak() or #pagebreak
  str = str.replace(/(?:#\s*)?pagebreak\s*(?:\(\s*\))?/g, '<div class="doc-page-break"></div>');

  // Process #image("...") or image("...")
  str = str.replace(/(?:#\s*)?image\s*\(\s*["']([^"']+)["']([^)]*)\)/g, (match, src, args) => {
    let widthStyle = 'max-width: 100%;';
    if (args) {
      const widthVal = extractParamValue(args, 'width');
      if (widthVal) {
        widthStyle = `width: ${widthVal}; max-width: 100%;`;
      }
    }
    return `<div style="text-align: center; margin: 14px 0;"><img src="${src}" alt="Dokumen Image" style="${widthStyle} height: auto; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: inline-block;" /></div>`;
  });

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
        const colorMatch = fillVal.match(/rgb\(["']?([^"')]+)["']?\)/);
        if (colorMatch) headerBg = parseTypstColor(colorMatch[0]);
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

        tableHtml += `<thead style="background-color: ${headerBg}; color: #ffffff;"><tr>`;
        headerCells.forEach((c) => {
          const inner = parseTypstBodyFunctions(c);
          tableHtml += `<th style="padding: 9px 12px; border-bottom: 2px solid #1e293b; text-align: left; font-weight: 700;">${inner}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        for (let r = 0; r < bodyCells.length; r += colCount) {
          const rowItems = bodyCells.slice(r, r + colCount);
          const isEven = (r / colCount) % 2 === 1;
          const rowBg = isEven ? '#f8fafc' : '#ffffff';
          tableHtml += `<tr style="background-color: ${rowBg};">`;
          rowItems.forEach((c) => {
            const inner = parseTypstBodyFunctions(c);
            tableHtml += `<td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; vertical-align: top;">${inner}</td>`;
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

  // Process #block(...) [...] or block(...) [...]
  searchPos = 0;
  while (searchPos < str.length) {
    const match = str.substring(searchPos).match(/(?:#|(?<=\s|^|[(,]))block\s*(?:\(|\[)/);
    if (!match || match.index === undefined) break;

    const blockIdx = searchPos + match.index;
    const isParen = str[blockIdx + match[0].length - 1] === '(';

    let argsStr = '';
    let contentStr = '';
    let endPos = -1;

    let currentPos = blockIdx + match[0].length - 1;

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

    if (endPos > blockIdx) {
      let bg = '#f8fafc';
      let stroke = '1px solid #e2e8f0';
      let inset = '16px';
      let radius = '6px';
      let width = '100%';

      const fillVal = extractParamValue(argsStr, 'fill');
      if (fillVal) bg = parseTypstColor(fillVal);

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
      if (radiusVal) radius = radiusVal;

      const widthVal = extractParamValue(argsStr, 'width');
      if (widthVal) width = widthVal;

      const renderedInner = parseTypstBodyFunctions(contentStr);
      const replacement = `<div style="background-color: ${bg}; border: ${stroke}; padding: ${inset}; border-radius: ${radius}; width: ${width}; margin: 14px 0; box-sizing: border-box; display: block;">${renderedInner}</div>`;

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
      const renderedInner = parseTypstBodyFunctions(contentStr);
      const replacement = `<div style="text-align: ${posStr}; width: 100%; margin: 6px 0;">${renderedInner}</div>`;
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

      const renderedInner = parseTypstBodyFunctions(contentStr);
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

  // Process #line(...) or line(...)
  str = str.replace(/(?:#\s*)?line\(([^)]*)\)/g, (match, args) => {
    let strokeColor = '#cbd5e1';
    let strokeWidth = '1pt';
    let lengthStr = '100%';

    const strokeVal = extractParamValue(args, 'stroke');
    if (strokeVal) {
      const parts = strokeVal.split('+').map((s) => s.trim());
      strokeWidth = parts[0] || '1pt';
      if (parts[1]) strokeColor = parseTypstColor(parts[1]);
    }
    const lenVal = extractParamValue(args, 'length');
    if (lenVal) lengthStr = lenVal;

    return `<hr style="border: none; border-top: ${strokeWidth} solid ${strokeColor}; margin: 12px 0; width: ${lengthStr};" />`;
  });

  // Process #counter(page).display()
  str = str.replace(/(?:#\s*)?counter\(page\)\.display\([^)]*\)/g, '1');

  // Pass to inline markup parser
  return parseTypstInlineMarkup(str);
}

/**
 * Parses inline Typst formatting (headings, math, lists, bold, italic, paragraphs)
 */
function parseTypstInlineMarkup(text: string): string {
  let res = text;

  // Convert Typst math $ ... $ to KaTeX-compatible LaTeX math
  res = res.replace(/\$([^\$\n]+)\$/g, (m, mathContent) => {
    let content = mathContent;

    // text("...") -> \text{...}
    content = content.replace(/text\s*\(\s*["']([^"']+)["']\s*\)/g, '\\text{$1}');
    content = content.replace(/["']([^"']+)["']/g, '\\text{$1}');

    // sum(i=1)^(n) or sum_(i=1)^(n) -> \sum_{i=1}^{n}
    content = content.replace(/sum\s*\(?([^)^=]+=[^)]+)\)?\s*\^\s*\(?([^)]+)\)?/g, '\\sum_{$1}^{$2}');
    content = content.replace(/sum_([^\^]+)\^([^\s\$]+)/g, '\\sum_{$1}^{$2}');
    content = content.replace(/sum\b/g, '\\sum');

    // Symbols & Operators
    content = content.replace(/dif\b/g, '\\mathrm{d}');
    content = content.replace(/->/g, '\\rightarrow');
    content = content.replace(/=>/g, '\\Rightarrow');
    content = content.replace(/<-/g, '\\leftarrow');
    content = content.replace(/<=/g, '\\Leftarrow');

    return `$${content}$`;
  });

  // Headings: = Heading 1, == Heading 2, === Heading 3
  res = res.replace(/^=====\s+(.+)$/gm, '<h5 style="font-size: 1.0em; color: #2d6a4f; margin-top: 1.0em; margin-bottom: 0.3em; font-weight: 600;">$1</h5>');
  res = res.replace(/^====\s+(.+)$/gm, '<h4 style="font-size: 1.05em; color: #2d6a4f; margin-top: 1.1em; margin-bottom: 0.3em; font-weight: 600;">$1</h4>');
  res = res.replace(/^===\s+(.+)$/gm, '<h3 style="font-size: 1.15em; color: #2d6a4f; margin-top: 1.2em; margin-bottom: 0.4em; font-weight: 600;">$1</h3>');
  res = res.replace(/^==\s+(.+)$/gm, '<h2 style="font-size: 1.35em; color: #2d6a4f; margin-top: 1.4em; margin-bottom: 0.5em; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 4px; font-weight: 700;">$1</h2>');
  res = res.replace(/^=\s+(.+)$/gm, '<div class="doc-page-break"></div><h1 class="paper-sec-title" style="font-size: 1.7em; color: #1b4332; margin-top: 1.5em; margin-bottom: 0.6em; font-weight: 800; letter-spacing: -0.02em;">$1</h1>');

  // Bold *text*
  res = res.replace(/\*([^\*\n]+)\*/g, '<strong>$1</strong>');

  // Italic _text_
  res = res.replace(/_([^_\n]+)_/g, '<em>$1</em>');

  // Code `code`
  res = res.replace(/`([^`\n]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-family: \'JetBrains Mono\', monospace; font-size: 0.9em; color: #0f766e;">$1</code>');

  // Lists: - Item or + Item or 1. Item
  res = res.replace(/^-\s+(.+)$/gm, '<li style="margin-bottom: 4px;">$1</li>');
  res = res.replace(/(<li style="margin-bottom: 4px;">.*<\/li>\n?)+/g, '<ul style="margin: 8px 0; padding-left: 24px;">$&</ul>');

  res = res.replace(/^[\+\d\.]+\s+(.+)$/gm, '<li style="margin-bottom: 4px;">$1</li>');

  // Line break \
  res = res.replace(/\\$/gm, '<br />');

  // Clean up remaining unparsed #function syntax lines that weren't caught
  res = res.replace(/#(?:[a-zA-Z0-9_.]+)\s*(?:\([^)]*\)|\[[^\]]*\])?/g, '');

  // Split into paragraphs
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
        b.startsWith('<span')
      ) {
        return b;
      }
      return `<p style="margin: 0 0 10px 0; line-height: 1.65; text-align: justify;">${b}</p>`;
    });

  return blocks.join('\n');
}
