import React from 'react';

/**
 * Standard keyboard shortcuts handler for document code editors:
 * - Tab: inserts 2 spaces and advances cursor without losing focus.
 * - Ctrl+Enter / Cmd+Enter: triggers recompile.
 */
export function handleStandardEditorKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  code: string,
  setCode: (val: string) => void,
  onRecompile?: () => void
): boolean {
  if (e.key === 'Tab') {
    e.preventDefault();
    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: en } = ta;
    const next = ta.value.substring(0, s) + '  ' + ta.value.substring(en);
    setCode(next);
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = s + 2;
    }, 0);
    return true;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (onRecompile) onRecompile();
    return true;
  }

  return false;
}
