import { useDocsStore, DocSubFile } from '../store/useDocsStore';
import { autoFixDocCode } from './docLinter';

export interface ExecutedAgentAction {
  type: 'create' | 'update' | 'patch' | 'rename' | 'delete';
  name: string;
}

/**
 * Automatically repairs common syntax & structural generation issues in AI outputs
 * across LaTeX, Markdown, AntSheet, and Slide documents using the Verification Engine.
 */
export function autoRepairLatexContent(content: string, fileName?: string): string {
  if (!content || !content.trim()) return content;
  const cleaned = stripConversationalPreamble(content);
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
    const content = autoRepairLatexContent(rawContent, normalizedName);
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

    if (existing) {
      store.updateSubFileContent(docId, existing.id, content);
      executed.push({ type: 'update', name: normalizedName });
    } else if (isMainDocFile && (!targetDoc.files || targetDoc.files.length === 0)) {
      store.updateDocumentContent(docId, content);
      executed.push({ type: 'update', name: normalizedName });
    } else {
      store.createSubFile(docId, normalizedName, content);
      executed.push({ type: 'create', name: normalizedName });
    }
  }

  // 2. Update file: <update_file name="path/filename.ext">content</update_file>
  const updateRegex = /<update_file\s+name=["']([^"']+)["']>([\s\S]*?)<\/update_file>/gi;
  while ((m = updateRegex.exec(text)) !== null) {
    const rawName = m[1].trim();
    const rawContent = m[2].trim();
    const normalizedName = rawName.replace(/\\/g, '/');
    const content = autoRepairLatexContent(rawContent, normalizedName);
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

  // 3. Targeted patch: <patch_file name="filename.ext" find="exact text">replacement</patch_file>
  const patchRegex = /<patch_file\s+name=["']([^"']+)["']\s+find=["']([\s\S]*?)["']>([\s\S]*?)<\/patch_file>/gi;
  while ((m = patchRegex.exec(text)) !== null) {
    const fileName = m[1].trim().replace(/\\/g, '/');
    const findStr = m[2]; // do NOT trim — must match exactly
    const replacement = m[3].trim();
    let targetFile = (targetDoc.files || []).find((f) => f.name.toLowerCase() === fileName.toLowerCase());
    if (!targetFile && (fileName.toLowerCase() === 'main.tex' || fileName.toLowerCase() === 'main')) {
      targetFile = (targetDoc.files || []).find((f) => f.id === targetDoc.activeFileId);
    }
    if (targetFile) {
      if (targetFile.content.includes(findStr)) {
        const patched = targetFile.content.replace(findStr, replacement);
        store.updateSubFileContent(docId, targetFile.id, patched);
        executed.push({ type: 'patch', name: fileName });
      }
    } else if (targetDoc.content.includes(findStr)) {
      const patched = targetDoc.content.replace(findStr, replacement);
      store.updateDocumentContent(docId, patched);
      executed.push({ type: 'patch', name: targetDoc.title || 'Main' });
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

  return executed;
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
  let result = '';

  const fileTagMatch = rawText.match(
    /<(?:update_file|create_file|rewrite_main|patch_file)[^>]*>([\s\S]*?)<\/(?:update_file|create_file|rewrite_main|patch_file)>/i
  );
  if (fileTagMatch && fileTagMatch[1].trim()) {
    result = fileTagMatch[1].trim();
  } else {
    const codeFenceMatch = rawText.match(
      /```(?:latex|tex|markdown|md|typst|typ|bib|json|csv|antsheet)?\s*([\s\S]*?)```/i
    );
    if (codeFenceMatch && codeFenceMatch[1].trim()) {
      result = codeFenceMatch[1].trim();
    } else {
      let cleaned = rawText
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

  let cleaned = text;

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

