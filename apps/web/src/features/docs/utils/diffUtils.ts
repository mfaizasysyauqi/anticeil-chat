/**
 * diffUtils.ts — minimal line-level diff for Track Changes.
 * Finds the first + last line that changed between oldText and newText,
 * returning fields compatible with DocSuggestion.
 */

export interface LineDiff {
  /** 1-indexed line where the change starts (in the original) */
  fromLine: number;
  /** 1-indexed line where the change ends (in the original, inclusive) */
  toLine: number;
  /** Lines removed from the original (joined with \n) */
  originalText: string;
  /** Lines that replace them in the new version (joined with \n) */
  suggestedText: string;
  /** add = net insertion with no original lines, delete = net deletion, replace = substitution */
  type: 'add' | 'delete' | 'replace';
}

export function computeLineDiff(oldText: string, newText: string): LineDiff | null {
  if (oldText === newText) return null;

  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Find first differing line (0-indexed)
  let firstDiff = 0;
  while (
    firstDiff < oldLines.length &&
    firstDiff < newLines.length &&
    oldLines[firstDiff] === newLines[firstDiff]
  ) {
    firstDiff++;
  }

  // Find last differing line from the end (0-indexed from end)
  let oldTail = oldLines.length - 1;
  let newTail = newLines.length - 1;
  while (
    oldTail > firstDiff &&
    newTail > firstDiff &&
    oldLines[oldTail] === newLines[newTail]
  ) {
    oldTail--;
    newTail--;
  }

  const fromLine = firstDiff + 1; // 1-indexed
  const toLine = oldTail + 1;     // 1-indexed

  const originalText = oldLines.slice(firstDiff, oldTail + 1).join('\n');
  const suggestedText = newLines.slice(firstDiff, newTail + 1).join('\n');

  let type: 'add' | 'delete' | 'replace';
  if (originalText === '') {
    type = 'add';
  } else if (suggestedText === '') {
    type = 'delete';
  } else {
    type = 'replace';
  }

  return { fromLine, toLine, originalText, suggestedText, type };
}
