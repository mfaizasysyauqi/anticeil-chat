/**
 * Anticeil Client-Side LaTeX & Academic Paper Compiler.
 * Translates LaTeX AST & macros into academic-grade HTML with KaTeX math and IEEE formatting.
 */

interface LatexMeta {
  title: string;
  author: string;
  date: string;
  journal: string;
  abstract: string;
  keywords: string[];
}

/**
 * Strips comments (% ...) while preserving escaped percent signs (\\%)
 */
function stripLatexComments(input: string): string {
  return input
    .split('\n')
    .map((line) => {
      let inEscape = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '\\') {
          inEscape = !inEscape;
          continue;
        }
        if (line[i] === '%' && !inEscape) {
          return line.substring(0, i);
        }
        inEscape = false;
      }
      return line;
    })
    .join('\n');
}

/**
 * Extracts content between matching curly braces: \command{...}
 */
function extractBraceContent(str: string, startIndex: number): { content: string; endIndex: number } | null {
  let openIdx = startIndex;
  while (openIdx < str.length && /\s/.test(str[openIdx])) openIdx++;
  if (openIdx >= str.length || str[openIdx] !== '{') return null;

  let depth = 1;
  for (let i = openIdx + 1; i < str.length; i++) {
    if (str[i] === '\\') {
      i++; // skip escaped char
      continue;
    }
    if (str[i] === '{') depth++;
    if (str[i] === '}') {
      depth--;
      if (depth === 0) {
        return { content: str.substring(openIdx + 1, i), endIndex: i };
      }
    }
  }
  return null; // Return null if matching closing brace is not found
}

/**
 * Parses LaTeX commands with one argument: \command{arg} -> replacement
 */
function replaceLatexMacro(text: string, macroName: string, transform: (arg: string) => string): string {
  let current = text;
  let iterations = 0;
  const maxIterations = 5;
  const target = '\\' + macroName;

  while (iterations < maxIterations) {
    let result = '';
    let cursor = 0;
    let replacedAny = false;

    while (cursor < current.length) {
      const found = current.indexOf(target, cursor);
      if (found === -1) {
        result += current.substring(cursor);
        break;
      }

      // Word boundary check: ensure macroName is not a prefix of a longer identifier
      const charAfter = current[found + target.length];
      if (charAfter && /[a-zA-Z]/.test(charAfter)) {
        result += current.substring(cursor, found + target.length);
        cursor = found + target.length;
        continue;
      }

      const brace = extractBraceContent(current, found + target.length);
      if (brace) {
        result += current.substring(cursor, found);
        result += transform(brace.content);
        cursor = brace.endIndex + 1;
        replacedAny = true;
      } else {
        result += current.substring(cursor, found + target.length);
        cursor = found + target.length;
      }
    }

    current = result;
    if (!replacedAny || !current.includes(target)) break;
    iterations++;
  }

  return current;
}

/**
 * Strips LaTeX command and all its balanced curly-brace arguments: \cmd{arg1}{arg2}...
 */
function stripLatexCommandWithBraces(text: string, cmd: string, argCount = 1): string {
  let result = '';
  let cursor = 0;
  const target = '\\' + cmd;

  while (cursor < text.length) {
    const found = text.indexOf(target, cursor);
    if (found === -1) {
      result += text.substring(cursor);
      break;
    }

    result += text.substring(cursor, found);
    let nextPos = found + target.length;
    let strippedAllArgs = true;

    // Skip optional argument like [11pt,...]
    while (nextPos < text.length && /\s/.test(text[nextPos])) nextPos++;
    if (text[nextPos] === '[') {
      const closeBracket = text.indexOf(']', nextPos);
      if (closeBracket !== -1) nextPos = closeBracket + 1;
    }

    for (let a = 0; a < argCount; a++) {
      while (nextPos < text.length && /\s/.test(text[nextPos])) nextPos++;
      if (text[nextPos] === '{') {
        const brace = extractBraceContent(text, nextPos);
        if (brace) {
          nextPos = brace.endIndex + 1;
        } else {
          strippedAllArgs = false;
          break;
        }
      } else {
        strippedAllArgs = false;
        break;
      }
    }

    if (strippedAllArgs) {
      cursor = nextPos;
    } else {
      result += target;
      cursor = found + target.length;
    }
  }
  return result;
}

/**
 * Roman numerals for section headers (IEEE style)
 */
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
const ALPHA_CHARS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

/**
 * Default color palette map for LaTeX documents
 */
const DEFAULT_LATEX_COLORS: Record<string, string> = {
  primary: '#1d4ed8',
  secondary: '#0284c7',
  accent: '#d97706',
  dark: '#0f172a',
  light: '#f8fafc',
  muted: '#64748b',
  slate: '#475569',
  zinc: '#52525b',
  primaryblue: '#1d4ed8',
  secondaryblue: '#0284c7',
  accentgold: '#d97706',
  accentblue: '#2563eb',
  darkgray: '#475569',
  lightgray: '#f8fafc',
  navy: '#0f172a',
  teal: '#0d9488',
  emerald: '#059669',
  ruby: '#dc2626',
  black: '#000000',
  white: '#ffffff',
  gray: '#6b7280',
  red: '#ef4444',
  green: '#10b981',
  blue: '#3b82f6',
  yellow: '#eab308',
  cyan: '#06b6d4',
  magenta: '#d946ef',
  purple: '#9333ea',
  violet: '#7c3aed',
  indigo: '#4f46e5',
  amber: '#d97706',
  rose: '#e11d48',
};

/**
 * Resolves LaTeX font size, style, and color commands grouped in curly braces:
 * e.g. {\Huge \bfseries \color{primaryblue} TITLE} or {\Large Subtitle} or {\small description}
 */
function replaceFormattingGroups(text: string, resolveColorFn: (c: string) => string): string {
  let result = '';
  let cursor = 0;

  const FORMAT_CMD_REGEX = /^\\(Huge|huge|LARGE|Large|large|normalsize|small|footnotesize|scriptsize|tiny|bfseries|bf|textbf|itshape|it|textit|emph|scshape|textsc|ttfamily|texttt|sffamily|textsf|underline|color|normalfont|centering)\b/i;

  while (cursor < text.length) {
    const openIdx = text.indexOf('{', cursor);
    if (openIdx === -1) {
      result += text.substring(cursor);
      break;
    }

    const afterOpen = text.substring(openIdx + 1).trimStart();
    if (!FORMAT_CMD_REGEX.test(afterOpen)) {
      result += text.substring(cursor, openIdx + 1);
      cursor = openIdx + 1;
      continue;
    }

    const brace = extractBraceContent(text, openIdx);
    if (!brace) {
      result += text.substring(cursor, openIdx + 1);
      cursor = openIdx + 1;
      continue;
    }

    // Check if preceding text ends with formatting macros like \textbf, \textit, \emph, \underline, etc.
    let preceding = text.substring(cursor, openIdx);
    let prefixFontStyle = '';
    const MACRO_PREFIX_REGEX = /(?:^|[^\\])(\\(?:textbf|textit|emph|underline|textsc|ttfamily|texttt|sffamily|textsf|textsl|textup|bfseries|itshape)\b\s*)+$/i;
    const prefixMatch = preceding.match(MACRO_PREFIX_REGEX);
    if (prefixMatch) {
      const matchedCmds = prefixMatch[0];
      if (/\\textbf\b|\\bfseries\b/i.test(matchedCmds)) prefixFontStyle += 'font-weight: 700; ';
      if (/\\textit\b|\\emph\b|\\itshape\b|\\textsl\b/i.test(matchedCmds)) prefixFontStyle += 'font-style: italic; ';
      if (/\\underline\b/i.test(matchedCmds)) prefixFontStyle += 'text-decoration: underline; ';
      if (/\\textsc\b/i.test(matchedCmds)) prefixFontStyle += 'font-variant: small-caps; ';
      if (/\\texttt\b|\\ttfamily\b/i.test(matchedCmds)) prefixFontStyle += "font-family: 'JetBrains Mono', monospace; ";
      if (/\\textsf\b|\\sffamily\b/i.test(matchedCmds)) prefixFontStyle += "font-family: 'Inter', system-ui, sans-serif; ";

      const cutLen = prefixMatch[0].startsWith('\\') ? prefixMatch[0].length : prefixMatch[0].length - 1;
      preceding = preceding.substring(0, preceding.length - cutLen);
    }

    result += preceding;
    let inner = brace.content;

    let fontSize = '';
    const sizeM = inner.match(/\\(Huge|huge|LARGE|Large|large|normalsize|small|footnotesize|scriptsize|tiny)\b/);
    if (sizeM) {
      const s = sizeM[1];
      if (s === 'Huge') fontSize = 'font-size: 26px; line-height: 1.25; font-weight: 700;';
      else if (s === 'huge') fontSize = 'font-size: 22px; line-height: 1.3; font-weight: 700;';
      else if (s === 'LARGE') fontSize = 'font-size: 19px; line-height: 1.35; font-weight: 650;';
      else if (s === 'Large') fontSize = 'font-size: 17px; line-height: 1.4; font-weight: 600;';
      else if (s === 'large') fontSize = 'font-size: 15px; line-height: 1.45; font-weight: 550;';
      else if (s === 'small') fontSize = 'font-size: 12.5px; line-height: 1.45; opacity: 0.9;';
      else if (s === 'footnotesize') fontSize = 'font-size: 11px; line-height: 1.4; opacity: 0.85;';
      else if (s === 'scriptsize' || s === 'tiny') fontSize = 'font-size: 10px; line-height: 1.35; opacity: 0.8;';
      inner = inner.replace(sizeM[0], '');
    }

    let fontStyle = prefixFontStyle;
    const styleM = inner.match(/\\(bfseries|bf|textbf|itshape|it|textit|emph|scshape|textsc|ttfamily|texttt|sffamily|textsf|underline)\b/i);
    if (styleM) {
      const st = styleM[1].toLowerCase();
      if (st === 'bfseries' || st === 'bf' || st === 'textbf') fontStyle += 'font-weight: 700; ';
      if (st === 'itshape' || st === 'it' || st === 'textit' || st === 'emph') fontStyle += 'font-style: italic; ';
      if (st === 'scshape' || st === 'textsc') fontStyle += 'font-variant: small-caps; ';
      if (st === 'ttfamily' || st === 'texttt') fontStyle += "font-family: 'JetBrains Mono', monospace; ";
      if (st === 'sffamily' || st === 'textsf') fontStyle += "font-family: 'Inter', system-ui, sans-serif; ";
      if (st === 'underline') fontStyle += 'text-decoration: underline; ';
      inner = inner.replace(styleM[0], '');
    }

    let colorStyle = '';
    const colorM = inner.match(/\\color\{([^}]+)\}/);
    if (colorM) {
      colorStyle = `color: ${resolveColorFn(colorM[1])};`;
      inner = inner.replace(colorM[0], '');
    }

    // Resolve any nested macros inside inner
    inner = replaceLatexMacro(inner, 'textbf', (arg) => `<strong>${arg}</strong>`);
    inner = replaceLatexMacro(inner, 'textit', (arg) => `<em>${arg}</em>`);
    inner = replaceLatexMacro(inner, 'emph', (arg) => `<em>${arg}</em>`);
    inner = replaceLatexMacro(inner, 'underline', (arg) => `<u>${arg}</u>`);
    inner = replaceLatexMacro(inner, 'textsc', (arg) => `<span style="font-variant: small-caps;">${arg}</span>`);
    inner = replaceLatexMacro(inner, 'texttt', (arg) => `<code>${arg}</code>`);

    inner = inner
      .replace(/\\(bfseries|bf|textbf)\b/gi, () => { fontStyle += 'font-weight: 700; '; return ''; })
      .replace(/\\(itshape|it|textit|emph)\b/gi, () => { fontStyle += 'font-style: italic; '; return ''; })
      .replace(/\\normalfont\b/gi, '')
      .replace(/\\centering\b/gi, '')
      .trim();

    result += `<div class="paper-formatted-block" style="${fontSize} ${fontStyle} ${colorStyle} margin: 4px 0; text-align: inherit;">${inner}</div>`;
    cursor = brace.endIndex + 1;
  }

  return result;
}

/**
 * Parses consecutive LaTeX font sizing, color, and style commands into CSS and clean remaining content.
 * Handles patterns like: \Huge\color{primary} Dokumen Riwayat Pendidikan ...
 * or \Large\color{darkgray} Ir. H. Joko Widodo ...
 * or \small\textit{...}
 */
function parseFormattingCommands(
  segment: string,
  resolveColorFn: (c: string) => string
): { style: string; cleanText: string } | null {
  let s = segment.trim();
  let hasFormat = false;
  let fontSize = '';
  let fontWeight = '';
  let fontStyle = '';
  let fontVariant = '';
  let fontFamily = '';
  let textDecoration = '';
  let color = '';

  let changed = true;
  while (changed) {
    changed = false;

    // Match size: \Huge, \huge, \LARGE, \Large, \large, \normalsize, \small, \footnotesize, \scriptsize, \tiny
    const sizeM = s.match(/^\\(Huge|huge|LARGE|Large|large|normalsize|small|footnotesize|scriptsize|tiny)\b/i);
    if (sizeM) {
      hasFormat = true;
      changed = true;
      const sz = sizeM[1];
      const szLower = sz.toLowerCase();
      if (sz === 'Huge') { fontSize = 'font-size: 26px; line-height: 1.25;'; fontWeight = 'font-weight: 700;'; }
      else if (szLower === 'huge') { fontSize = 'font-size: 22px; line-height: 1.3;'; fontWeight = 'font-weight: 700;'; }
      else if (sz === 'LARGE') { fontSize = 'font-size: 19px; line-height: 1.35;'; fontWeight = 'font-weight: 650;'; }
      else if (sz === 'Large') { fontSize = 'font-size: 17px; line-height: 1.4;'; fontWeight = 'font-weight: 600;'; }
      else if (szLower === 'large') { fontSize = 'font-size: 15px; line-height: 1.45;'; fontWeight = 'font-weight: 550;'; }
      else if (szLower === 'small') { fontSize = 'font-size: 12.5px; line-height: 1.45; opacity: 0.9;'; }
      else if (szLower === 'footnotesize') { fontSize = 'font-size: 11px; line-height: 1.4; opacity: 0.85;'; }
      else if (szLower === 'scriptsize' || szLower === 'tiny') { fontSize = 'font-size: 10px; line-height: 1.35; opacity: 0.8;'; }
      s = s.substring(sizeM[0].length).trimStart();
      continue;
    }

    // Match color: \color{name}
    const colorM = s.match(/^\\color\s*\{([^}]+)\}/i);
    if (colorM) {
      hasFormat = true;
      changed = true;
      color = `color: ${resolveColorFn(colorM[1])};`;
      s = s.substring(colorM[0].length).trimStart();
      continue;
    }

    // Match style commands with braces: \textbf{...}, \textit{...}, etc.
    const bracedM = s.match(/^\\(textbf|textit|emph|underline|textsc|texttt|textsf)\s*\{/i);
    if (bracedM) {
      const bContent = extractBraceContent(s, bracedM[0].length - 1);
      if (bContent) {
        hasFormat = true;
        changed = true;
        const cmd = bracedM[1].toLowerCase();
        if (cmd === 'textbf') fontWeight = 'font-weight: 700;';
        if (cmd === 'textit' || cmd === 'emph') fontStyle = 'font-style: italic;';
        if (cmd === 'underline') textDecoration = 'text-decoration: underline;';
        if (cmd === 'textsc') fontVariant = 'font-variant: small-caps;';
        if (cmd === 'texttt') fontFamily = "font-family: 'JetBrains Mono', monospace;";
        if (cmd === 'textsf') fontFamily = "font-family: 'Inter', system-ui, sans-serif;";
        s = bContent.content + s.substring(bContent.endIndex + 1);
        continue;
      }
    }

    // Match style switches: \bfseries, \bf, \textbf, \itshape, \it, \textit, \emph, \scshape, \textsc, \ttfamily, \texttt, \sffamily, \textsf, \underline
    const styleM = s.match(/^\\(bfseries|bf|textbf|itshape|it|textit|emph|scshape|textsc|ttfamily|texttt|sffamily|textsf|underline)\b/i);
    if (styleM) {
      hasFormat = true;
      changed = true;
      const st = styleM[1].toLowerCase();
      if (st === 'bfseries' || st === 'bf' || st === 'textbf') fontWeight = 'font-weight: 700;';
      if (st === 'itshape' || st === 'it' || st === 'textit' || st === 'emph') fontStyle = 'font-style: italic;';
      if (st === 'scshape' || st === 'textsc') fontVariant = 'font-variant: small-caps;';
      if (st === 'ttfamily' || st === 'texttt') fontFamily = "font-family: 'JetBrains Mono', monospace;";
      if (st === 'sffamily' || st === 'textsf') fontFamily = "font-family: 'Inter', system-ui, sans-serif;";
      if (st === 'underline') textDecoration = 'text-decoration: underline;';
      s = s.substring(styleM[0].length).trimStart();
      continue;
    }

    // Match layout keywords: \centering, \normalfont, \noindent, \raggedright, \raggedleft
    const layoutM = s.match(/^\\(centering|normalfont|noindent|raggedright|raggedleft)\b/i);
    if (layoutM) {
      changed = true;
      s = s.substring(layoutM[0].length).trimStart();
      continue;
    }
  }

  if (!hasFormat || !s) return null;

  const styleStr = [fontSize, fontWeight, fontStyle, fontVariant, fontFamily, textDecoration, color].filter(Boolean).join(' ');
  return { style: styleStr, cleanText: s };
}

/**
 * Replaces standalone LaTeX font size and color switches that are NOT enclosed in curly braces.
 * Example: \Huge\color{primary} Title \\[0.3em] \Large\color{darkgray} Subtitle
 */
function replaceStandaloneFormatting(text: string, resolveColorFn: (c: string) => string): string {
  return text.replace(
    /(?:^|\n|<br\s*\/?>|<\/div>)\s*(\\(?:Huge|huge|LARGE|Large|large|normalsize|small|footnotesize|scriptsize|tiny|bfseries|bf|textbf|itshape|it|textit|emph|scshape|textsc|ttfamily|texttt|sffamily|textsf|underline|color\s*\{[^}]+\}|centering)\b(?:[^\n<]|<(?!\/?[a-z]))+)(?=(?:\\\\|<br\s*\/?>|<\/div>|\n|$))/gi,
    (fullMatch, cmdAndContent) => {
      const parsed = parseFormattingCommands(cmdAndContent, resolveColorFn);
      if (parsed) {
        return `\n<div class="paper-formatted-block" style="${parsed.style} margin: 4px 0; text-align: inherit;">${parsed.cleanText}</div>`;
      }
      return fullMatch;
    }
  );
}

/**
 * Comprehensive inline LaTeX & Markdown renderer.
 * Resolves text formatting, macros, colors, math symbols, accents, and escapes cleanly.
 */
function renderLatexInline(
  raw: string,
  resolveColorFn: (c: string) => string = (c) => DEFAULT_LATEX_COLORS[c.toLowerCase()] || c || '#1e293b'
): string {
  if (!raw) return '';
  let text = raw;

  // 1. Markdown bold & italic
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // 2. Colors: \textcolor, \colorbox, \fcolorbox
  text = text.replace(/\\fcolorbox\s*\{([^}]+)\}\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, (_m, frame, bg, txt) => {
    return `<span style="border: 1px solid ${resolveColorFn(frame)}; background-color: ${resolveColorFn(bg)}; padding: 2px 6px; border-radius: 3px;">${txt}</span>`;
  });
  text = text.replace(/\\textcolor\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, (_m, c, txt) => {
    return `<span style="color: ${resolveColorFn(c)};">${txt}</span>`;
  });
  text = text.replace(/\\colorbox\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, (_m, c, txt) => {
    return `<span style="background-color: ${resolveColorFn(c)}; padding: 2px 6px; border-radius: 3px;">${txt}</span>`;
  });

  // 3. LaTeX formatting macros
  text = replaceLatexMacro(text, 'textbf', (arg) => `<strong>${arg}</strong>`);
  text = replaceLatexMacro(text, 'textit', (arg) => `<em>${arg}</em>`);
  text = replaceLatexMacro(text, 'emph', (arg) => `<em>${arg}</em>`);
  text = replaceLatexMacro(text, 'underline', (arg) => `<u>${arg}</u>`);
  text = replaceLatexMacro(text, 'textsc', (arg) => `<span style="font-variant: small-caps;">${arg}</span>`);
  text = replaceLatexMacro(text, 'texttt', (arg) => `<code>${arg}</code>`);
  text = replaceLatexMacro(text, 'textsf', (arg) => `<span style="font-family: 'Inter', system-ui, sans-serif;">${arg}</span>`);
  text = replaceLatexMacro(text, 'textsl', (arg) => `<em>${arg}</em>`);
  text = replaceLatexMacro(text, 'textup', (arg) => `<span style="font-style: normal;">${arg}</span>`);
  text = replaceLatexMacro(text, 'textsuperscript', (arg) => `<sup>${arg}</sup>`);
  text = replaceLatexMacro(text, 'textsubscript', (arg) => `<sub>${arg}</sub>`);
  text = replaceLatexMacro(text, 'sout', (arg) => `<del>${arg}</del>`);
  text = replaceLatexMacro(text, 'st', (arg) => `<del>${arg}</del>`);
  text = replaceLatexMacro(text, 'mbox', (arg) => `<span style="white-space: nowrap;">${arg}</span>`);
  text = replaceLatexMacro(text, 'fbox', (arg) => `<span style="border: 1px solid currentColor; padding: 2px 6px; border-radius: 2px;">${arg}</span>`);
  text = replaceLatexMacro(text, 'framebox', (arg) => `<span style="border: 1px solid currentColor; padding: 2px 6px; border-radius: 2px;">${arg}</span>`);

  // 4. Mathematical & Typographical symbols in plain text
  text = text
    .replace(/\$\s*\\bullet\s*\$|\\textbullet\b|\\bullet\b/gi, '•')
    .replace(/\$\s*\\circ\s*\$|\\circ\b/gi, '◦')
    .replace(/\$\s*\\cdot\s*\$|\\cdot\b/gi, '·')
    .replace(/\$\s*\\pm\s*\$|\\pm\b/gi, '±')
    .replace(/\$\s*\\times\s*\$|\\times\b/gi, '×')
    .replace(/\$\s*\\div\s*\$|\\div\b/gi, '÷')
    .replace(/\$\s*\\leq\s*\$|\\leq\b/gi, '≤')
    .replace(/\$\s*\\geq\s*\$|\\geq\b/gi, '≥')
    .replace(/\$\s*\\neq\s*\$|\\neq\b/gi, '≠')
    .replace(/\$\s*\\approx\s*\$|\\approx\b/gi, '≈')
    .replace(/\$\s*\\rightarrow\s*\$|\\rightarrow\b/gi, '→')
    .replace(/\$\s*\\leftarrow\s*\$|\\leftarrow\b/gi, '←')
    .replace(/\$\s*\\Rightarrow\s*\$|\\Rightarrow\b/gi, '⇒')
    .replace(/\$\s*\\Leftarrow\s*\$|\\Leftarrow\b/gi, '⇐')
    .replace(/\$\s*\\leftrightarrow\s*\$|\\leftrightarrow\b/gi, '↔')
    .replace(/\$\s*\\infty\s*\$|\\infty\b/gi, '∞')
    .replace(/\\degree\b|\\textdegree\b/gi, '°')
    .replace(/\\textcelsius\b/gi, '°C')
    .replace(/\\micro\b/gi, 'µ')
    .replace(/\\copyright\b/gi, '©')
    .replace(/\\textregistered\b/gi, '®')
    .replace(/\\texttrademark\b/gi, '™')
    .replace(/\\dots\b|\\ldots\b/gi, '…')
    .replace(/\\quad\b/gi, '&emsp;')
    .replace(/\\qquad\b/gi, '&emsp;&emsp;')
    .replace(/\\enspace\b/gi, '&ensp;')
    .replace(/\\,\b/gi, '&thinsp;')
    .replace(/\\;\b/gi, '&ensp;')
    .replace(/\\:\b/gi, '&thinsp;')
    .replace(/\\hfill\b/gi, '<span style="display: inline-block; width: 1.5em;"></span>')
    .replace(/\\newline\b|\\linebreak\b/gi, '<br/>')
    .replace(/\\\\/g, '<br/>');

  // 5. Accented letters
  text = text
    .replace(/\\'(?:\{([a-zA-Z])\}|([a-zA-Z]))/g, (_m, a, b) => {
      const char = a || b;
      const accents: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' };
      return accents[char] || char;
    })
    .replace(/\\"(?:\{([a-zA-Z])\}|([a-zA-Z]))/g, (_m, a, b) => {
      const char = a || b;
      const accents: Record<string, string> = { a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü', A: 'Ä', E: 'Ë', I: 'Ï', O: 'Ö', U: 'Ü' };
      return accents[char] || char;
    })
    .replace(/\\`(?:\{([a-zA-Z])\}|([a-zA-Z]))/g, (_m, a, b) => {
      const char = a || b;
      const accents: Record<string, string> = { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù', A: 'À', E: 'È', I: 'Ì', O: 'Ò', U: 'Ù' };
      return accents[char] || char;
    })
    .replace(/\\\^(?:\{([a-zA-Z])\}|([a-zA-Z]))/g, (_m, a, b) => {
      const char = a || b;
      const accents: Record<string, string> = { a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û', A: 'Â', E: 'Ê', I: 'Î', O: 'Ô', U: 'Û' };
      return accents[char] || char;
    })
    .replace(/\\c\{([a-zA-Z])\}/g, (_m, char) => (char === 'c' ? 'ç' : char === 'C' ? 'Ç' : char));

  // 6. LaTeX Escapes & Typography
  text = text
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\~/g, '~')
    .replace(/\\backslash\b/g, '\\')
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/``/g, '“')
    .replace(/''/g, '”');

  // 7. Strip leftover font switches and stray macro keywords
  text = text
    .replace(/\\(Huge|huge|LARGE|Large|large|normalsize|small|footnotesize|scriptsize|tiny)\b/gi, '')
    .replace(/\\(bfseries|bf|itshape|it|scshape|ttfamily|sffamily|normalfont|centering|noindent|raggedright|raggedleft)\b/gi, '')
    .replace(/\\(textbf|textit|emph|underline|textsc|texttt|textsf|textsl|textup)\b/gi, '')
    .replace(/\\color\s*\{[^}]*\}/gi, '');

  return text.trim();
}

/**
 * Extracts clean, formatting-free text from LaTeX heading titles before uppercasing or displaying.
 */
function cleanHeadingText(raw: string): string {
  let t = raw.trim();
  t = replaceLatexMacro(t, 'textbf', (a) => a);
  t = replaceLatexMacro(t, 'textit', (a) => a);
  t = replaceLatexMacro(t, 'emph', (a) => a);
  t = replaceLatexMacro(t, 'underline', (a) => a);
  t = replaceLatexMacro(t, 'textsc', (a) => a);
  t = replaceLatexMacro(t, 'texttt', (a) => a);
  t = replaceLatexMacro(t, 'textcolor', (_c) => '');
  t = t.replace(/\\color\s*\{[^}]+\}/gi, '');
  t = t.replace(/\\(Huge|huge|LARGE|Large|large|normalsize|small|footnotesize|tiny|bfseries|bf|itshape|it|scshape|ttfamily|normalfont|centering)\b/gi, '');
  t = t.replace(/\\(textbf|textit|emph|underline|textsc|texttt)\b/gi, '');
  t = t
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/---/g, '—')
    .replace(/--/g, '–');
  return t.trim();
}

/**
 * Helper to render LaTeX text with inline \includegraphics, formatting, and spacing
 */
function renderLatexTextWithImages(
  rawText: string,
  subFiles?: Array<{ name: string; content: string }>,
  resolveColorFn: (c: string) => string = (c) => DEFAULT_LATEX_COLORS[c.toLowerCase()] || c || '#1e293b'
): string {
  if (!rawText) return '';
  let text = rawText;

  // 0. Format \today
  const formattedToday = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  text = text.replace(/\\today\b/gi, formattedToday);

  // 1. Resolve \includegraphics inside title / header text
  text = text.replace(/\\includegraphics(?:\s*\[[^\]]*\])?\s*\{([^}]+)\}/gi, (_m, imgName) => {
    const rawName = imgName.trim();
    const foundSub = subFiles?.find(
      (f) =>
        f.name.toLowerCase() === rawName.toLowerCase() ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.png` ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.jpg` ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.jpeg` ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.webp` ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.svg`
    );
    const imgSrc = foundSub?.content || rawName;
    return `<img src="${imgSrc}" alt="${rawName}" style="max-height: 70px; max-width: 100%; display: block; margin: 4px auto 12px auto; object-fit: contain;" />`;
  });

  // 2. Resolve line breaks with optional vertical spacing like \\[0.3em] or \\[1cm]
  text = text.replace(/\\\\\[([0-9.]+(?:cm|mm|pt|in|em|ex))\]/gi, (_m, val) => {
    return `<br/><div style="height: ${val}; min-height: ${val}; width: 100%;"></div>`;
  });
  text = text.replace(/(?:<br\s*\/?>|\s|^)\[([0-9.]+(?:cm|mm|pt|in|em|ex))\]/gi, (_m, val) => {
    return `<div style="height: ${val}; min-height: ${val}; width: 100%;"></div>`;
  });
  text = text.replace(/\\\\/g, '<br/>');

  // 3. Spacing commands
  text = text
    .replace(/\\vspace\*?\s*\{([^}]+)\}/gi, (_m, val) => `<div style="height: ${val}; min-height: ${val}; width: 100%;"></div>`)
    .replace(/\\hspace\*?\s*\{([^}]+)\}/gi, (_m, val) => `<span style="display: inline-block; width: ${val};"></span>`)
    .replace(/\\centering\b/gi, '');

  // 4. Grouped & Standalone formatting
  text = replaceFormattingGroups(text, resolveColorFn);
  text = replaceStandaloneFormatting(text, resolveColorFn);

  // 5. Run renderLatexInline on remaining content
  text = renderLatexInline(text, resolveColorFn);

  return text.trim();
}

/**
 * Helper to compile LaTeX tabular markup into clean HTML table
 */
function parseLatexTabular(
  raw: string,
  resolveColorFn: (c: string) => string = (c) => DEFAULT_LATEX_COLORS[c.toLowerCase()] || c || '#1e293b'
): string {
  let inner = raw;
  const beginMatch = inner.match(/\\begin\{(?:tabular\*?|tabularx)\}/i);
  if (beginMatch && beginMatch.index !== undefined) {
    let pos = beginMatch.index + beginMatch[0].length;
    while (pos < inner.length && /\s/.test(inner[pos])) pos++;
    if (inner[pos] === '[') {
      const closeB = inner.indexOf(']', pos);
      if (closeB !== -1) pos = closeB + 1;
    }
    while (pos < inner.length && /\s/.test(inner[pos])) pos++;
    if (inner[pos] === '{') {
      const b1 = extractBraceContent(inner, pos);
      if (b1) {
        pos = b1.endIndex + 1;
        while (pos < inner.length && /\s/.test(inner[pos])) pos++;
        if (inner[pos] === '{') {
          const b2 = extractBraceContent(inner, pos);
          if (b2) pos = b2.endIndex + 1;
        }
      }
    }
    inner = inner.substring(pos);
  }

  inner = inner.replace(/\\end\{(?:tabular\*?|tabularx)\}/gi, '');

  // Strip rules, centering & labels
  inner = inner
    .replace(/\\(?:toprule|midrule|bottomrule|hline|cline\{[^}]*\})/gi, '')
    .replace(/\\label\{[^}]*\}/gi, '')
    .replace(/\\centering/gi, '')
    .trim();

  // Split rows on \\, <br/>, or \tabularnewline, including optional spacing arguments like [0.5em] or [2mm]
  const rawRows = inner
    .split(/(?:\\\\|<br\s*\/?>|\\tabularnewline)(?:\s*\[[^\]]*\])?/i)
    .map((r) => r.trim())
    .filter(Boolean);
  if (rawRows.length === 0) return '';

  let tableHtml = '<table class="academic-table">\n';

  rawRows.forEach((row, idx) => {
    // Protect escaped ampersands so cells aren't broken on \&
    const safeRow = row.replace(/\\&/g, '__AMP_ESCAPED__');
    const cells = safeRow.split('&').map((c) => c.trim());
    const isHeader = idx === 0 && (row.includes('\\textbf') || raw.includes('\\toprule'));
    const defaultTag = isHeader ? 'th' : 'td';

    tableHtml += '  <tr>\n';
    cells.forEach((c) => {
      let cellText = c;
      let colspan = 1;
      let cellAlign = '';

      // Check for \multicolumn{n}{align}{content}
      const multiMatch = cellText.match(/\\multicolumn\{(\d+)\}\{([^}]*)\}\{([\s\S]*)\}/);
      if (multiMatch) {
        colspan = parseInt(multiMatch[1], 10) || 1;
        const alignSpec = multiMatch[2];
        if (alignSpec.includes('c')) cellAlign = 'text-align: center;';
        else if (alignSpec.includes('r')) cellAlign = 'text-align: right;';
        else if (alignSpec.includes('l')) cellAlign = 'text-align: left;';
        cellText = multiMatch[3];
      }

      // Check for \multirow{n}{width}{content}
      cellText = cellText.replace(/\\multirow\{[^}]*\}\{[^}]*\}\{([\s\S]*)\}/gi, '$1');

      // Strip rowcolor / columncolor / cellcolor
      cellText = cellText.replace(/\\(?:rowcolor|columncolor|cellcolor)\{[^}]*\}/gi, '');

      // Restore escaped ampersand
      cellText = cellText.replace(/__AMP_ESCAPED__/g, '\\&');

      // Render cell text inline
      cellText = renderLatexInline(cellText, resolveColorFn);

      const tag = isHeader || colspan > 1 ? (isHeader ? 'th' : 'td') : defaultTag;
      const colspanAttr = colspan > 1 ? ` colspan="${colspan}"` : '';
      const styleAttr = cellAlign ? ` style="${cellAlign}"` : '';

      tableHtml += `    <${tag}${colspanAttr}${styleAttr}>${cellText}</${tag}>\n`;
    });
    tableHtml += '  </tr>\n';
  });

  tableHtml += '</table>';
  return tableHtml;
}

/**
 * Compiles LaTeX source text into high-fidelity academic HTML
 */
export function compileLatexToHtml(
  source: string,
  docTitle?: string,
  subFiles?: Array<{ name: string; content: string }>
): string {
  if (!source || !source.trim()) return '';

  const clean = stripLatexComments(source);
  if (!clean.trim()) return '';

  // Extract custom color definitions: \definecolor{name}{model}{spec}
  const colorMap: Record<string, string> = { ...DEFAULT_LATEX_COLORS };
  const defColorRegex = /\\definecolor\{([^}]+)\}\{([^}]+)\}\{([^}]+)\}/gi;
  let dcMatch;
  while ((dcMatch = defColorRegex.exec(clean)) !== null) {
    const cName = dcMatch[1].trim().toLowerCase();
    const cModel = dcMatch[2].trim().toLowerCase();
    const cVal = dcMatch[3].trim();
    if (cModel === 'rgb') {
      const parts = cVal.split(',').map((v) => {
        const num = parseFloat(v.trim());
        return num <= 1 && v.includes('.') ? Math.round(num * 255) : Math.round(num);
      });
      if (parts.length === 3) colorMap[cName] = `rgb(${parts.join(', ')})`;
    } else if (cModel === 'html') {
      colorMap[cName] = cVal.startsWith('#') ? cVal : `#${cVal}`;
    }
  }

  const resolveColor = (c: string): string => {
    const norm = (c || '').trim().toLowerCase();
    if (colorMap[norm]) return colorMap[norm];
    if (/^[a-z]+$/i.test(norm) || /^#[0-9a-f]{3,8}$/i.test(norm) || /^rgb/i.test(norm)) return norm;
    return '#1e293b';
  };

  // Format date for \today macro
  const formattedToday = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Extract Metadata using brace extraction for nested macros
  const meta: LatexMeta = {
    title: docTitle || 'Untitled Paper',
    author: '',
    date: '',
    journal: '',
    abstract: '',
    keywords: [],
  };

  // Title: match strictly \title{...} and NOT \titleformat or \titlespacing
  const titleMatch = clean.match(/\\title\b\s*\{/);
  if (titleMatch && titleMatch.index !== undefined) {
    const titleBrace = extractBraceContent(clean, titleMatch.index + titleMatch[0].length - 1);
    if (titleBrace) {
      meta.title = renderLatexTextWithImages(titleBrace.content, subFiles, resolveColor);
    }
  }

  // Author: match strictly \author{...}
  const authorMatch = clean.match(/\\author\b\s*\{/);
  if (authorMatch && authorMatch.index !== undefined) {
    const authorBrace = extractBraceContent(clean, authorMatch.index + authorMatch[0].length - 1);
    if (authorBrace) {
      let auth = authorBrace.content.trim();
      auth = replaceLatexMacro(auth, 'thanks', (_arg) => '');
      meta.author = renderLatexTextWithImages(auth, subFiles, resolveColor);
    }
  }

  // Date: match strictly \date{...}
  const dateMatch = clean.match(/\\date\b\s*\{/);
  if (dateMatch && dateMatch.index !== undefined) {
    const dateBrace = extractBraceContent(clean, dateMatch.index + dateMatch[0].length - 1);
    if (dateBrace) {
      meta.date = renderLatexTextWithImages(dateBrace.content.trim(), subFiles, resolveColor);
    }
  }

  // Extract body between \begin{document} and \end{document} if present
  let body = clean;
  const docStartIdx = clean.indexOf('\\begin{document}');
  if (docStartIdx !== -1) {
    body = clean.substring(docStartIdx + '\\begin{document}'.length);
  }
  const docEndIdx = body.lastIndexOf('\\end{document}');
  if (docEndIdx !== -1) {
    body = body.substring(0, docEndIdx);
  }

  // Detect whether document uses a dedicated cover page (\begin{titlepage})
  const hasTitlePage = /\\begin\{titlepage\}[\s\S]*?\\end\{titlepage\}/i.test(body);

  // Extract Abstract (support abstract before or inside document)
  const abstractMatch = clean.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/);
  if (abstractMatch) {
    let abs = abstractMatch[1].trim();
    abs = replaceLatexMacro(abs, 'textit', (arg) => `<em>${arg}</em>`);
    abs = replaceLatexMacro(abs, 'textbf', (arg) => `<strong>${arg}</strong>`);
    meta.abstract = abs;
  }

  // Extract Keywords / IEEEkeywords
  const kwMatch = clean.match(/\\begin\{(?:IEEEkeywords|keywords)\}([\s\S]*?)\\end\{(?:IEEEkeywords|keywords)\}/);
  if (kwMatch) {
    meta.keywords = kwMatch[1].split(',').map((k) => k.trim()).filter(Boolean);
  }

  // Support LaTeX pagination control macros
  body = body.replace(/\\thispagestyle\{([^}]+)\}/gi, (_m, style) => {
    return `<div class="doc-pagestyle" data-style="${style.trim().toLowerCase()}"></div>`;
  });
  body = body.replace(/\\pagenumbering\{([^}]+)\}/gi, (_m, style) => {
    return `\n\n<div class="doc-page-numbering" data-numbering="${style.trim().toLowerCase()}"></div>\n\n`;
  });
  body = body.replace(/\\setcounter\s*\{page\}\s*\{([^}]+)\}/gi, (_m, num) => {
    return `\n\n<div class="doc-page-counter" data-page="${num.trim()}"></div>\n\n`;
  });

  // Cleanly strip multi-argument and preamble macros
  body = stripLatexCommandWithBraces(body, 'titleformat', 5);
  body = stripLatexCommandWithBraces(body, 'titlespacing', 4);
  body = stripLatexCommandWithBraces(body, 'geometry', 1);
  body = stripLatexCommandWithBraces(body, 'pagestyle', 1);
  body = stripLatexCommandWithBraces(body, 'thispagestyle', 1);
  body = stripLatexCommandWithBraces(body, 'pagenumbering', 1);
  body = stripLatexCommandWithBraces(body, 'fancyhf', 1);
  body = stripLatexCommandWithBraces(body, 'fancyhead', 1);
  body = stripLatexCommandWithBraces(body, 'fancyfoot', 1);
  body = stripLatexCommandWithBraces(body, 'renewcommand', 2);
  body = stripLatexCommandWithBraces(body, 'setlength', 2);
  body = stripLatexCommandWithBraces(body, 'addtolength', 2);
  body = stripLatexCommandWithBraces(body, 'definecolor', 3);
  body = stripLatexCommandWithBraces(body, 'colorlet', 2);
  body = stripLatexCommandWithBraces(body, 'markboth', 2);
  body = stripLatexCommandWithBraces(body, 'IEEEtitleabstractindextext', 1);
  body = stripLatexCommandWithBraces(body, 'title', 1);
  body = stripLatexCommandWithBraces(body, 'author', 1);
  body = stripLatexCommandWithBraces(body, 'date', 1);
  body = stripLatexCommandWithBraces(body, 'hypersetup', 1);
  body = stripLatexCommandWithBraces(body, 'usepackage', 1);

  // Remove abstract & keywords blocks if still present in body
  body = body.replace(/\\begin\{abstract\}[\s\S]*?\\end\{abstract\}/g, '');
  body = body.replace(/\\begin\{(?:IEEEkeywords|keywords)\}[\s\S]*?\\end\{(?:IEEEkeywords|keywords)\}/g, '');

  // 1. Cover / Titlepage Environment: \begin{titlepage} ... \end{titlepage}
  body = body.replace(/\\begin\{titlepage\}([\s\S]*?)\\end\{titlepage\}/gi, (_m, tpContent) => {
    const renderedTp = renderLatexTextWithImages(tpContent.trim(), subFiles, resolveColor);
    return `\n\n<div class="paper-titlepage">\n${renderedTp}\n</div>\n\n<div class="doc-page-break"></div>\n\n`;
  });

  // 2. Callout / tcolorbox Environment: \begin{tcolorbox}[options] ... \end{tcolorbox}
  body = body.replace(/\\begin\{tcolorbox\}(?:\s*\[([^\]]*)\])?([\s\S]*?)\\end\{tcolorbox\}/gi, (_m, optStr, tContent) => {
    let bg = '#f8fafc';
    let frame = '#1d4ed8';
    let arc = '6px';
    let width = '100%';

    if (optStr) {
      const opts = optStr.split(',');
      for (const opt of opts) {
        const parts = opt.split('=').map((s: string) => s.trim());
        const k = parts[0];
        const v = parts[1];
        if (!k || !v) continue;
        if (k === 'colback') bg = resolveColor(v);
        if (k === 'colframe') frame = resolveColor(v);
        if (k === 'arc') arc = v;
        if (k === 'width') {
          if (v.includes('textwidth') || v.includes('linewidth')) {
            const num = parseFloat(v);
            width = !isNaN(num) ? `${Math.round(num * 100)}%` : '100%';
          } else {
            width = v;
          }
        }
      }
    }

    const renderedBox = renderLatexTextWithImages(tContent.trim(), subFiles, resolveColor);
    return `\n<div class="academic-callout tcolorbox" style="background-color: ${bg}; border: 1.5px solid ${frame}; border-radius: ${arc}; width: ${width}; margin: 16px auto; padding: 14px 18px; box-sizing: border-box; text-align: center;">\n${renderedBox}\n</div>\n`;
  });

  // 2.2 Protect Tables: extract all \begin{table} and \begin{tabular} into placeholders
  // so nested \\, &, and spacing commands are never corrupted by subsequent environment regexes
  const tablePlaceholders: string[] = [];
  let tableCounter = 0;

  body = body.replace(/\\begin\{table\*?\}([\s\S]*?)\\end\{table\*?\}/gi, (_m, tableBody) => {
    tableCounter++;
    let caption = '';
    const capMatch = tableBody.match(/\\caption\s*\{([\s\S]*?)\}/i);
    if (capMatch) {
      const capIdx = tableBody.indexOf('\\caption');
      const capBrace = extractBraceContent(tableBody, capIdx + 8);
      if (capBrace) caption = capBrace.content.trim();
      else caption = capMatch[1].trim();
    }

    const tabularMatch = tableBody.match(/\\begin\{(?:tabular\*?|tabularx)\}[\s\S]*?\\end\{(?:tabular\*?|tabularx)\}/i);
    const tableContent = tabularMatch ? parseLatexTabular(tabularMatch[0], resolveColor) : '';
    const romanNum = ROMAN_NUMERALS[tableCounter - 1] || `${tableCounter}`;

    const html = `\n<div class="academic-table-card">${caption ? `<div class="academic-table-caption"><span class="tab-label">TABLE ${romanNum}:</span> ${caption.toUpperCase()}</div>` : ''}${tableContent}</div>\n`;
    tablePlaceholders.push(html);
    return `\n\n__LATEX_TABLE_PLACEHOLDER_${tablePlaceholders.length - 1}__\n\n`;
  });

  // Standalone \begin{tabular} outside table
  body = body.replace(/\\begin\{(?:tabular\*?|tabularx)\}[\s\S]*?\\end\{(?:tabular\*?|tabularx)\}/gi, (tabularMatch) => {
    const html = `\n<div class="academic-table-card">${parseLatexTabular(tabularMatch, resolveColor)}</div>\n`;
    tablePlaceholders.push(html);
    return `\n\n__LATEX_TABLE_PLACEHOLDER_${tablePlaceholders.length - 1}__\n\n`;
  });

  // 2.1 Multicols Environment: \begin{multicols}{n} ... \end{multicols}
  body = body.replace(/\\begin\{multicols\*?\}\s*\{([^}]+)\}([\s\S]*?)\\end\{multicols\*?\}/gi, (_m, cols, mContent) => {
    return `\n<div class="paper-multicol" style="columns: ${cols.trim()}; column-gap: 24px;">\n${mContent.trim().replace(/\\\\/g, '<br/>')}\n</div>\n`;
  });

  // 3. Center, Flushleft, Flushright environments
  body = body.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/gi, (_m, cContent) => {
    return `\n<div style="text-align: center; width: 100%; margin: 8px 0;">\n${cContent.trim().replace(/\\\\/g, '<br/>')}\n</div>\n`;
  });
  body = body.replace(/\\begin\{flushleft\}([\s\S]*?)\\end\{flushleft\}/gi, (_m, cContent) => {
    return `\n<div style="text-align: left; width: 100%; margin: 8px 0;">\n${cContent.trim().replace(/\\\\/g, '<br/>')}\n</div>\n`;
  });
  body = body.replace(/\\begin\{flushright\}([\s\S]*?)\\end\{flushright\}/gi, (_m, cContent) => {
    return `\n<div style="text-align: right; width: 100%; margin: 8px 0;">\n${cContent.trim().replace(/\\\\/g, '<br/>')}\n</div>\n`;
  });

  // 4. Vertical & horizontal spacing: \vspace*{...}, \vspace{...}, \hspace{...}, \\[0.5cm], [0.5cm]
  body = body.replace(/\\vspace\*?\s*\{([^}]+)\}/gi, (_m, val) => {
    return `<div style="height: ${val}; min-height: ${val}; width: 100%;"></div>`;
  });
  body = body.replace(/\\hspace\*?\s*\{([^}]+)\}/gi, (_m, val) => {
    return `<span style="display: inline-block; width: ${val};"></span>`;
  });
  body = body.replace(/\\\\\[([0-9.]+(?:cm|mm|pt|in|em|ex))\]/gi, (_m, val) => {
    return `<br/><div style="height: ${val}; min-height: ${val}; width: 100%;"></div>`;
  });
  body = body.replace(/(?:<br\s*\/?>|\s|^)\[([0-9.]+(?:cm|mm|pt|in|em|ex))\]/gi, (_m, val) => {
    return `<div style="height: ${val}; min-height: ${val}; width: 100%;"></div>`;
  });

  // 5. Replace grouped font formatting: {\Huge \bfseries \color{blue} ...} & standalone formatting
  body = replaceFormattingGroups(body, resolveColor);
  body = replaceStandaloneFormatting(body, resolveColor);

  // 6. Inline Color & Colorbox macros
  body = body.replace(/\\fcolorbox\s*\{([^}]+)\}\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, (_m, frame, bg, txt) => {
    return `<span style="border: 1px solid ${resolveColor(frame)}; background-color: ${resolveColor(bg)}; padding: 2px 6px; border-radius: 3px;">${txt}</span>`;
  });
  body = body.replace(/\\colorbox\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, (_m, bg, txt) => {
    return `<span style="background-color: ${resolveColor(bg)}; padding: 2px 6px; border-radius: 3px;">${txt}</span>`;
  });
  body = body.replace(/\\textcolor\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, (_m, c, txt) => {
    return `<span style="color: ${resolveColor(c)};">${txt}</span>`;
  });
  body = body.replace(/\\color\s*\{([^}]+)\}\s*([^<]+)/gi, (_m, c, txt) => {
    return `<span style="color: ${resolveColor(c)};">${txt}</span>`;
  });

  // 7. Today macro: \today -> formatted date
  body = body.replace(/\\today\b/gi, formattedToday);

  // 7.1 Spacing & Typographic symbols
  body = body
    .replace(/\\quad\b/gi, '&emsp;')
    .replace(/\\qquad\b/gi, '&emsp;&emsp;')
    .replace(/\\enspace\b/gi, '&ensp;')
    .replace(/\\,\b/gi, '&thinsp;')
    .replace(/\\;\b/gi, '&ensp;')
    .replace(/\\:\b/gi, '&thinsp;')
    .replace(/\\par\b/gi, '\n\n')
    .replace(/\\dots\b|\\ldots\b/gi, '…')
    .replace(/\\copyright\b/gi, '©')
    .replace(/\\textregistered\b/gi, '®')
    .replace(/\\texttrademark\b/gi, '™')
    .replace(/\\eqref\s*\{([^}]+)\}/gi, '($1)')
    .replace(/\\pageref\s*\{([^}]+)\}/gi, '1');

  // 8. Rules: \rule{w}{h} & \hrule
  body = body.replace(/\\rule(?:\s*\[[^\]]*\])?\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, (_m, w, h) => {
    const widthStyle = w.includes('textwidth') || w.includes('linewidth') ? '100%' : w;
    return `<div style="display: block; width: ${widthStyle}; height: ${h}; background-color: currentColor; margin: 12px auto;"></div>`;
  });
  body = body.replace(/\\hrule(?:\s+(?:height|width|depth)\s+[0-9.]+(?:pt|mm|cm|in|em|ex))*/gi, '<hr style="border: none; border-top: 1.5px solid var(--border-subtle, #cbd5e1); margin: 16px 0;" />');
  body = body.replace(/(?:^|\s)height\s+[0-9.]+(?:pt|mm|cm|in|em|ex)(?:\s|$)/gmi, ' ');
  body = body.replace(/(?:^|\s)width\s+[0-9.]+(?:pt|mm|cm|in|em|ex)(?:\s|$)/gmi, ' ');

  // 9. Centering: strip remaining \centering commands
  body = body.replace(/\\centering\b/g, '');

  // Figure Environment & \includegraphics resolution:
  body = body.replace(/\\begin\{figure\*?\}([\s\S]*?)\\end\{figure\*?\}/gi, (_m, figBody) => {
    let caption = '';
    const capMatch = figBody.match(/\\caption\s*\{([\s\S]*?)\}/i);
    if (capMatch) {
      const capIdx = figBody.indexOf('\\caption');
      const capBrace = extractBraceContent(figBody, capIdx + 8);
      if (capBrace) caption = capBrace.content.trim();
      else caption = capMatch[1].trim();
    }

    let imgSrc = '';
    let imgName = '';
    const incMatch = figBody.match(/\\includegraphics(?:\s*\[[^\]]*\])?\s*\{([^}]+)\}/i);
    if (incMatch) {
      imgName = incMatch[1].trim();
      const foundSub = subFiles?.find(
        (f) =>
          f.name.toLowerCase() === imgName.toLowerCase() ||
          f.name.toLowerCase() === `${imgName.toLowerCase()}.png` ||
          f.name.toLowerCase() === `${imgName.toLowerCase()}.jpg` ||
          f.name.toLowerCase() === `${imgName.toLowerCase()}.jpeg` ||
          f.name.toLowerCase() === `${imgName.toLowerCase()}.webp` ||
          f.name.toLowerCase() === `${imgName.toLowerCase()}.svg`
      );
      imgSrc = foundSub?.content || imgName;
    }

    if (!imgSrc) return '';

    return `\n<div class="academic-figure"><img src="${imgSrc}" alt="${caption || imgName}" class="academic-figure-img" />${caption ? `<div class="academic-figure-caption"><span class="fig-label">Fig.</span> ${caption}</div>` : ''}</div>\n`;
  });

  // Standalone \includegraphics outside figure
  body = body.replace(/\\includegraphics(?:\s*\[[^\]]*\])?\s*\{([^}]+)\}/gi, (_m, imgName) => {
    const rawName = imgName.trim();
    const foundSub = subFiles?.find(
      (f) =>
        f.name.toLowerCase() === rawName.toLowerCase() ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.png` ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.jpg` ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.jpeg` ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.webp` ||
        f.name.toLowerCase() === `${rawName.toLowerCase()}.svg`
    );
    const imgSrc = foundSub?.content || rawName;
    return `\n<div class="academic-figure"><img src="${imgSrc}" alt="${rawName}" class="academic-figure-img" /></div>\n`;
  });

  // Strip standalone LaTeX / IEEE structural macros (do NOT strip tableofcontents here)
  body = body
    .replace(/\\maketitle/g, '')
    .replace(/\\IEEEdisplaynontitleabstractindextext/g, '')
    .replace(/\\IEEEpeerreviewmaketitle/g, '')
    .replace(/\\noindent/g, '')
    .replace(/\\centering/g, '')
    .replace(/\\raggedright/g, '')
    .replace(/\\hfill/g, '<span style="display: inline-block; width: 1.5em;"></span>')
    .replace(/\\vfill/g, '<div style="height: 24px; min-height: 16px;"></div>')
    .replace(/\\newpage/g, '\n\n<div class="doc-page-break"></div>\n\n')
    .replace(/\\clearpage/g, '\n\n<div class="doc-page-break"></div>\n\n')
    .replace(/\\pagebreak/g, '\n\n<div class="doc-page-break"></div>\n\n');

  // Strip any leftover orphan brace lines or bracket lines
  body = body.replace(/^\s*[\}\]\)]\s*$/gm, '');

  // Dropcap: \IEEEPARstart{M}{odern} -> <strong class="ieee-dropcap">M</strong>odern
  body = body.replace(/\\IEEEPARstart\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '<strong class="ieee-dropcap">$1</strong>$2');
  body = body.replace(/\\IEEEdropcase\s*\{([^}]+)\}/g, '<strong class="ieee-dropcap">$1</strong>');

  // Quotes: \begin{quote} ... \end{quote}
  body = body.replace(/\\begin\{quote\}([\s\S]*?)\\end\{quote\}/gi, (_m, qBody) => {
    return `\n<blockquote class="paper-quote">${qBody.trim().replace(/\\\\/g, '<br/>')}</blockquote>\n`;
  });

  // Verbatim & Listings (Code Blocks)
  body = body.replace(/\\begin\{(?:verbatim|lstlisting)\}([\s\S]*?)\\end\{(?:verbatim|lstlisting)\}/gi, (_m, code) => {
    return `\n<pre class="paper-code"><code>${code.trim()}</code></pre>\n`;
  });

  // Theorems, Lemmas, Proofs, Definitions
  body = body.replace(/\\begin\{theorem\}([\s\S]*?)\\end\{theorem\}/gi, (_m, thm) => {
    return `\n<div class="academic-callout academic-theorem"><strong>Theorem.</strong> <em>${thm.trim()}</em></div>\n`;
  });
  body = body.replace(/\\begin\{lemma\}([\s\S]*?)\\end\{lemma\}/gi, (_m, lem) => {
    return `\n<div class="academic-callout academic-lemma"><strong>Lemma.</strong> <em>${lem.trim()}</em></div>\n`;
  });
  body = body.replace(/\\begin\{proof\}([\s\S]*?)\\end\{proof\}/gi, (_m, prf) => {
    return `\n<div class="academic-callout academic-proof"><span class="proof-label">Proof.</span> ${prf.trim()} <span class="qed">■</span></div>\n`;
  });
  body = body.replace(/\\begin\{definition\}([\s\S]*?)\\end\{definition\}/gi, (_m, def) => {
    return `\n<div class="academic-callout academic-definition"><strong>Definition.</strong> <em>${def.trim()}</em></div>\n`;
  });

  // Links: \href{url}{text} & \url{url}
  body = body.replace(/\\href\s*\{([^}]+)\}\s*\{([^}]+)\}/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>');
  body = body.replace(/\\url\s*\{([^}]+)\}/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  // Math blocks: \begin{equation} ... \end{equation} -> $$ ... $$
  body = body.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_m, eq) => `\n$$\\begin{aligned}${eq.trim()}\\end{aligned}$$\n`);
  body = body.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_m, eq) => `\n$$\\begin{aligned}${eq.trim()}\\end{aligned}$$\n`);
  body = body.replace(/\\begin\{gather\*?\}([\s\S]*?)\\end\{gather\*?\}/g, (_m, eq) => `\n$$\\begin{gathered}${eq.trim()}\\end{gathered}$$\n`);

  // Section counters
  let secIdx = 0;
  let subSecIdx = 0;
  let subSubSecIdx = 0;

  // Sections: \section{Title} -> numbered IEEE header with default newpage
  body = body.replace(/\\section\*?\s*\{([^}]+)\}/g, (_m, title) => {
    secIdx++;
    subSecIdx = 0;
    subSubSecIdx = 0;
    const num = ROMAN_NUMERALS[secIdx - 1] || `${secIdx}.`;
    const cleanT = cleanHeadingText(title);
    return `\n\n<div class="doc-page-break"></div>\n<h2 class="paper-sec-title"><span class="paper-num">${num}.</span> ${cleanT.toUpperCase()}</h2>\n`;
  });

  // Subsections: \subsection{Title}
  body = body.replace(/\\subsection\*?\s*\{([^}]+)\}/g, (_m, title) => {
    subSecIdx++;
    subSubSecIdx = 0;
    const alpha = ALPHA_CHARS[subSecIdx - 1] || `${subSecIdx}.`;
    const cleanT = cleanHeadingText(title);
    return `\n<h3 class="paper-subsec-title"><span class="paper-num">${alpha}.</span> ${cleanT}</h3>\n`;
  });

  // Subsubsections: \subsubsection{Title}
  body = body.replace(/\\subsubsection\*?\s*\{([^}]+)\}/g, (_m, title) => {
    subSubSecIdx++;
    const cleanT = cleanHeadingText(title);
    return `\n<h4 class="paper-subsubsec-title"><span class="paper-num">${subSubSecIdx})</span> ${cleanT}</h4>\n`;
  });

  // Parse Markdown headers if present (#, ##, ###, ####)
  body = body.replace(/^#\s+(.+)$/gm, (_m, title) => {
    if (!meta.title || meta.title === 'Untitled Paper' || meta.title === docTitle) {
      meta.title = title.trim();
      return '';
    }
    return `\n<h1 class="academic-paper-title">${title.trim()}</h1>\n`;
  });

  body = body.replace(/^##\s+(.+)$/gm, (_m, title) => {
    secIdx++;
    subSecIdx = 0;
    subSubSecIdx = 0;
    return `\n\n<div class="doc-page-break"></div>\n<h2 class="paper-sec-title">${title.trim()}</h2>\n`;
  });

  body = body.replace(/^###\s+(.+)$/gm, (_m, title) => {
    subSecIdx++;
    subSubSecIdx = 0;
    return `\n<h3 class="paper-subsec-title">${title.trim()}</h3>\n`;
  });

  body = body.replace(/^####\s+(.+)$/gm, (_m, title) => {
    subSubSecIdx++;
    return `\n<h4 class="paper-subsubsec-title">${title.trim()}</h4>\n`;
  });

  // Parse Markdown horizontal rules (--- or ***)
  body = body.replace(/^---$/gm, '<hr class="paper-divider" style="border: none; border-top: 1px solid var(--border-subtle, #e2e8f0); margin: 18px 0;"/>');
  body = body.replace(/^\*\*\*$/gm, '<hr class="paper-divider" style="border: none; border-top: 1px solid var(--border-subtle, #e2e8f0); margin: 18px 0;"/>');

  // Basic styling macros & Markdown bold/italic
  body = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  body = body.replace(/\*(.*?)\*/g, '<em>$1</em>');
  body = replaceLatexMacro(body, 'textbf', (arg) => `<strong>${arg}</strong>`);
  body = replaceLatexMacro(body, 'textit', (arg) => `<em>${arg}</em>`);
  body = replaceLatexMacro(body, 'emph', (arg) => `<em>${arg}</em>`);
  body = replaceLatexMacro(body, 'underline', (arg) => `<u>${arg}</u>`);
  body = replaceLatexMacro(body, 'texttt', (arg) => `<code>${arg}</code>`);
  body = replaceLatexMacro(body, 'textsc', (arg) => `<span style="font-variant: small-caps;">${arg}</span>`);
  body = replaceLatexMacro(body, 'textsuperscript', (arg) => `<sup>${arg}</sup>`);
  body = replaceLatexMacro(body, 'textsubscript', (arg) => `<sub>${arg}</sub>`);
  body = replaceLatexMacro(body, 'sout', (arg) => `<del>${arg}</del>`);
  body = replaceLatexMacro(body, 'st', (arg) => `<del>${arg}</del>`);

  // Citations & References: \cite{key} -> [key]
  body = body.replace(/\\cite\{([^}]+)\}/g, (_m, key) => `<span class="paper-cite">[${key}]</span>`);
  body = body.replace(/\\ref\{([^}]+)\}/g, (_m, key) => `<span class="paper-ref">${key}</span>`);
  body = body.replace(/\\label\{([^}]+)\}/g, '');

  // Description lists: \begin{description} ... \end{description} (strips [leftmargin=*] etc.)
  body = body.replace(/\\begin\{description\}(?:\s*\[[^\]]*\])?([\s\S]*?)\\end\{description\}/gi, (_m, inner) => {
    const cleanInner = inner.replace(/^\s*\[[^\]]*\]/, '');
    const items = cleanInner.split(/\\item\b/).filter((it: string) => it.trim());
    let listHtml = '<dl class="paper-description">\n';
    for (const it of items) {
      const bMatch = it.match(/^\s*\[([\s\S]*?)\]([\s\S]*)/);
      if (bMatch) {
        const term = renderLatexInline(bMatch[1].trim(), resolveColor);
        const def = renderLatexInline(bMatch[2].trim(), resolveColor);
        listHtml += `  <div class="paper-desc-row">\n    <dt class="paper-desc-term">${term}</dt>\n    <dd class="paper-desc-def">${def}</dd>\n  </div>\n`;
      } else {
        const def = renderLatexInline(it.trim(), resolveColor);
        listHtml += `  <div class="paper-desc-row">\n    <dd class="paper-desc-def">${def}</dd>\n  </div>\n`;
      }
    }
    listHtml += '</dl>\n';
    return `\n${listHtml}\n`;
  });

  // Itemize: \begin{itemize} ... \end{itemize} (supports \item and \item[Label])
  body = body.replace(/\\begin\{itemize\}(?:\s*\[[^\]]*\])?([\s\S]*?)\\end\{itemize\}/g, (_m, inner) => {
    const cleanInner = inner.replace(/^\s*\[[^\]]*\]/, '');
    const items = cleanInner.split(/\\item\b/).filter((it: string) => it.trim());
    const lis = items.map((it: string) => {
      const bMatch = it.match(/^\s*\[([\s\S]*?)\]([\s\S]*)/);
      if (bMatch) {
        const rawLabel = bMatch[1].trim();
        const rawRest = bMatch[2].trim();
        if (/^(\$\s*\\bullet\s*\$|\\bullet\b|•|-|–|—|\$\s*\\circ\s*\$|\*)$/i.test(rawLabel)) {
          return `  <li>${renderLatexInline(rawRest, resolveColor)}</li>`;
        }
        return `  <li><strong>${renderLatexInline(rawLabel, resolveColor)}</strong> ${renderLatexInline(rawRest, resolveColor)}</li>`;
      }
      return `  <li>${renderLatexInline(it.trim(), resolveColor)}</li>`;
    });
    return `\n<ul class="paper-list">\n${lis.join('\n')}\n</ul>\n`;
  });

  // Enumerate: \begin{enumerate} ... \end{enumerate} (supports \item and \item[Label])
  body = body.replace(/\\begin\{enumerate\}(?:\s*\[[^\]]*\])?([\s\S]*?)\\end\{enumerate\}/g, (_m, inner) => {
    const cleanInner = inner.replace(/^\s*\[[^\]]*\]/, '');
    const items = cleanInner.split(/\\item\b/).filter((it: string) => it.trim());
    const lis = items.map((it: string) => {
      const bMatch = it.match(/^\s*\[([\s\S]*?)\]([\s\S]*)/);
      if (bMatch) {
        const rawLabel = bMatch[1].trim();
        const rawRest = bMatch[2].trim();
        return `  <li><strong>${renderLatexInline(rawLabel, resolveColor)}</strong> ${renderLatexInline(rawRest, resolveColor)}</li>`;
      }
      return `  <li>${renderLatexInline(it.trim(), resolveColor)}</li>`;
    });
    return `\n<ol class="paper-list">\n${lis.join('\n')}\n</ol>\n`;
  });

  // Strip any standalone enumitem brackets like [leftmargin=*]
  body = body.replace(/\[\s*(?:leftmargin|rightmargin|label|topsep|itemsep)\s*=\s*[^\]]*\]/gi, '');

  // Bibliography: \begin{thebibliography} ... \end{thebibliography}
  body = body.replace(/\\begin\{thebibliography\}(?:\{[^}]*\})?([\s\S]*?)\\end\{thebibliography\}/g, (_m, inner) => {
    const items = inner.split('\\bibitem').filter((it: string) => it.trim());
    const refRows = items.map((it: string, idx: number) => {
      const braceMatch = it.match(/^\{([^}]+)\}([\s\S]*)/);
      const text = braceMatch ? braceMatch[2].trim() : it.trim();
      return `<li value="${idx + 1}">${text}</li>`;
    });
    return `
      <div class="paper-references">
        <h2 class="paper-sec-title">REFERENCES</h2>
        <ol class="paper-ref-list">
          ${refRows.join('\n')}
        </ol>
      </div>
    `;
  });

  // Table of Contents / Daftar Isi Generator
  const hasToc = /\\tableofcontents|\[TOC\]|<!--\s*toc\s*-->/i.test(body);
  if (hasToc) {
    const secRegex = /<h([2-4]) class="paper-(sec|subsec|subsubsec)-title">(?:<span class="paper-num">([^<]+)<\/span>\s*)?([^<]+)<\/h[2-4]>/g;
    const tocEntries: Array<{ level: number; num: string; title: string }> = [];
    let match;
    while ((match = secRegex.exec(body)) !== null) {
      const headingLevel = parseInt(match[1], 10) - 1; // h2 -> 1, h3 -> 2, h4 -> 3
      const cleanT = match[4].trim()
        .replace(/\\&/g, '&')
        .replace(/\\%/g, '%')
        .replace(/\\_/g, '_')
        .replace(/\\\$/g, '$')
        .replace(/\\#/g, '#');
      tocEntries.push({
        level: headingLevel,
        num: match[3] ? match[3].trim() : '',
        title: cleanT,
      });
    }

    let tocHtml = '';
    if (tocEntries.length > 0) {
      tocHtml = `\n\n<div class="doc-page-break"></div>\n\n<div class="academic-toc-card">
  <div class="academic-toc-title">DAFTAR ISI / TABLE OF CONTENTS</div>
  <div class="academic-toc-list">
${tocEntries
  .map(
    (e) => `    <div class="academic-toc-item level-${e.level}">
      <span class="toc-num">${e.num}</span>
      <span class="toc-text">${e.title}</span>
      <span class="toc-dots"></span>
      <span class="toc-bullet">${e.level === 1 ? '•' : '–'}</span>
    </div>`
  )
  .join('\n')}
  </div>
</div>\n\n<div class="doc-page-break"></div>\n\n`;
    }
    body = body.replace(/\\tableofcontents|\[TOC\]|<!--\s*toc\s*-->/gi, tocHtml);
  } else {
    // If no TOC tag but document is long or standalone, do not force TOC unless requested
  }

  // Footnotes: \footnote{text} -> <sup class="paper-footnote-ref" title="...">[N]</sup>
  let footnoteCount = 0;
  body = body.replace(/\\footnote\s*\{([^}]+)\}/gi, (_m, fn) => {
    footnoteCount++;
    const escaped = fn.trim().replace(/"/g, '&quot;');
    return `<sup class="paper-footnote-ref" title="${escaped}">[${footnoteCount}]</sup>`;
  });

  // Minipage: \begin{minipage}[pos]{width} ... \end{minipage}
  body = body.replace(/\\begin\{minipage\}(?:\s*\[[^\]]*\])?\s*\{([^}]+)\}([\s\S]*?)\\end\{minipage\}/gi, (_m, w, mContent) => {
    let width = '100%';
    if (w.includes('textwidth') || w.includes('linewidth')) {
      const num = parseFloat(w);
      width = !isNaN(num) ? `${Math.round(num * 100)}%` : '100%';
    } else {
      width = w;
    }
    return `\n<div class="paper-minipage" style="display: inline-block; vertical-align: top; width: ${width};">\n${mContent.trim()}\n</div>\n`;
  });

  // Math blocks: protect $$...$$ and $...$ before text-level rendering
  const mathBlocks: string[] = [];
  body = body.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, (m) => {
    mathBlocks.push(m);
    return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
  });

  // Comprehensive inline rendering and leftover cleanup on body
  body = renderLatexInline(body, resolveColor);

  // Restore protected math blocks
  body = body.replace(/__MATH_BLOCK_(\d+)__/g, (_m, idx) => mathBlocks[parseInt(idx, 10)] || '');

  // Restore protected table placeholders
  body = body.replace(/__LATEX_TABLE_PLACEHOLDER_(\d+)__/g, (_m, idx) => tablePlaceholders[parseInt(idx, 10)] || '');

  // Paragraph processing: double newlines -> <p>
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => {
      const stripped = p.replace(/\\\\/g, '').replace(/%[^\n]*/g, '').trim();
      return stripped.length > 0;
    })
    .map((p) => {
      if (
        p.startsWith('<h') ||
        p.startsWith('<ul') ||
        p.startsWith('<ol') ||
        p.startsWith('<dl') ||
        p.startsWith('<div') ||
        p.startsWith('<hr') ||
        p.startsWith('<table') ||
        p.startsWith('<blockquote') ||
        p.startsWith('<pre') ||
        p.startsWith('<section') ||
        p.startsWith('<figure') ||
        p.startsWith('$$') ||
        p.includes('class="doc-page-break"') ||
        p.includes('class="doc-page-numbering"') ||
        p.includes('class="doc-page-counter"') ||
        p.includes('class="doc-pagestyle"')
      ) {
        return p;
      }
      return `<p class="paper-para">${p.replace(/\\\\/g, '<br/>')}</p>`;
    })
    .join('\n\n');

  // Construct Final Academic Paper Flat HTML (flat elements for proper page splitting)
  const hasExplicitTitle = clean.match(/\\title\b\s*\{/) !== null;
  const headerHtml =
    hasExplicitTitle && !hasTitlePage && meta.title && meta.title !== 'Untitled Paper'
      ? `
    <div class="academic-paper-header">
      <h1 class="academic-paper-title">${meta.title}</h1>
      ${meta.author ? `<div class="academic-paper-author">${meta.author}</div>` : ''}
      ${meta.date ? `<div class="academic-paper-date">${meta.date}</div>` : ''}
    </div>
  `
      : '';

  const abstractHtml = meta.abstract
    ? `
    <div class="academic-paper-abstract-card">
      <div class="academic-paper-abstract-text">
        <span class="abstract-badge">Abstract</span>—${meta.abstract}
      </div>
      ${
        meta.keywords.length > 0
          ? `<div class="academic-paper-keywords"><em>Index Terms</em>—${meta.keywords.join(', ')}.</div>`
          : ''
      }
    </div>
  `
    : '';

  return `
    ${headerHtml}
    ${abstractHtml}
    ${paragraphs}
  `;
}
