import { DocItem, DocSubFile } from '../store/useDocsStore';

/**
 * Resolves all sub-file imports (\input{...}, \include{...}, \subfile{...}, @import "...")
 * recursively into a single bundled string for preview and compilation.
 */
export function resolveDocImports(
  rootContent: string,
  subFiles: DocSubFile[] = [],
  visitedNames: Set<string> = new Set(),
  maxDepth = 10
): string {
  if (maxDepth <= 0) return rootContent;

  const fileMap = new Map<string, DocSubFile>();
  for (const f of subFiles) {
    const rawName = f.name.trim().toLowerCase().replace(/\\/g, '/');
    fileMap.set(rawName, f);
    // Index without extension
    const dotIdx = rawName.lastIndexOf('.');
    if (dotIdx > 0) {
      const base = rawName.substring(0, dotIdx);
      if (!fileMap.has(base)) {
        fileMap.set(base, f);
      }
    }
    // Also index basename without folder prefix (e.g. "intro" for "chapters/intro.tex")
    const slashIdx = rawName.lastIndexOf('/');
    if (slashIdx >= 0) {
      const baseNameWithExt = rawName.substring(slashIdx + 1);
      if (!fileMap.has(baseNameWithExt)) {
        fileMap.set(baseNameWithExt, f);
      }
      const dotIdx2 = baseNameWithExt.lastIndexOf('.');
      if (dotIdx2 > 0) {
        const baseNameNoExt = baseNameWithExt.substring(0, dotIdx2);
        if (!fileMap.has(baseNameNoExt)) {
          fileMap.set(baseNameNoExt, f);
        }
      }
    }
  }

  // Regex for LaTeX \input{name}, \include{name}, \subfile{name}
  // and Markdown @import "name", @[include](name), !include(name)
  const importRegex =
    /(\\input\{([^}]+)\}|\\include\{([^}]+)\}|\\subfile\{([^}]+)\}|@import\s+["']([^"']+)["']|@\[include\]\(([^)]+)\)|!include\(([^)]+)\))/g;

  return rootContent.replace(
    importRegex,
    (match, full, latexInput, latexInclude, latexSubfile, atImport, mdInclude1, mdInclude2) => {
      const target = (
        latexInput ||
        latexInclude ||
        latexSubfile ||
        atImport ||
        mdInclude1 ||
        mdInclude2 ||
        ''
      ).trim();

      if (!target) return match;

      const normalized = target.toLowerCase();

      // Circular import detection
      if (visitedNames.has(normalized)) {
        return `\n\n> ⚠️ *[Circular Import Detected: "${target}"]*\n\n`;
      }

      const found = fileMap.get(normalized);
      if (!found) {
        return `\n\n> ⚠️ *[File not found: "${target}"]*\n\n`;
      }

      const nextVisited = new Set(visitedNames);
      nextVisited.add(normalized);
      if (found.name) nextVisited.add(found.name.toLowerCase());

      // If it's a BibTeX file, format references nicely
      if (found.name.endsWith('.bib')) {
        return formatBibTeXToMarkdown(found.content);
      }

      // Recursively resolve imports in sub-file
      const resolvedSubContent = resolveDocImports(
        found.content,
        subFiles,
        nextVisited,
        maxDepth - 1
      );

      return `\n\n${resolvedSubContent}\n\n`;
    }
  );
}

/**
 * Parses raw BibTeX content and outputs human-readable Markdown bibliography entries.
 */
function formatBibTeXToMarkdown(bibContent: string): string {
  const entries: string[] = [];
  const entryRegex = /@(\w+)\s*\{\s*([^,]+),([^@]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(bibContent)) !== null) {
    const type = match[1];
    const key = match[2].trim();
    const body = match[3];

    const getField = (field: string) => {
      const fieldRegex = new RegExp(`${field}\\s*=\\s*[{"]([^}"]+)[}"]`, 'i');
      const m = fieldRegex.exec(body);
      return m ? m[1].trim() : '';
    };

    const title = getField('title');
    const author = getField('author');
    const year = getField('year');
    const journal = getField('journal') || getField('booktitle');

    if (title || author) {
      entries.push(
        `- **[${key}]** ${author ? `${author}. ` : ''}*${title || 'Untitled'}*. ${
          journal ? `${journal}, ` : ''
        }${year ? `(${year})` : ''}`
      );
    }
  }

  if (entries.length === 0) {
    return bibContent;
  }

  return `\n\n### References & Bibliography\n\n${entries.join('\n')}\n\n`;
}

/**
 * Convenience function to resolve full bundled content of a DocItem.
 */
export function getBundledDocContent(doc: DocItem): string {
  if (!doc) return '';

  const subFiles = doc.files || [];
  const mainFile = subFiles.find((f) => f.isMain) || subFiles[0];
  const rootContent = mainFile ? mainFile.content : doc.content || '';

  return resolveDocImports(rootContent, subFiles);
}
