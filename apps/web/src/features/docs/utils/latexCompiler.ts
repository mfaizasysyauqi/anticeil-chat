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
  const openIdx = str.indexOf('{', startIndex);
  if (openIdx === -1) return null;

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
  return { content: str.substring(openIdx + 1), endIndex: str.length };
}

/**
 * Parses LaTeX commands with one argument: \command{arg} -> replacement
 */
function replaceLatexMacro(text: string, macroName: string, transform: (arg: string) => string): string {
  let result = '';
  let cursor = 0;
  const target = '\\' + macroName;

  while (cursor < text.length) {
    const found = text.indexOf(target, cursor);
    if (found === -1) {
      result += text.substring(cursor);
      break;
    }

    result += text.substring(cursor, found);
    const brace = extractBraceContent(text, found + target.length);
    if (brace) {
      result += transform(brace.content);
      cursor = brace.endIndex + 1;
    } else {
      result += target;
      cursor = found + target.length;
    }
  }
  return result;
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
 * Helper to render LaTeX text with inline \includegraphics, formatting, and spacing
 */
function renderLatexTextWithImages(
  rawText: string,
  subFiles?: Array<{ name: string; content: string }>
): string {
  if (!rawText) return '';
  let text = rawText;

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

  // 2. Strip spacing and layout commands
  text = text
    .replace(/\\centering/g, '')
    .replace(/\\vspace\*?\s*\{[^}]*\}/g, '')
    .replace(/\\hspace\*?\s*\{[^}]*\}/g, '')
    .replace(/\\\\/g, '<br/>');

  // 3. Formatting macros
  text = replaceLatexMacro(text, 'textbf', (arg) => `<strong>${arg}</strong>`);
  text = replaceLatexMacro(text, 'textit', (arg) => `<em>${arg}</em>`);
  text = replaceLatexMacro(text, 'emph', (arg) => `<em>${arg}</em>`);
  text = replaceLatexMacro(text, 'textsc', (arg) => `<span style="font-variant: small-caps;">${arg}</span>`);

  return text.trim();
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

  // Extract Metadata using brace extraction for nested macros
  const meta: LatexMeta = {
    title: docTitle || 'Untitled Paper',
    author: '',
    date: '',
    journal: '',
    abstract: '',
    keywords: [],
  };

  // Title (support logo, centering, vspace, and formatting inside \title)
  const titleIdx = clean.indexOf('\\title');
  if (titleIdx !== -1) {
    const titleBrace = extractBraceContent(clean, titleIdx + 6);
    if (titleBrace) {
      meta.title = renderLatexTextWithImages(titleBrace.content, subFiles);
    }
  }

  // Author
  const authorIdx = clean.indexOf('\\author');
  if (authorIdx !== -1) {
    const authorBrace = extractBraceContent(clean, authorIdx + 7);
    if (authorBrace) {
      let auth = authorBrace.content.trim();
      auth = replaceLatexMacro(auth, 'thanks', (_arg) => '');
      meta.author = renderLatexTextWithImages(auth, subFiles);
    }
  }

  // Date
  const dateIdx = clean.indexOf('\\date');
  if (dateIdx !== -1) {
    const dateBrace = extractBraceContent(clean, dateIdx + 5);
    if (dateBrace) meta.date = dateBrace.content.trim();
  }

  // Extract body between \begin{document} and \end{document} if present
  let body = clean;
  const docStartIdx = clean.indexOf('\\begin{document}');
  if (docStartIdx !== -1) {
    body = clean.substring(docStartIdx + '\\begin{document}'.length);
  }
  const docEndIdx = body.indexOf('\\end{document}');
  if (docEndIdx !== -1) {
    body = body.substring(0, docEndIdx);
  }

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

  // Cleanly strip multi-argument and nested macros
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

/**
 * Helper to compile LaTeX tabular markup into clean HTML table
 */
function parseLatexTabular(raw: string): string {
  let inner = raw.replace(/\\begin\{tabular\}\s*\{[^}]*\}/i, '').replace(/\\end\{tabular\}/i, '');

  // Strip rules, centering & labels
  inner = inner
    .replace(/\\(?:toprule|midrule|bottomrule|hline)/gi, '')
    .replace(/\\label\{[^}]*\}/gi, '')
    .replace(/\\centering/gi, '')
    .trim();

  const rawRows = inner.split('\\\\').map((r) => r.trim()).filter(Boolean);
  if (rawRows.length === 0) return '';

  let tableHtml = '<table class="academic-table">\n';

  rawRows.forEach((row, idx) => {
    const cells = row.split('&').map((c) => c.trim());
    const isHeader = idx === 0;
    const tag = isHeader ? 'th' : 'td';

    tableHtml += '  <tr>\n';
    cells.forEach((c) => {
      let cellText = c;
      cellText = replaceLatexMacro(cellText, 'textbf', (arg) => `<strong>${arg}</strong>`);
      cellText = replaceLatexMacro(cellText, 'textit', (arg) => `<em>${arg}</em>`);
      tableHtml += `    <${tag}>${cellText}</${tag}>\n`;
    });
    tableHtml += '  </tr>\n';
  });

  tableHtml += '</table>';
  return tableHtml;
}

  // Strip standalone LaTeX / IEEE structural macros
  body = body
    .replace(/\\maketitle/g, '')
    .replace(/\\IEEEdisplaynontitleabstractindextext/g, '')
    .replace(/\\IEEEpeerreviewmaketitle/g, '')
    .replace(/\\tableofcontents/g, '')
    .replace(/\\noindent/g, '')
    .replace(/\\centering/g, '')
    .replace(/\\raggedright/g, '')
    .replace(/\\hfill/g, '')
    .replace(/\\vfill/g, '')
    .replace(/\\newpage/g, '<hr style="page-break-after: always; border: none;" />')
    .replace(/\\clearpage/g, '<hr style="page-break-after: always; border: none;" />');

  // Strip any leftover orphan brace lines or bracket lines
  body = body.replace(/^\s*[\}\]\)]\s*$/gm, '');

  // Tables: \begin{table}[htbp] ... \end{table}
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

    const tabularMatch = tableBody.match(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/i);
    const tableContent = tabularMatch ? parseLatexTabular(tabularMatch[0]) : '';
    const romanNum = ROMAN_NUMERALS[tableCounter - 1] || `${tableCounter}`;

    return `\n<div class="academic-table-card">${caption ? `<div class="academic-table-caption"><span class="tab-label">TABLE ${romanNum}:</span> ${caption.toUpperCase()}</div>` : ''}${tableContent}</div>\n`;
  });

  // Standalone \begin{tabular} outside table
  body = body.replace(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/gi, (tabularMatch) => {
    return `\n<div class="academic-table-card">${parseLatexTabular(tabularMatch)}</div>\n`;
  });

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

  // Sections: \section{Title} -> numbered IEEE header
  body = body.replace(/\\section\*?\s*\{([^}]+)\}/g, (_m, title) => {
    secIdx++;
    subSecIdx = 0;
    subSubSecIdx = 0;
    const num = ROMAN_NUMERALS[secIdx - 1] || `${secIdx}.`;
    return `\n<h2 class="paper-sec-title"><span class="paper-num">${num}.</span> ${title.toUpperCase()}</h2>\n`;
  });

  // Subsections: \subsection{Title}
  body = body.replace(/\\subsection\*?\s*\{([^}]+)\}/g, (_m, title) => {
    subSecIdx++;
    subSubSecIdx = 0;
    const alpha = ALPHA_CHARS[subSecIdx - 1] || `${subSecIdx}.`;
    return `\n<h3 class="paper-subsec-title"><span class="paper-num">${alpha}.</span> ${title}</h3>\n`;
  });

  // Subsubsections: \subsubsection{Title}
  body = body.replace(/\\subsubsection\*?\s*\{([^}]+)\}/g, (_m, title) => {
    subSubSecIdx++;
    return `\n<h4 class="paper-subsubsec-title"><span class="paper-num">${subSubSecIdx})</span> ${title}</h4>\n`;
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
    return `\n<h2 class="paper-sec-title">${title.trim()}</h2>\n`;
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

  // Itemize / Enumerate
  body = body.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_m, inner) => {
    const items = inner.split('\\item').filter((it: string) => it.trim());
    return `\n<ul class="paper-list">\n${items.map((it: string) => `  <li>${it.trim()}</li>`).join('\n')}\n</ul>\n`;
  });

  body = body.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_m, inner) => {
    const items = inner.split('\\item').filter((it: string) => it.trim());
    return `\n<ol class="paper-list">\n${items.map((it: string) => `  <li>${it.trim()}</li>`).join('\n')}\n</ol>\n`;
  });

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

  // Paragraph processing: double newlines -> <p>
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      if (
        p.startsWith('<h') ||
        p.startsWith('<ul') ||
        p.startsWith('<ol') ||
        p.startsWith('<div') ||
        p.startsWith('<hr') ||
        p.startsWith('$$')
      ) {
        return p;
      }
      return `<p class="paper-para">${p.replace(/\\\\/g, '<br/>')}</p>`;
    })
    .join('\n\n');

  // Construct Final Academic Paper Flat HTML (flat elements for proper page splitting)
  const headerHtml = `
    <div class="academic-paper-header">
      <h1 class="academic-paper-title">${meta.title}</h1>
      ${meta.author ? `<div class="academic-paper-author">${meta.author}</div>` : ''}
      ${meta.date ? `<div class="academic-paper-date">${meta.date}</div>` : ''}
    </div>
  `;

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
