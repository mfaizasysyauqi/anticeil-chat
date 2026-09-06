import { useDocsStore, DocSubFile } from '../store/useDocsStore';
import { autoFixDocCode } from './docLinter';

export interface ExecutedAgentAction {
  type: 'create' | 'update' | 'patch' | 'rename' | 'delete' | 'checked';
  name: string;
}

/**
 * Automatically repairs common syntax & structural generation issues in AI outputs
 * across LaTeX, Markdown, AntSheet, and Slide documents using the Verification Engine.
 */
export function autoRepairLatexContent(content: string, fileName?: string): string {
  if (!content || !content.trim()) return content;
  let cleaned = stripConversationalPreamble(content);

  // If stray <find>...</find><replace>...</replace> leaked into content, extract replacement
  const findReplaceMatch = /<find>[\s\S]*?<\/find>\s*<replace>([\s\S]*?)<\/replace>/i.exec(cleaned);
  if (findReplaceMatch) {
    cleaned = findReplaceMatch[1].trim();
  } else {
    // Strip standalone <find>, </find>, <replace>, </replace> tags
    cleaned = cleaned.replace(/<\/?(?:find|replace)>/gi, '').trim();
  }

  const ext = fileName ? fileName.split('.').pop()?.toLowerCase() || '' : '';
  const format =
    ext === 'slide'
      ? 'slide'
      : ext === 'antsheet' || ext === 'csv'
      ? 'sheet'
      : ext === 'typ' || ext === 'typst'
      ? 'typst'
      : ext === 'md'
      ? 'markdown'
      : 'latex';
  const res = autoFixDocCode(cleaned, format);
  return res.fixedCode;
}

/**
 * Helper for applying patches with whitespace tolerance
 */
export const applyPatch = (content: string, findStr: string, replacement: string): string | null => {
  if (!content || !findStr) return null;
  if (content.includes(findStr)) return content.replace(findStr, replacement);
  // Normalize newlines (\r\n -> \n)
  const normContent = content.replace(/\r\n/g, '\n');
  const normFind = findStr.replace(/\r\n/g, '\n');
  if (normContent.includes(normFind)) return normContent.replace(normFind, replacement);
  // Trimmed matching
  const trimFind = normFind.trim();
  if (trimFind && normContent.includes(trimFind)) return normContent.replace(trimFind, replacement.trim());
  return null;
};

/**
 * Parses and executes all agent action tags (<create_file>, <update_file>, <patch_file>, <rename_file>, <delete_file>, <rewrite_main>)
 * against the target document in the store.
 */
export function executeDocAgentActions(docId: string, text: string): ExecutedAgentAction[] {
  const store = useDocsStore.getState();
  const targetDoc = store.documents.find((d) => d.id === docId);
  if (!targetDoc) return [];

  const executed: ExecutedAgentAction[] = [];
  const currentFiles = targetDoc.files || [];

  // 1. Create file: <create_file name="path/filename.ext">content</create_file>
  const createRegex = /<create_file\s+name=["']([^"']+)["']>([\s\S]*?)<\/create_file>/gi;
  let m;
  while ((m = createRegex.exec(text)) !== null) {
    const rawName = m[1].trim();
    const rawContent = m[2].trim();
    const normalizedName = rawName.replace(/\\/g, '/');
    const existing = currentFiles.find(
      (f) => f.name.toLowerCase() === normalizedName.toLowerCase() || f.name.toLowerCase() === rawName.toLowerCase()
    );

    // If <find>...</find><replace>...</replace> is placed inside create_file for an existing file, apply patch
    const findReplaceMatch = /<find>([\s\S]*?)<\/find>[\s\S]*?<replace>([\s\S]*?)<\/replace>/i.exec(rawContent);
    if (findReplaceMatch && existing) {
      const patched = applyPatch(existing.content, findReplaceMatch[1], findReplaceMatch[2]);
      if (patched !== null) {
        store.updateSubFileContent(docId, existing.id, patched);
        executed.push({ type: 'patch', name: normalizedName });
        continue;
      }
    }

    const content = autoRepairLatexContent(rawContent, normalizedName);
    const isMainDocFile =
      normalizedName.toLowerCase() === 'main' ||
      normalizedName.toLowerCase() === 'main.tex' ||
      normalizedName.toLowerCase() === 'main.typ' ||
      normalizedName.toLowerCase() === 'main.slide' ||
      normalizedName.toLowerCase() === 'sheet1.antsheet' ||
      normalizedName.toLowerCase() === 'main.md' ||
      normalizedName.toLowerCase() === (targetDoc.title || '').toLowerCase();

    if (existing) {
      store.updateSubFileContent(docId, existing.id, content);
      executed.push({ type: 'update', name: normalizedName });
    } else if (isMainDocFile && (!targetDoc.files || targetDoc.files.length === 0)) {
      store.updateDocumentContent(docId, content);
      executed.push({ type: 'update', name: normalizedName });
    } else {
      store.createSubFile(docId, normalizedName, content);
      executed.push({ type: 'create', name: normalizedName });

      // If an asset image is created, automatically reference it in main document file
      if (normalizedName.startsWith('assets/') && /\.(png|jpg|jpeg|svg|webp)$/i.test(normalizedName)) {
        const mainDocFile = (targetDoc.files || []).find(
          (f) =>
            f.isMain ||
            f.name.toLowerCase() === 'main.typ' ||
            f.name.toLowerCase() === 'main.tex' ||
            f.name.toLowerCase() === 'main.md' ||
            f.name.toLowerCase() === 'main'
        );
        const format = targetDoc.format || 'latex';
        if (mainDocFile) {
          const updatedContent = insertImageTagIntoDocContent(mainDocFile.content, normalizedName, format);
          store.updateSubFileContent(docId, mainDocFile.id, updatedContent);
          executed.push({ type: 'update', name: mainDocFile.name });
        } else if (targetDoc.content) {
          const updatedContent = insertImageTagIntoDocContent(targetDoc.content, normalizedName, format);
          store.updateDocumentContent(docId, updatedContent);
          executed.push({ type: 'update', name: 'main' });
        }
      }
    }
  }

  // 2. Update file: <update_file name="path/filename.ext">content</update_file>
  const updateRegex = /<update_file\s+name=["']([^"']+)["']>([\s\S]*?)<\/update_file>/gi;
  while ((m = updateRegex.exec(text)) !== null) {
    const rawName = m[1].trim();
    const rawContent = m[2].trim();
    const normalizedName = rawName.replace(/\\/g, '/');
    const existing = currentFiles.find(
      (f) => f.name.toLowerCase() === normalizedName.toLowerCase() || f.name.toLowerCase() === rawName.toLowerCase()
    );
    const isMainDocFile =
      normalizedName.toLowerCase() === 'main' ||
      normalizedName.toLowerCase() === 'main.tex' ||
      normalizedName.toLowerCase() === 'main.typ' ||
      normalizedName.toLowerCase() === 'main.slide' ||
      normalizedName.toLowerCase() === 'sheet1.antsheet' ||
      normalizedName.toLowerCase() === 'main.md' ||
      normalizedName.toLowerCase() === (targetDoc.title || '').toLowerCase();

    // Check if the AI wrote a patch (<find>...</find><replace>...</replace>) inside <update_file>
    const findReplaceMatch = /<find>([\s\S]*?)<\/find>[\s\S]*?<replace>([\s\S]*?)<\/replace>/i.exec(rawContent);
    if (findReplaceMatch) {
      const targetContent = existing ? existing.content : (isMainDocFile ? targetDoc.content : '');
      if (targetContent) {
        const patched = applyPatch(targetContent, findReplaceMatch[1], findReplaceMatch[2]);
        if (patched !== null) {
          if (existing) {
            store.updateSubFileContent(docId, existing.id, patched);
          } else if (isMainDocFile) {
            store.updateDocumentContent(docId, patched);
          }
          executed.push({ type: 'patch', name: normalizedName });
          continue;
        }
      }
    }

    const content = autoRepairLatexContent(rawContent, normalizedName);

    if (existing) {
      store.updateSubFileContent(docId, existing.id, content);
      executed.push({ type: 'update', name: normalizedName });
    } else if (isMainDocFile) {
      store.updateDocumentContent(docId, content);
      executed.push({ type: 'update', name: normalizedName });
    } else {
      store.createSubFile(docId, normalizedName, content);
      executed.push({ type: 'create', name: normalizedName });
    }
  }

  // 3. Targeted patch: Format A: <patch_file name="filename.ext">\s*<find>...</find>\s*<replace>...</replace>\s*</patch_file>
  const patchBlockRegex = /<patch_file\s+name=["']([^"']+)["']>[\s\S]*?<find>([\s\S]*?)<\/find>[\s\S]*?<replace>([\s\S]*?)<\/replace>[\s\S]*?<\/patch_file>/gi;
  while ((m = patchBlockRegex.exec(text)) !== null) {
    const fileName = m[1].trim().replace(/\\/g, '/');
    const findStr = m[2];
    const replacement = m[3];
    let targetFile = (targetDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
    if (!targetFile && (fileName.toLowerCase() === 'main.tex' || fileName.toLowerCase() === 'main' || fileName.toLowerCase() === 'main.typ')) {
      targetFile = (targetDoc.files || []).find((f) => f.id === targetDoc.activeFileId) || (targetDoc.files || []).find((f) => f.isMain);
    }
    if (targetFile) {
      const patched = applyPatch(targetFile.content, findStr, replacement);
      if (patched !== null) {
        store.updateSubFileContent(docId, targetFile.id, patched);
        executed.push({ type: 'patch', name: fileName });
      }
    } else if (targetDoc.content) {
      const patched = applyPatch(targetDoc.content, findStr, replacement);
      if (patched !== null) {
        store.updateDocumentContent(docId, patched);
        executed.push({ type: 'patch', name: targetDoc.title || 'Main' });
      }
    }
  }

  // 3b. Targeted patch: Format B (diff format): <<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE
  const patchDiffRegex = /<patch_file\s+name=["']([^"']+)["']>[\s\S]*?<{7}\s*SEARCH\s*\n([\s\S]*?)\n={7}\s*\n([\s\S]*?)\n>{7}\s*REPLACE[\s\S]*?<\/patch_file>/gi;
  while ((m = patchDiffRegex.exec(text)) !== null) {
    const fileName = m[1].trim().replace(/\\/g, '/');
    const findStr = m[2];
    const replacement = m[3];
    let targetFile = (targetDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
    if (!targetFile && (fileName.toLowerCase() === 'main.tex' || fileName.toLowerCase() === 'main' || fileName.toLowerCase() === 'main.typ')) {
      targetFile = (targetDoc.files || []).find((f) => f.id === targetDoc.activeFileId) || (targetDoc.files || []).find((f) => f.isMain);
    }
    if (targetFile) {
      const patched = applyPatch(targetFile.content, findStr, replacement);
      if (patched !== null) {
        store.updateSubFileContent(docId, targetFile.id, patched);
        executed.push({ type: 'patch', name: fileName });
      }
    } else if (targetDoc.content) {
      const patched = applyPatch(targetDoc.content, findStr, replacement);
      if (patched !== null) {
        store.updateDocumentContent(docId, patched);
        executed.push({ type: 'patch', name: targetDoc.title || 'Main' });
      }
    }
  }

  // 3c. Targeted patch: Format C (attribute format): <patch_file name="filename.ext" find="exact text">replacement</patch_file>
  const patchRegex = /<patch_file\s+name=["']([^"']+)["']\s+find=["']([\s\S]*?)["']>([\s\S]*?)<\/patch_file>/gi;
  while ((m = patchRegex.exec(text)) !== null) {
    const fileName = m[1].trim().replace(/\\/g, '/');
    const findStr = m[2];
    const replacement = m[3].trim();
    let targetFile = (targetDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
    if (!targetFile && (fileName.toLowerCase() === 'main.tex' || fileName.toLowerCase() === 'main' || fileName.toLowerCase() === 'main.typ')) {
      targetFile = (targetDoc.files || []).find((f) => f.id === targetDoc.activeFileId) || (targetDoc.files || []).find((f) => f.isMain);
    }
    if (targetFile) {
      const patched = applyPatch(targetFile.content, findStr, replacement);
      if (patched !== null) {
        store.updateSubFileContent(docId, targetFile.id, patched);
        executed.push({ type: 'patch', name: fileName });
      }
    } else if (targetDoc.content) {
      const patched = applyPatch(targetDoc.content, findStr, replacement);
      if (patched !== null) {
        store.updateDocumentContent(docId, patched);
        executed.push({ type: 'patch', name: targetDoc.title || 'Main' });
      }
    }
  }

  // 4. Rewrite main: <rewrite_main>content</rewrite_main>
  const rewriteMainRegex = /<rewrite_main>([\s\S]*?)<\/rewrite_main>/gi;
  while ((m = rewriteMainRegex.exec(text)) !== null) {
    const content = m[1].trim();
    store.updateDocumentContent(docId, content);
    executed.push({ type: 'update', name: 'main' });
  }

  // 5. Rename file: <rename_file from="old.ext" to="new.ext" />
  const renameRegex = /<rename_file\s+from=["']([^"']+)["']\s+to=["']([^"']+)["']\s*\/?>/gi;
  while ((m = renameRegex.exec(text)) !== null) {
    const fromName = m[1].trim().replace(/\\/g, '/');
    const toName = m[2].trim().replace(/\\/g, '/');
    const targetFile = (targetDoc.files || []).find((f) => f.name.toLowerCase() === fromName.toLowerCase());
    if (targetFile) {
      store.updateSubFileName(docId, targetFile.id, toName);
      executed.push({ type: 'rename', name: `${fromName} -> ${toName}` });
    }
  }

  // 6. Delete file: <delete_file name="filename.ext" />
  const deleteRegex = /<delete_file\s+name=["']([^"']+)["']\s*\/?>/gi;
  while ((m = deleteRegex.exec(text)) !== null) {
    const fileName = m[1].trim().replace(/\\/g, '/');
    const targetFile = (targetDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
    if (targetFile) {
      store.deleteSubFile(docId, targetFile.id);
      executed.push({ type: 'delete', name: fileName });
    }
  }

  // 7. Handle tool calls (e.g., anticeil_generate_image)
  const toolCallRegex = /```tool_call\s*([\s\S]*?)```|tool_call\s*(\{[\s\S]*?\})/gi;
  let tm;
  while ((tm = toolCallRegex.exec(text)) !== null) {
    const rawJson = (tm[1] || tm[2]).trim();
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed?.name === 'anticeil_generate_image' || parsed?.name?.includes('generate_image')) {
        const args = parsed.arguments || {};
        const promptStr = args.prompt || 'illustration';
        const styleStr = args.style || '';
        const encodedPrompt = encodeURIComponent(`${promptStr} ${styleStr}`.trim());
        const width = args.aspectRatio === '16:9' ? 1280 : args.aspectRatio === '9:16' ? 720 : 1024;
        const height = args.aspectRatio === '16:9' ? 720 : args.aspectRatio === '9:16' ? 1280 : 1024;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

        const slug = promptStr.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20) || 'image';
        const assetPath = `assets/${slug}.jpg`;

        const existingAsset = (targetDoc.files || []).find((f) => f.name.toLowerCase() === assetPath.toLowerCase());
        if (existingAsset) {
          store.updateSubFileContent(docId, existingAsset.id, imageUrl);
        } else {
          store.createSubFile(docId, assetPath, imageUrl);
          executed.push({ type: 'create', name: assetPath });
        }

        const format = targetDoc.format || 'latex';
        const allFiles = store.documents.find((d) => d.id === docId)?.files || [];
        const mainDocFile =
          allFiles.find(
            (f) =>
              f.isMain ||
              f.name.toLowerCase() === 'main.typ' ||
              f.name.toLowerCase() === 'main.tex' ||
              f.name.toLowerCase() === 'main.md' ||
              f.name.toLowerCase() === 'main'
          ) ||
          allFiles.find((f) => !f.name.startsWith('assets/') && !f.name.startsWith('data/'));

        if (mainDocFile) {
          const updatedContent = insertImageTagIntoDocContent(mainDocFile.content, assetPath, format, promptStr);
          store.updateSubFileContent(docId, mainDocFile.id, updatedContent);
          executed.push({ type: 'update', name: mainDocFile.name });
        } else if (targetDoc.content) {
          const updatedContent = insertImageTagIntoDocContent(targetDoc.content, assetPath, format, promptStr);
          store.updateDocumentContent(docId, updatedContent);
          executed.push({ type: 'update', name: 'main' });
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  return executed;
}

/**
 * Intelligently inserts an image tag into document content (placing cover images on cover page,
 * or placing standard images near headings/sections), avoiding duplicates.
 */
export function insertImageTagIntoDocContent(
  content: string,
  assetPath: string,
  format: string,
  promptStr: string = ''
): string {
  let cleaned = content
    .replace(/```tool_call[\s\S]*?```/gi, '')
    .replace(/tool_call\s*\{[\s\S]*?\}/gi, '')
    .trim();

  // If asset is already referenced in document, return as is
  if (cleaned.includes(assetPath)) return cleaned;

  const isCoverRequest =
    /cover|sampul|title|judul|header|depan/i.test(promptStr) ||
    /titlepage|Dokumen Resmi|Koleksi|Cerita Rakyat|Skripsi|Laporan/i.test(cleaned);

  const isTypst =
    format === 'typst' || assetPath.endsWith('.typ') || cleaned.includes('#set page') || cleaned.includes('= ');
  const isLatex =
    format === 'latex' || assetPath.endsWith('.tex') || cleaned.includes('\\documentclass');

  if (isTypst) {
    const imgTag = `\n#align(center)[#image("${assetPath}", width: 65%)]\n`;
    if (isCoverRequest) {
      // 1. Try finding subtitle/description line in cover block
      const alignIdx = cleaned.indexOf('#align(center)[');
      if (alignIdx !== -1) {
        // Look for subtitle/italic line inside align block
        const italicMatch = cleaned.match(/(_[^_]+_|[*][^*]+[*]|#v\([^)]+\))\s*\n/);
        if (italicMatch && italicMatch.index !== undefined && italicMatch.index > alignIdx) {
          const pos = italicMatch.index + italicMatch[0].length;
          return cleaned.slice(0, pos) + imgTag + cleaned.slice(pos);
        }
        // Fallback: insert after line with = Title inside #align(center)[
        const headingMatch = cleaned.match(/^=\s+.+$/m);
        if (headingMatch && headingMatch.index !== undefined) {
          const pos = headingMatch.index + headingMatch[0].length;
          return cleaned.slice(0, pos) + '\n' + imgTag + cleaned.slice(pos);
        }
        // Fallback: insert right after #align(center)[
        const lineEnd = cleaned.indexOf('\n', alignIdx);
        if (lineEnd !== -1) {
          return cleaned.slice(0, lineEnd + 1) + imgTag + cleaned.slice(lineEnd + 1);
        }
      }
      // 2. Try first level-1 heading =
      const headingIdx = cleaned.search(/^=\s+.+$/m);
      if (headingIdx !== -1) {
        const lineEnd = cleaned.indexOf('\n', headingIdx);
        if (lineEnd !== -1) {
          return cleaned.slice(0, lineEnd + 1) + imgTag + cleaned.slice(lineEnd + 1);
        }
      }
    }
    // Default: before Chapter 1 / first sub-heading
    const ch1Idx = cleaned.search(/^==\s+|^\s*= \s*Bab|^\s*=\s*Chapter/im);
    if (ch1Idx !== -1) {
      return cleaned.slice(0, ch1Idx) + imgTag + '\n' + cleaned.slice(ch1Idx);
    }
    return cleaned + imgTag;
  } else if (isLatex) {
    const imgTag = `\n\\begin{figure}[htbp]\n\\centering\n\\includegraphics[width=0.7\\textwidth]{${assetPath}}\n\\end{figure}\n`;
    if (isCoverRequest || cleaned.includes('\\begin{titlepage}')) {
      const boxEnd = cleaned.indexOf('\\end{tcolorbox}');
      if (boxEnd !== -1) {
        const pos = boxEnd + '\\end{tcolorbox}'.length;
        return cleaned.slice(0, pos) + imgTag + cleaned.slice(pos);
      }
      const tpIdx = cleaned.indexOf('\\begin{titlepage}');
      if (tpIdx !== -1) {
        const pos = tpIdx + '\\begin{titlepage}'.length;
        return cleaned.slice(0, pos) + imgTag + cleaned.slice(pos);
      }
      const maketitleIdx = cleaned.indexOf('\\maketitle');
      if (maketitleIdx !== -1) {
        const pos = maketitleIdx + '\\maketitle'.length;
        return cleaned.slice(0, pos) + imgTag + cleaned.slice(pos);
      }
    }
    const secIdx = cleaned.search(/\\section\{/i);
    if (secIdx !== -1) {
      return cleaned.slice(0, secIdx) + imgTag + '\n' + cleaned.slice(secIdx);
    }
    return cleaned + imgTag;
  } else {
    // Markdown / Slide
    const imgTag = `\n![${promptStr || 'Image'}](${assetPath})\n`;
    const h1Idx = cleaned.search(/^#\s+.+$/m);
    if (h1Idx !== -1) {
      const lineEnd = cleaned.indexOf('\n', h1Idx);
      if (lineEnd !== -1) {
        return cleaned.slice(0, lineEnd + 1) + imgTag + cleaned.slice(lineEnd + 1);
      }
    }
    return cleaned + imgTag;
  }
}

/**
 * Removes conversational intro sentences (e.g. "Berikut adalah...", "Dokumen ini berisi...")
 * that may accidentally be included at the beginning of code content.
 */
export function stripConversationalPreamble(content: string): string {
  if (!content) return '';
  let lines = content.split('\n');

  while (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (!firstLine) {
      lines.shift();
      continue;
    }

    // Check if first line matches common conversational introductory sentences
    const isConversationalIntro =
      /^(Berikut\s+(adalah|ini|dokumen|cerita|laporan|kode)|Tentu( saja)?,?\s+berikut|Here\s+(is|are)|This\s+document|Dokumen\s+ini|File\s+ini|Di\s+bawah\s+ini|Silakan\s+lihat|Saya\s+telah)\b/i.test(
        firstLine
      );

    if (isConversationalIntro) {
      lines.shift();
    } else {
      break;
    }
  }

  return lines.join('\n').trim();
}

/**
 * Extracts clean user-facing content from an agent stream (stripping internal XML tags & conversational preambles).
 */
export function extractCleanContent(rawText: string): string {
  if (!rawText) return '';
  // Strip tool call blocks first so JSON tool calls never pollute clean doc content
  const textToParse = rawText
    .replace(/```tool_call[\s\S]*?```/gi, '')
    .replace(/tool_call\s*\{[\s\S]*?\}/gi, '')
    .trim();

  if (!textToParse) return '';
  let result = '';

  const fileTagMatch = textToParse.match(
    /<(?:update_file|create_file|rewrite_main|patch_file)[^>]*>([\s\S]*?)<\/(?:update_file|create_file|rewrite_main|patch_file)>/i
  );
  if (fileTagMatch && fileTagMatch[1].trim()) {
    result = fileTagMatch[1].trim();
  } else {
    const codeFenceMatch = textToParse.match(
      /```(?:latex|tex|markdown|md|typst|typ|bib|json|csv|antsheet)?\s*([\s\S]*?)```/i
    );
    if (codeFenceMatch && codeFenceMatch[1].trim()) {
      result = codeFenceMatch[1].trim();
    } else {
      let cleaned = textToParse
        .replace(
          /<(?:update_file|create_file|rewrite_main|patch_file)[^>]*>[\s\S]*?<\/(?:update_file|create_file|rewrite_main|patch_file)>/gi,
          ''
        )
        .replace(/<(?:rename_file|delete_file)[^>]*\/?>/gi, '');
      const explanationHeaderIdx = cleaned.search(
        /\n\s*#{1,4}\s*(?:Perubahan|Penjelasan|Catatan|Explanation|Summary|Changes|Changelog)/i
      );
      if (explanationHeaderIdx !== -1) cleaned = cleaned.substring(0, explanationHeaderIdx).trim();
      result = cleaned.trim();
    }
  }

  return stripConversationalPreamble(result);
}

/**
 * Strips all agent action tags (<patch_file>, <create_file>, <update_file>, <rewrite_main>, <rename_file>, <delete_file>)
 * and their inner code/content from text so raw code dumps don't clutter the chat UI.
 */
export function stripAgentActionTags(text: string): string {
  if (!text) return '';

  let cleaned = text
    .replace(/```tool_call[\s\S]*?```/gi, '')
    .replace(/tool_call\s*\{[\s\S]*?\}/gi, '');

  // 1. Strip complete action tags with content
  cleaned = cleaned.replace(
    /<(?:create_file|update_file|patch_file|rewrite_main)\b[^>]*>[\s\S]*?<\/(?:create_file|update_file|patch_file|rewrite_main)>/gi,
    ''
  );

  // 2. Strip self-closing action tags
  cleaned = cleaned.replace(/<(?:rename_file|delete_file)\b[^>]*\/?>/gi, '');

  // 3. Strip any unclosed action tag currently streaming at the end of response
  cleaned = cleaned.replace(
    /<(?:create_file|update_file|patch_file|rewrite_main|rename_file|delete_file)\b[^>]*>[\s\S]*$/gi,
    ''
  );

  // 4. Strip partial unclosed opening tag at end of stream (e.g. "<patch_file name=...")
  cleaned = cleaned.replace(
    /<(?:create_file|update_file|patch_file|rewrite_main|rename_file|delete_file)\b[^\/>]*$/gi,
    ''
  );

  // 5. Strip leftover empty code fences
  cleaned = cleaned.replace(/```(?:latex|tex|markdown|md|typst|typ|bib|json|csv|antsheet)?\s*```/gi, '');

  return cleaned.trim();
}

