'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Settings2,
  FileMinus,
  Compass,
} from 'lucide-react';
import { DocFormat, DocSubFile } from '../../store/useDocsStore';

export interface DocVisualEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  format?: DocFormat;
  fileName?: string;
  subFiles?: DocSubFile[];
  docTitle?: string;
  theme?: 'dark' | 'light' | 'system' | string;
  language?: 'id' | 'en' | string;
  highlightLine?: number | null;
  onSyncToPreview?: (lineNumber: number, headingText?: string) => void;
  onBlockFocus?: (lineNumber: number) => void;
}

export interface GridCardItem {
  imageName?: string;
  imageSrc?: string;
  title?: string;
  description?: string;
}

export interface VisualBlock {
  id: string;
  type:
    | 'heading'
    | 'paragraph'
    | 'macro-chip'
    | 'image'
    | 'abstract'
    | 'list'
    | 'table'
    | 'grid'
    | 'pagebreak'
    | 'divider'
    | 'author'
    | 'cover';
  level?: number; // 1, 2, 3
  startLine: number;
  endLine: number;
  rawSource: string;
  titleText?: string;
  subtitleText?: string;
  bodyText?: string;
  commandName?: string;
  commandArgs?: string;
  imageSrc?: string;
  imageCaption?: string;
  gridItems?: GridCardItem[];
  listType?: 'bullet' | 'numbered';
  listItems?: string[];
  align?: 'left' | 'center' | 'right';
}

/**
 * Parses balanced brackets/parens in multi-line Typst / LaTeX code to find preamble boundary
 */
function findPreambleEndLine(lines: string[], isLatex: boolean, isTypst: boolean): number {
  if (!lines || lines.length === 0) return 0;

  if (isLatex) {
    const docBeginIdx = lines.findIndex((l) => l.includes('\\begin{document}'));
    if (docBeginIdx !== -1) return docBeginIdx + 1;
    const firstSecIdx = lines.findIndex((l) => /^\\(?:title|section)\b/.test(l.trim()));
    return firstSecIdx !== -1 ? firstSecIdx : 0;
  }

  if (isTypst) {
    let parenDepth = 0;
    let bracketDepth = 0;
    let lastPreambleLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      const isDirectiveStart = /^#(?:set|show|import|let)\b/.test(trimmed);

      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
        else if (ch === '[') bracketDepth++;
        else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
      }

      if (isDirectiveStart || parenDepth > 0 || bracketDepth > 0) {
        lastPreambleLine = i + 1;
      } else if (
        trimmed.startsWith('= ') ||
        trimmed.startsWith('== ') ||
        trimmed.startsWith('#align(center)[') ||
        trimmed.startsWith('#grid(')
      ) {
        break;
      } else if (trimmed && !trimmed.startsWith('//') && lastPreambleLine > 0) {
        break;
      }
    }
    return lastPreambleLine;
  }

  return 0;
}

/**
 * Cleans inline Typst / LaTeX formatting markers for clean visual display
 */
function cleanInlineFormatting(text: string): string {
  if (!text) return '';
  let res = text;
  res = res.replace(/\\textbf\{([^}]+)\}/g, '$1');
  res = res.replace(/\*\*([^*]+)\*\*/g, '$1');
  res = res.replace(/\\textit\{([^}]+)\}/g, '$1');
  res = res.replace(/_([^_]+)_/g, '$1');
  res = res.replace(/\\emph\{([^}]+)\}/g, '$1');
  res = res.replace(/\\underline\{([^}]+)\}/g, '$1');
  res = res.replace(/\\cite\{([^}]+)\}/g, '[$1]');
  res = res.replace(/#text\([^)]*\)\[([\s\S]*?)\]/g, '$1');
  res = res.replace(/#v\([^)]*\)/g, '');
  res = res.replace(/#line\([^)]*\)/g, '');
  return res.trim();
}

/**
 * Parses document text into structured Overleaf visual blocks with 100% accurate line numbers
 */
function parseDocumentToVisualBlocks(
  text: string,
  isLatex: boolean,
  isTypst: boolean,
  subFiles: DocSubFile[] = []
): { preamble: string; preambleLineCount: number; blocks: VisualBlock[] } {
  if (!text) {
    return { preamble: '', preambleLineCount: 0, blocks: [] };
  }

  try {
    const lines = text.split('\n');
    const preambleEndLine = findPreambleEndLine(lines, isLatex, isTypst);

    const preambleLines = lines.slice(0, preambleEndLine);
    const preamble = preambleLines.join('\n');
    const preambleLineCount = preambleLines.length;
    const bodyLines = lines.slice(preambleEndLine);

    const blocks: VisualBlock[] = [];
    const currentLineIdx = preambleEndLine;

    let i = 0;
    while (i < bodyLines.length) {
      const loopStartI = i;
      const rawLine = bodyLines[i];
      const trimmed = rawLine.trim();
      const lineNum = currentLineIdx + i + 1; // 1-indexed accurate line number in original file

      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('%')) {
        i++;
        continue;
      }

      if (isLatex && trimmed.includes('\\end{document}')) {
        i++;
        continue;
      }

      if (isLatex) {
        const titleMatch = trimmed.match(/^\\title\s*\{([\s\S]*?)\}/);
        if (titleMatch) {
          blocks.push({ id: `block_${lineNum}`, type: 'heading', level: 1, align: 'center', titleText: titleMatch[1], rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        if (trimmed === '\\maketitle') {
          i++;
          continue;
        }
        const secMatch = trimmed.match(/^\\section\*?\s*\{([\s\S]*?)\}/);
        if (secMatch) {
          blocks.push({ id: `block_${lineNum}`, type: 'heading', level: 1, align: 'left', titleText: secMatch[1], rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        const subSecMatch = trimmed.match(/^\\subsection\*?\s*\{([\s\S]*?)\}/);
        if (subSecMatch) {
          blocks.push({ id: `block_${lineNum}`, type: 'heading', level: 2, align: 'left', titleText: subSecMatch[1], rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        const subSubSecMatch = trimmed.match(/^\\subsubsection\*?\s*\{([\s\S]*?)\}/);
        if (subSubSecMatch) {
          blocks.push({ id: `block_${lineNum}`, type: 'heading', level: 3, align: 'left', titleText: subSubSecMatch[1], rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        if (/^\\(?:newpage|clearpage|pagebreak)\b/.test(trimmed)) {
          blocks.push({ id: `block_${lineNum}`, type: 'pagebreak', commandName: '\\newpage', rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        const macroMatch = trimmed.match(/^\\(pagenumbering|setcounter|vspace|hspace|centering|raggedright|raggedleft|tableofcontents|bibliographystyle|bibliography)\s*(\{[^}]*\})?(\{[^}]*\})?/);
        if (macroMatch) {
          blocks.push({ id: `block_${lineNum}`, type: 'macro-chip', commandName: `\\${macroMatch[1]}`, commandArgs: (macroMatch[2] || '') + (macroMatch[3] || ''), rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        const imgMatch = trimmed.match(/\\includegraphics(?:\s*\[([^\]]*)\])?\s*\{([^}]+)\}/);
        if (imgMatch) {
          const imgName = imgMatch[2].trim();
          const matchedSub = subFiles.find((sf) => sf.name === imgName || sf.name.toLowerCase() === imgName.toLowerCase() || sf.name.endsWith(imgName));
          blocks.push({ id: `block_${lineNum}`, type: 'image', commandName: '\\includegraphics', commandArgs: imgMatch[1] ? `[${imgMatch[1]}]{${imgName}}` : `{${imgName}}`, imageSrc: matchedSub?.content || '', imageCaption: imgName, rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        if (trimmed.startsWith('\\begin{abstract}')) {
          const absLines: string[] = [];
          let j = i;
          while (j < bodyLines.length) {
            const l = bodyLines[j];
            absLines.push(l);
            if (l.includes('\\end{abstract}')) break;
            j++;
          }
          blocks.push({ id: `block_${lineNum}`, type: 'abstract', bodyText: absLines.join('\n').replace('\\begin{abstract}', '').replace('\\end{abstract}', '').trim(), rawSource: absLines.join('\n'), startLine: lineNum, endLine: currentLineIdx + Math.min(j, bodyLines.length - 1) + 1 });
          i = j + 1;
          continue;
        }
        if (trimmed.startsWith('\\begin{itemize}') || trimmed.startsWith('\\begin{enumerate}')) {
          const isNum = trimmed.startsWith('\\begin{enumerate}');
          const endTag = isNum ? '\\end{enumerate}' : '\\end{itemize}';
          const listLines: string[] = [];
          let j = i;
          while (j < bodyLines.length) {
            const l = bodyLines[j];
            listLines.push(l);
            if (l.includes(endTag)) break;
            j++;
          }
          blocks.push({ id: `block_${lineNum}`, type: 'list', listType: isNum ? 'numbered' : 'bullet', listItems: listLines.join('\n').split('\\item').slice(1).map((it) => it.replace(endTag, '').trim()).filter(Boolean), rawSource: listLines.join('\n'), startLine: lineNum, endLine: currentLineIdx + Math.min(j, bodyLines.length - 1) + 1 });
          i = j + 1;
          continue;
        }
        const authorMatch = trimmed.match(/^\\author\s*\{([\s\S]*?)\}/);
        if (authorMatch) {
          blocks.push({ id: `block_${lineNum}`, type: 'author', bodyText: authorMatch[1], rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
      }

      if (isTypst) {
        if (trimmed.startsWith('#align(center)[') || trimmed.startsWith('align(center)[')) {
          const alignLines: string[] = [];
          let j = i;
          let bracketCount = 0;
          let foundBracket = false;
          while (j < bodyLines.length) {
            const l = bodyLines[j];
            alignLines.push(l);
            for (const ch of l) {
              if (ch === '[') { bracketCount++; foundBracket = true; } else if (ch === ']') bracketCount--;
            }
            if (foundBracket && bracketCount <= 0) break;
            j++;
          }
          const fullAlign = alignLines.join('\n');
          const textMatches = Array.from(fullAlign.matchAll(/#text\(([^)]*)\)\[([\s\S]*?)\]/g));
          if (textMatches.length >= 2 && fullAlign.includes('24pt')) {
            blocks.push({ id: `block_${lineNum}`, type: 'cover', titleText: textMatches[0][2].trim(), subtitleText: textMatches[1][2].trim(), rawSource: fullAlign, startLine: lineNum, endLine: currentLineIdx + Math.min(j, bodyLines.length - 1) + 1 });
          } else if (textMatches.length >= 1) {
            blocks.push({ id: `block_${lineNum}`, type: 'heading', level: 2, align: 'center', titleText: textMatches[0][2].trim(), rawSource: fullAlign, startLine: lineNum, endLine: currentLineIdx + Math.min(j, bodyLines.length - 1) + 1 });
          } else {
            blocks.push({ id: `block_${lineNum}`, type: 'paragraph', bodyText: fullAlign, rawSource: fullAlign, startLine: lineNum, endLine: currentLineIdx + Math.min(j, bodyLines.length - 1) + 1, align: 'center' });
          }
          i = j + 1;
          continue;
        }

        if (trimmed.startsWith('#grid(') || trimmed.startsWith('grid(')) {
          const gridLines: string[] = [];
          let j = i;
          let parenCount = 0;
          let foundParen = false;
          while (j < bodyLines.length) {
            const l = bodyLines[j];
            gridLines.push(l);
            for (const ch of l) {
              if (ch === '(') { parenCount++; foundParen = true; } else if (ch === ')') parenCount--;
            }
            if (foundParen && parenCount <= 0) break;
            j++;
          }
          const fullGrid = gridLines.join('\n');
          const gridItems: GridCardItem[] = [];
          const blockMatches = fullGrid.split(/(?=#align|#block|align\(|block\()/);
          for (const blk of blockMatches) {
            const imgM = blk.match(/#image\(\s*["']([^"']+)["']/);
            const titleM = blk.match(/#text\([^)]*weight:\s*["']bold["'][^)]*\)\[([\s\S]*?)\]/);
            const descM = blk.match(/#text\([^)]*\)\[([\s\S]*?)\]/g);
            const imgName = imgM ? imgM[1] : undefined;
            const matchedSub = imgName ? subFiles.find((sf) => sf.name === imgName || sf.name.endsWith(imgName)) : undefined;
            let descText = '';
            if (descM && descM.length > 1) {
              const lastDesc = descM[descM.length - 1].match(/\[([\s\S]*?)\]/);
              if (lastDesc) descText = lastDesc[1].trim();
            }
            if (imgName || titleM) {
              gridItems.push({ imageName: imgName, imageSrc: matchedSub?.content, title: titleM ? titleM[1].trim() : undefined, description: descText });
            }
          }
          if (gridItems.length > 0) {
            blocks.push({ id: `block_${lineNum}`, type: 'grid', gridItems: gridItems, rawSource: fullGrid, startLine: lineNum, endLine: currentLineIdx + Math.min(j, bodyLines.length - 1) + 1 });
          } else {
            blocks.push({ id: `block_${lineNum}`, type: 'macro-chip', commandName: '#grid', commandArgs: '(...)', rawSource: fullGrid, startLine: lineNum, endLine: currentLineIdx + Math.min(j, bodyLines.length - 1) + 1 });
          }
          i = j + 1;
          continue;
        }

        if (trimmed.startsWith('= ')) {
          blocks.push({ id: `block_${lineNum}`, type: 'heading', level: 1, titleText: trimmed.substring(2).trim(), rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        if (trimmed.startsWith('== ')) {
          blocks.push({ id: `block_${lineNum}`, type: 'heading', level: 2, titleText: trimmed.substring(3).trim(), rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        if (trimmed.startsWith('=== ')) {
          blocks.push({ id: `block_${lineNum}`, type: 'heading', level: 3, titleText: trimmed.substring(4).trim(), rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        if (/^#?pagebreak\b/.test(trimmed)) {
          blocks.push({ id: `block_${lineNum}`, type: 'pagebreak', commandName: '#pagebreak()', rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        const typstImgMatch = trimmed.match(/^#?image\s*\(\s*["']([^"']+)["']([\s\S]*?)\)/);
        if (typstImgMatch) {
          const imgName = typstImgMatch[1].trim();
          const matchedSub = subFiles.find((sf) => sf.name === imgName || sf.name.toLowerCase() === imgName.toLowerCase() || sf.name.endsWith(imgName));
          blocks.push({ id: `block_${lineNum}`, type: 'image', commandName: '#image', commandArgs: `("${imgName}"${typstImgMatch[2] || ''})`, imageSrc: matchedSub?.content || '', imageCaption: imgName, rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('+ ')) {
          const isNum = trimmed.startsWith('+ ');
          const prefix = isNum ? '+ ' : '- ';
          const listItems: string[] = [];
          const listRawLines: string[] = [];
          let j = i;
          while (j < bodyLines.length) {
            const l = bodyLines[j].trim();
            if (l.startsWith(prefix)) {
              listItems.push(l.substring(2).trim());
              listRawLines.push(bodyLines[j]);
              j++;
            } else if (l.startsWith('  ') && listItems.length > 0) {
              listItems[listItems.length - 1] += ' ' + l.trim();
              listRawLines.push(bodyLines[j]);
              j++;
            } else break;
          }
          blocks.push({ id: `block_${lineNum}`, type: 'list', listType: isNum ? 'numbered' : 'bullet', listItems: listItems, rawSource: listRawLines.join('\n'), startLine: lineNum, endLine: currentLineIdx + Math.max(i + 1, j) });
          i = Math.max(i + 1, j);
          continue;
        }
        if (/^#(?:set|show|let|import)\b/.test(trimmed)) {
          blocks.push({ id: `block_${lineNum}`, type: 'macro-chip', commandName: trimmed.split('(')[0] || trimmed.split(' ')[0], commandArgs: trimmed.includes('(') ? trimmed.substring(trimmed.indexOf('(')) : '', rawSource: rawLine, startLine: lineNum, endLine: lineNum });
          i++;
          continue;
        }
      }

      const paraLines: string[] = [];
      let j = i;
      while (j < bodyLines.length) {
        const l = bodyLines[j];
        const t = l.trim();
        if (j > i) {
          if (!t || t.startsWith('//') || t.startsWith('%')) break;
          if (isLatex && /^\\(?:section|subsection|subsubsection|newpage|begin|title|author)\b/.test(t)) break;
          if (isTypst && (t.startsWith('=') || t.startsWith('#align') || t.startsWith('- ') || t.startsWith('+ ') || t.startsWith('#image') || t.startsWith('#grid') || t.startsWith('#pagebreak') || /^#(?:set|show|let|import)\b/.test(t))) break;
        }
        paraLines.push(l);
        j++;
      }
      
      const safeEndLine = currentLineIdx + Math.max(i + 1, j);
      blocks.push({ id: `block_${lineNum}`, type: 'paragraph', bodyText: paraLines.join('\n'), rawSource: paraLines.join('\n'), startLine: lineNum, endLine: safeEndLine });
      i = Math.max(i + 1, j);

      // Failsafe: guarantee i strictly advances in every loop iteration
      if (i <= loopStartI) {
        i = loopStartI + 1;
      }
    }
    return { preamble, preambleLineCount, blocks };
  } catch (err) {
    console.error('Error parsing document in Visual Editor:', err);
    return {
      preamble: '',
      preambleLineCount: 0,
      blocks: [
        {
          id: 'block_fallback',
          type: 'paragraph',
          startLine: 1,
          endLine: text.split('\n').length || 1,
          rawSource: text,
          bodyText: text,
        },
      ],
    };
  }
}

/**
 * Authentic Overleaf Visual Editor Component — Theme Adaptive, Aligned Line Gutter, Responsive Grid & Bi-directional SyncTeX
 */
export function DocVisualEditor({
  content = '',
  onChange,
  format = 'latex',
  fileName = 'main.tex',
  subFiles = [],
  theme = 'dark',
  language = 'id',
  highlightLine = null,
  onSyncToPreview,
  onBlockFocus,
}: DocVisualEditorProps) {
  const [isPreambleOpen, setIsPreambleOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [syncedBlockId, setSyncedBlockId] = useState<string | null>(null);

  const isTypst = format === 'typst' || (fileName || '').endsWith('.typ');
  const isLatex = format === 'latex' || (fileName || '').endsWith('.tex');

  const { preamble, preambleLineCount, blocks } = useMemo(() => {
    return parseDocumentToVisualBlocks(content || '', isLatex, isTypst, subFiles);
  }, [content, isLatex, isTypst, subFiles]);

  // SyncTeX Jump: Scroll to and highlight visual block when highlightLine changes from preview
  useEffect(() => {
    if (typeof highlightLine !== 'number' || highlightLine <= 0) return;

    let target = blocks.find((b) => b.startLine <= highlightLine && highlightLine <= b.endLine);
    if (!target) {
      target = blocks.find((b) => b.startLine >= highlightLine) || blocks[blocks.length - 1];
    }

    if (target) {
      setSyncedBlockId(target.id);
      const el = document.getElementById(`visual_block_${target.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const timer = setTimeout(() => {
        setSyncedBlockId(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightLine, blocks]);

  const handlePreambleChange = (newPreamble: string) => {
    const bodyText = blocks.map((b) => b.rawSource).join('\n\n');
    const updated = newPreamble ? `${newPreamble}\n${bodyText}` : bodyText;
    onChange(updated);
  };

  const handleSaveBlockEdit = (blockId: string) => {
    const targetBlock = blocks.find((b) => b.id === blockId);
    if (!targetBlock) {
      setEditingBlockId(null);
      return;
    }
    let newRaw = editingText;
    if (targetBlock.type === 'heading') {
      if (isLatex) {
        if (targetBlock.rawSource.startsWith('\\title')) newRaw = `\\title{${editingText}}`;
        else if (targetBlock.level === 1) newRaw = `\\section{${editingText}}`;
        else if (targetBlock.level === 2) newRaw = `\\subsection{${editingText}}`;
        else newRaw = `\\subsubsection{${editingText}}`;
      } else if (isTypst) {
        const prefix = targetBlock.level === 1 ? '= ' : targetBlock.level === 2 ? '== ' : '=== ';
        newRaw = `${prefix}${editingText}`;
      }
    } else if (targetBlock.type === 'abstract') {
      newRaw = isLatex ? `\\begin{abstract}\n${editingText}\n\\end{abstract}` : `*Abstract* --- ${editingText}`;
    }
    const updatedBlocks = blocks.map((b) => (b.id === blockId ? { ...b, rawSource: newRaw } : b));
    const fullBody = updatedBlocks.map((b) => b.rawSource).join('\n\n');
    const updatedFull = preamble ? `${preamble}\n${fullBody}` : fullBody;
    onChange(updatedFull);
    setEditingBlockId(null);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter((b) => b.id !== blockId);
    const fullBody = updatedBlocks.map((b) => b.rawSource).join('\n\n');
    const updatedFull = preamble ? `${preamble}\n${fullBody}` : fullBody;
    onChange(updatedFull);
    if (editingBlockId === blockId) setEditingBlockId(null);
  };

  const handleInsertBlock = (afterBlockId: string, insertType: 'paragraph' | 'heading' | 'pagebreak') => {
    const idx = blocks.findIndex((b) => b.id === afterBlockId);
    let newRaw = '';
    if (insertType === 'heading') newRaw = isLatex ? '\\section{Judul Bagian Baru}' : '= Judul Bagian Baru';
    else if (insertType === 'pagebreak') newRaw = isLatex ? '\\newpage' : '#pagebreak()';
    else newRaw = 'Ketik paragraf teks baru di sini...';
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, { id: `block_new_${Date.now()}`, type: insertType, rawSource: newRaw, startLine: (blocks[idx]?.endLine || 1) + 1, endLine: (blocks[idx]?.endLine || 1) + 1, bodyText: newRaw, titleText: 'Judul Bagian Baru' });
    const fullBody = newBlocks.map((b) => b.rawSource).join('\n\n');
    const updatedFull = preamble ? `${preamble}\n${fullBody}` : fullBody;
    onChange(updatedFull);
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        backgroundColor: 'var(--bg-main, #0b0f19)',
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          backgroundColor: 'var(--bg-surface, #111827)',
          fontSize: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() => setIsPreambleOpen(!isPreambleOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '9px 18px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary, #94a3b8)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            textAlign: 'left',
            transition: 'background 0.15s ease',
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle, rgba(255,255,255,0.04))')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
            <FileText size={13} color="var(--brand-primary, #38bdf8)" style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {language === 'id' ? 'Pengaturan Dokumen / Preamble' : 'Show document preamble'}
            </span>
            <span
              style={{
                fontSize: '10.5px',
                color: 'var(--text-muted, #64748b)',
                backgroundColor: 'var(--bg-main, #0b0f19)',
                padding: '1px 7px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                flexShrink: 0,
              }}
            >
              {preambleLineCount} {language === 'id' ? 'baris' : 'lines'}
            </span>
          </div>
          {isPreambleOpen ? <ChevronDown size={14} style={{ flexShrink: 0 }} /> : <ChevronRight size={14} style={{ flexShrink: 0 }} />}
        </button>

        {isPreambleOpen && (
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: 'var(--bg-main, #0b0f19)',
              borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              boxSizing: 'border-box',
            }}
          >
            <textarea
              value={preamble}
              onChange={(e) => handlePreambleChange(e.target.value)}
              rows={Math.min(18, Math.max(5, preambleLineCount))}
              style={{
                width: '100%',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                lineHeight: '1.5',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-surface, #111827)',
                color: 'var(--text-primary, #f8fafc)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                borderRadius: '6px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: '20px 14px 48px 14px',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '860px',
            minWidth: 0,
            backgroundColor: 'var(--bg-surface, #131b2e)',
            color: 'var(--text-primary, #f8fafc)',
            borderRadius: '6px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            padding: '28px 20px 40px 12px',
            minHeight: '850px',
            boxSizing: 'border-box',
            gap: '8px',
            overflow: 'hidden',
          }}
        >
          {blocks.map((block) => {
            const isEditing = editingBlockId === block.id;
            const isHovered = hoveredBlockId === block.id;
            const isSynced = syncedBlockId === block.id;

            return (
              <div
                key={block.id}
                id={`visual_block_${block.id}`}
                onMouseEnter={() => {
                  setHoveredBlockId(block.id);
                  onBlockFocus?.(block.startLine);
                }}
                onMouseLeave={() => setHoveredBlockId(null)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onSyncToPreview?.(block.startLine, block.titleText || block.commandName);
                }}
                title={language === 'id' ? 'Klik 2x untuk SyncTeX lompat ke Pratinjau' : 'Double click for SyncTeX jump to Preview'}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  position: 'relative',
                  margin: '2px 0',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  boxShadow: isSynced
                    ? '0 0 0 2px var(--brand-primary, #38bdf8), 0 0 18px rgba(56, 189, 248, 0.35)'
                    : 'none',
                  backgroundColor: isSynced ? 'rgba(56, 189, 248, 0.04)' : 'transparent',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: '30px',
                    flexShrink: 0,
                    textAlign: 'right',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isSynced ? 'var(--brand-primary, #38bdf8)' : 'var(--text-muted, #64748b)',
                    fontWeight: isSynced ? 700 : 400,
                    paddingTop: '6px',
                    userSelect: 'none',
                    opacity: isHovered || isSynced ? 1 : 0.45,
                    transition: 'opacity 0.15s ease, color 0.2s ease',
                  }}
                >
                  {block.startLine}
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    maxWidth: '100%',
                    position: 'relative',
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    border: isEditing
                      ? '1px solid var(--brand-primary, #38bdf8)'
                      : isHovered
                      ? '1px dashed var(--border-strong, rgba(255,255,255,0.18))'
                      : '1px solid transparent',
                    padding: '4px 8px',
                  }}
                >
                  {isHovered && !isEditing && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '-14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'var(--bg-surface, #1e293b)',
                        border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        zIndex: 10,
                      }}
                    >
                      {onSyncToPreview && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSyncToPreview(block.startLine, block.titleText || block.commandName);
                          }}
                          title={language === 'id' ? 'SyncTeX: Lompat ke Pratinjau / PDF (Visual → Preview)' : 'SyncTeX: Jump to Preview'}
                          style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: 'var(--brand-primary, #38bdf8)',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11px',
                            fontWeight: 650,
                          }}
                        >
                          <Compass size={11} color="var(--brand-primary, #38bdf8)" />
                          <span>Sync</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingBlockId(block.id);
                          setEditingText(
                            block.type === 'heading'
                              ? block.titleText || ''
                              : block.type === 'cover'
                              ? `${block.titleText}\n${block.subtitleText}`
                              : block.type === 'abstract'
                              ? block.bodyText || ''
                              : block.rawSource
                          );
                        }}
                        title="Edit teks"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary, #94a3b8)',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        <Edit2 size={12} color="var(--brand-primary, #38bdf8)" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertBlock(block.id, 'paragraph')}
                        title="Tambah Paragraf di bawah"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary, #94a3b8)',
                          padding: '2px 4px',
                        }}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        title="Hapus blok"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          padding: '2px 4px',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}

                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        autoFocus
                        rows={Math.max(2, editingText.split('\n').length)}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          minWidth: 0,
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-main, #0b0f19)',
                          color: 'var(--text-primary, #f8fafc)',
                          border: '1px solid var(--brand-primary, #38bdf8)',
                          borderRadius: '6px',
                          outline: 'none',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setEditingBlockId(null)}
                          style={{
                            padding: '4px 12px',
                            fontSize: '11.5px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                            background: 'transparent',
                            color: 'var(--text-secondary, #94a3b8)',
                            cursor: 'pointer',
                          }}
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveBlockEdit(block.id)}
                          style={{
                            padding: '4px 14px',
                            fontSize: '11.5px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: 'var(--brand-primary, #0284c7)',
                            color: '#ffffff',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingBlockId(block.id);
                        setEditingText(
                          block.type === 'heading'
                            ? block.titleText || ''
                            : block.type === 'cover'
                            ? `${block.titleText}\n${block.subtitleText}`
                            : block.type === 'abstract'
                            ? block.bodyText || ''
                            : block.rawSource
                        );
                      }}
                      style={{
                        cursor: 'text',
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        boxSizing: 'border-box',
                      }}
                    >
                      {block.type === 'cover' && (
                        <div style={{ textAlign: 'center', margin: '14px 0 24px 0', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary, #f8fafc)', letterSpacing: '-0.02em', margin: '0 0 8px 0', lineHeight: 1.3, wordBreak: 'break-word' }}>{block.titleText}</h1>
                          {block.subtitleText && <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--brand-primary, #38bdf8)', margin: '0 0 14px 0', wordBreak: 'break-word' }}>{block.subtitleText}</div>}
                          <div style={{ width: '40%', height: '2px', backgroundColor: 'var(--brand-primary, #38bdf8)', margin: '0 auto', borderRadius: '2px', opacity: 0.6 }} />
                        </div>
                      )}
                      {block.type === 'heading' && (
                        <div style={{ textAlign: block.align || 'left', margin: block.level === 1 ? '16px 0 8px 0' : '14px 0 6px 0', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                          {block.level === 1 ? (
                            <h1 style={{ fontSize: block.align === 'center' ? '21px' : '18px', fontWeight: 800, color: 'var(--text-primary, #f8fafc)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.35, wordBreak: 'break-word' }}>
                              {cleanInlineFormatting(block.titleText || '')}
                            </h1>
                          ) : block.level === 2 ? (
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)', margin: 0, borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', paddingBottom: '4px', wordBreak: 'break-word' }}>
                              {cleanInlineFormatting(block.titleText || '')}
                            </h2>
                          ) : (
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', margin: 0, wordBreak: 'break-word' }}>
                              {cleanInlineFormatting(block.titleText || '')}
                            </h3>
                          )}
                        </div>
                      )}
                      {block.type === 'grid' && block.gridItems && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                            gap: '12px',
                            margin: '14px 0 20px 0',
                            alignItems: 'start',
                            width: '100%',
                            maxWidth: '100%',
                            minWidth: 0,
                            boxSizing: 'border-box',
                          }}
                        >
                          {block.gridItems.map((item, gIdx) => (
                            <div
                              key={gIdx}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'left',
                                backgroundColor: 'var(--bg-subtle, rgba(255,255,255,0.03))',
                                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                                borderRadius: '8px',
                                padding: '12px 10px',
                                boxSizing: 'border-box',
                                width: '100%',
                                minWidth: 0,
                                maxWidth: '100%',
                                overflow: 'hidden',
                              }}
                            >
                              {item.imageSrc ? (
                                <img
                                  src={item.imageSrc}
                                  alt={item.imageName || 'Card Image'}
                                  style={{
                                    width: '80px',
                                    height: '80px',
                                    maxWidth: '100%',
                                    aspectRatio: '1 / 1',
                                    objectFit: 'cover',
                                    borderRadius: '50%',
                                    marginBottom: '10px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--bg-surface, #1e293b)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '10px',
                                    color: 'var(--text-muted, #64748b)',
                                    flexShrink: 0,
                                  }}
                                >
                                  <ImageIcon size={22} />
                                </div>
                              )}
                              {item.title && (
                                <div
                                  style={{
                                    fontWeight: 700,
                                    fontSize: '13.5px',
                                    color: 'var(--text-primary, #f8fafc)',
                                    marginBottom: '4px',
                                    width: '100%',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                    textAlign: 'center',
                                  }}
                                >
                                  {item.title}
                                </div>
                              )}
                              {item.description && (
                                <p
                                  style={{
                                    fontSize: '12px',
                                    color: 'var(--text-secondary, #94a3b8)',
                                    lineHeight: 1.6,
                                    margin: 0,
                                    width: '100%',
                                    textAlign: 'justify',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere',
                                  }}
                                >
                                  {item.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {block.type === 'author' && (
                        <div style={{ textAlign: 'center', fontSize: '12.5px', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6, margin: '8px 0 16px 0', width: '100%', wordBreak: 'break-word' }}>
                          {block.bodyText?.split('\\\\').map((line, lIdx) => <div key={lIdx}>{cleanInlineFormatting(line.trim())}</div>)}
                        </div>
                      )}
                      {block.type === 'abstract' && (
                        <div style={{ margin: '14px 4px', padding: '12px 14px', backgroundColor: 'var(--bg-subtle, rgba(255,255,255,0.03))', borderRadius: '6px', borderLeft: '3px solid var(--brand-primary, #38bdf8)', boxSizing: 'border-box', width: '100%', minWidth: 0 }}>
                          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary, #f8fafc)' }}>Abstract</div>
                          <p style={{ fontSize: '12.5px', lineHeight: 1.7, color: 'var(--text-secondary, #94a3b8)', margin: 0, textAlign: 'justify', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{cleanInlineFormatting(block.bodyText || '')}</p>
                        </div>
                      )}
                      {(block.type === 'macro-chip' || block.type === 'pagebreak') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0', width: '100%', minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--brand-primary, #38bdf8)', userSelect: 'none', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {block.type === 'pagebreak' ? <FileMinus size={12} style={{ flexShrink: 0 }} /> : <Settings2 size={12} style={{ flexShrink: 0 }} />}
                            <span style={{ fontWeight: 600 }}>{block.commandName}</span>
                            {block.commandArgs && <span style={{ color: 'var(--text-muted, #64748b)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.commandArgs}</span>}
                          </div>
                          {block.type === 'pagebreak' && <div style={{ flex: 1, height: '1px', borderTop: '1px dashed rgba(56, 189, 248, 0.3)' }} />}
                        </div>
                      )}
                      {block.type === 'image' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '12px 0', padding: '12px', backgroundColor: 'var(--bg-subtle, rgba(255,255,255,0.03))', borderRadius: '6px', border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                          {block.imageSrc ? (
                            <img src={block.imageSrc} alt={block.imageCaption || 'Gambar'} style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', marginBottom: '8px' }} />
                          ) : (
                            <div style={{ width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted, #64748b)', backgroundColor: 'var(--bg-surface, #1e293b)', borderRadius: '4px', marginBottom: '8px', fontSize: '12px', maxWidth: '100%' }}>
                              <ImageIcon size={18} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{block.imageCaption || 'Gambar Terlampir'}</span>
                            </div>
                          )}
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted, #64748b)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <ImageIcon size={11} color="var(--brand-primary, #38bdf8)" style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.commandName}{block.commandArgs}</span>
                          </div>
                        </div>
                      )}
                      {block.type === 'list' && (
                        <div style={{ margin: '6px 0', paddingLeft: '20px', width: '100%', boxSizing: 'border-box' }}>
                          {block.listType === 'numbered' ? (
                            <ol style={{ margin: 0, padding: 0, fontSize: '13.5px', lineHeight: 1.75, wordBreak: 'break-word' }}>
                              {block.listItems?.map((it, itIdx) => <li key={itIdx} style={{ marginBottom: '4px' }}>{cleanInlineFormatting(it)}</li>)}
                            </ol>
                          ) : (
                            <ul style={{ margin: 0, padding: 0, fontSize: '13.5px', lineHeight: 1.75, wordBreak: 'break-word' }}>
                              {block.listItems?.map((it, itIdx) => <li key={itIdx} style={{ marginBottom: '4px' }}>{cleanInlineFormatting(it)}</li>)}
                            </ul>
                          )}
                        </div>
                      )}
                      {block.type === 'paragraph' && (
                        <p style={{ fontSize: '13.5px', lineHeight: 1.75, color: 'var(--text-primary, #f8fafc)', margin: 0, textAlign: block.align === 'center' ? 'center' : 'justify', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {cleanInlineFormatting(block.bodyText || block.rawSource)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
