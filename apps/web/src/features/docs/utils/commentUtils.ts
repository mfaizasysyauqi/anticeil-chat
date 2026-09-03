import { DocComment } from '../store/useDocsStore';

export interface SpanRange {
  start: number;
  end: number;
  commentId?: string;
  isDraft?: boolean;
}

/**
 * Calculates character ranges in codeText for active comments and optional draft comment.
 */
export function calculateCommentRanges(
  rawText: string,
  comments: DocComment[],
  isAddingComment: boolean,
  draftInfo: {
    selectedText?: string;
    fromLine?: number;
    toLine?: number;
    charStart?: number | null;
    charEnd?: number | null;
  }
): SpanRange[] {
  if (!rawText) return [];

  const activeComments = comments.filter((c) => !c.resolved && c.fromLine);
  const lines = rawText.split('\n');
  const lineStartIndices: number[] = [0];
  for (let i = 0; i < lines.length; i++) {
    lineStartIndices.push(lineStartIndices[i] + lines[i].length + 1);
  }

  const ranges: SpanRange[] = [];

  // 1. Active comments
  for (const c of activeComments) {
    let charStart = -1;
    let charEnd = -1;

    if (c.selectedText && c.selectedText.trim()) {
      const trimmed = c.selectedText.trim();
      const fromLine = Math.max(1, Math.min(lines.length, c.fromLine ?? 1));
      const lineStartPos = lineStartIndices[fromLine - 1] ?? 0;

      const searchForward = rawText.indexOf(trimmed, lineStartPos);
      if (searchForward !== -1 && searchForward < lineStartPos + 400) {
        charStart = searchForward;
        charEnd = searchForward + trimmed.length;
      } else {
        const searchBack = rawText.indexOf(trimmed, Math.max(0, lineStartPos - 80));
        if (searchBack !== -1 && searchBack < lineStartPos + 400) {
          charStart = searchBack;
          charEnd = searchBack + trimmed.length;
        } else {
          const globalIdx = rawText.indexOf(trimmed);
          if (globalIdx !== -1) {
            charStart = globalIdx;
            charEnd = globalIdx + trimmed.length;
          }
        }
      }
    }

    if (charStart === -1 || charEnd === -1) {
      const fromLine = Math.max(1, Math.min(lines.length, c.fromLine ?? 1));
      const toLine = Math.max(fromLine, Math.min(lines.length, c.toLine ?? fromLine));
      charStart = lineStartIndices[fromLine - 1] ?? 0;
      charEnd = Math.min(rawText.length, lineStartIndices[toLine] ? lineStartIndices[toLine] - 1 : rawText.length);
    }

    if (charEnd > charStart && rawText.substring(charStart, charEnd).trim().length > 0) {
      ranges.push({ start: charStart, end: charEnd, commentId: c.id });
    }
  }

  // 2. Draft comment if active
  if (isAddingComment) {
    let charStart = -1;
    let charEnd = -1;

    if (draftInfo.charStart != null && draftInfo.charEnd != null && draftInfo.charEnd > draftInfo.charStart) {
      charStart = draftInfo.charStart;
      charEnd = draftInfo.charEnd;
    } else if (draftInfo.selectedText && draftInfo.selectedText.trim()) {
      const trimmed = draftInfo.selectedText.trim();
      const fromLine = Math.max(1, Math.min(lines.length, draftInfo.fromLine ?? 1));
      const lineStartPos = lineStartIndices[fromLine - 1] ?? 0;
      const searchIdx = rawText.indexOf(trimmed, lineStartPos);
      if (searchIdx !== -1 && searchIdx < lineStartPos + 400) {
        charStart = searchIdx;
        charEnd = searchIdx + trimmed.length;
      } else {
        const searchBack = rawText.indexOf(trimmed, Math.max(0, lineStartPos - 80));
        if (searchBack !== -1) {
          charStart = searchBack;
          charEnd = searchBack + trimmed.length;
        }
      }
    }

    if (charStart === -1 || charEnd === -1) {
      const fromLine = Math.max(1, Math.min(lines.length, draftInfo.fromLine ?? 1));
      const toLine = Math.max(fromLine, Math.min(lines.length, draftInfo.toLine ?? fromLine));
      charStart = lineStartIndices[fromLine - 1] ?? 0;
      charEnd = Math.min(rawText.length, lineStartIndices[toLine] ? lineStartIndices[toLine] - 1 : rawText.length);
    }

    if (charEnd > charStart && rawText.substring(charStart, charEnd).trim().length > 0) {
      ranges.push({ start: charStart, end: charEnd, isDraft: true });
    }
  }

  ranges.sort((a, b) => a.start - b.start);
  return ranges;
}

/**
 * Selects exact text range or line range in a textarea element for a given comment.
 */
export function selectCommentRange(
  comment: DocComment,
  text: string,
  el: HTMLTextAreaElement | null
) {
  if (!el || !text) return;
  const lines = text.split('\n');

  let startChar = -1;
  let endChar = -1;

  if (comment.selectedText && comment.selectedText.trim()) {
    const trimmed = comment.selectedText.trim();
    const fromLine = Math.max(1, Math.min(lines.length, comment.fromLine ?? 1));
    let lineStart = 0;
    for (let i = 0; i < fromLine - 1 && i < lines.length; i++) {
      lineStart += lines[i].length + 1;
    }
    const searchForward = text.indexOf(trimmed, lineStart);
    if (searchForward !== -1 && searchForward < lineStart + 400) {
      startChar = searchForward;
      endChar = searchForward + trimmed.length;
    } else {
      const searchBack = text.indexOf(trimmed, Math.max(0, lineStart - 80));
      if (searchBack !== -1 && searchBack < lineStart + 400) {
        startChar = searchBack;
        endChar = searchBack + trimmed.length;
      } else {
        const globalIdx = text.indexOf(trimmed);
        if (globalIdx !== -1) {
          startChar = globalIdx;
          endChar = globalIdx + trimmed.length;
        }
      }
    }
  }

  if (startChar === -1 || endChar === -1) {
    const fromLine = comment.fromLine ?? 1;
    const toLine = comment.toLine ?? fromLine;
    startChar = 0;
    for (let i = 0; i < Math.max(0, fromLine - 1) && i < lines.length; i++) {
      startChar += lines[i].length + 1;
    }
    endChar = startChar;
    for (let i = Math.max(0, fromLine - 1); i < Math.min(lines.length, toLine); i++) {
      endChar += lines[i].length + (i < toLine - 1 ? 1 : 0);
    }
  }

  el.focus();
  el.setSelectionRange(startChar, endChar);
}

/**
 * Measures physical offsetTop positions of [data-comment-mark] elements in backdrop container.
 */
export function measureCommentDomPositions(containerEl: HTMLElement | null): Record<string, number> {
  if (!containerEl) return {};
  const marks = containerEl.querySelectorAll<HTMLElement>('[data-comment-mark]');
  const map: Record<string, number> = {};

  marks.forEach((mark) => {
    const id = mark.getAttribute('data-comment-mark');
    if (id && map[id] === undefined) {
      map[id] = mark.offsetTop;
    }
  });

  return map;
}
