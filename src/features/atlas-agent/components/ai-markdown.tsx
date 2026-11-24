import React, { useState, useMemo } from 'react';
import { Copy, Check, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiArtifact } from '../types';
import { parseArtifactsFromMessage } from '../utils/artifact-parser';
import { ArtifactCard } from './artifact-card';

interface CodeBlockProps {
  language: string;
  code: string;
  onOpenAsArtifact?: (artifact: AiArtifact) => void;
}

function CodeBlock({ language, code, onOpenAsArtifact }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenArtifact = () => {
    const lang = (language || 'code').toLowerCase();
    const isHtml = lang === 'html';
    const isSvg = lang === 'svg';
    const isReact = lang === 'jsx' || lang === 'tsx' || lang === 'react';

    const art: AiArtifact = {
      id: `code_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      identifier: `code_${Date.now()}`,
      type: isHtml
        ? 'text/html'
        : isSvg
        ? 'image/svg+xml'
        : isReact
        ? 'application/vnd.ant.react'
        : 'application/vnd.ant.code',
      title: isHtml
        ? 'HTML Web App'
        : isSvg
        ? 'SVG Vector Graphic'
        : `${(language || 'code').toUpperCase()} Code Snippet`,
      language: lang,
      content: code,
      createdAt: new Date().toISOString(),
    };
    onOpenAsArtifact?.(art);
  };

  const canBeArtifact =
    code.trim().length > 30 ||
    ['html', 'svg', 'react', 'jsx', 'tsx', 'mermaid', 'python', 'javascript'].includes(
      (language || '').toLowerCase()
    );

  return (
    <div className="my-2.5 rounded-xl border border-border/80 bg-zinc-950/90 overflow-hidden shadow-md text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/50 text-muted-foreground text-[11px] font-mono select-none">
        <span className="uppercase font-semibold tracking-wider text-primary">{language || 'code'}</span>
        <div className="flex items-center gap-2.5">
          {canBeArtifact && onOpenAsArtifact && (
            <button
              type="button"
              onClick={handleOpenArtifact}
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer"
              title="Buka dan Pratinjau sebagai Artifact"
            >
              <Eye className="w-3 h-3" />
              <span>Artifact</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>
      <pre className="p-3 overflow-x-auto custom-scrollbar font-mono text-[11px] leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function isPotentialTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes('|') && !trimmed.startsWith('```');
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|') || !trimmed.includes('-')) return false;
  let s = trimmed;
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  const parts = s.split('|');
  return parts.length >= 1 && parts.every((p) => /^[\s:-]+$/.test(p) && p.includes('-'));
}

function splitTableCells(rowLine: string): string[] {
  let trimmed = rowLine.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);

  const cells: string[] = [];
  let current = '';
  let escaped = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (char === '\\' && !escaped) {
      escaped = true;
    } else if (char === '|' && !escaped) {
      cells.push(current.trim());
      current = '';
    } else {
      if (escaped) {
        current += '\\';
        escaped = false;
      }
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function getColumnAlignments(separatorLine: string): Array<'left' | 'center' | 'right'> {
  const cells = splitTableCells(separatorLine);
  return cells.map((cell) => {
    const trimmed = cell.trim();
    const starts = trimmed.startsWith(':');
    const ends = trimmed.endsWith(':');
    if (starts && ends) return 'center';
    if (ends) return 'right';
    return 'left';
  });
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  const regex =
    /(<br\s*\/?>|<strong>[\s\S]*?<\/strong>|<b>[\s\S]*?<\/b>|<em>[\s\S]*?<\/em>|<i>[\s\S]*?<\/i>|<code>[\s\S]*?<\/code>|\*\*.*?\*\*|~~.*?~~|`.*?`|\[.*?\]\(.*?\)|\*.*?\*|@[a-zA-Z0-9_]+|#[a-zA-Z0-9_-]+|https?:\/\/[^\s]+)/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];

    if (/^<br\s*\/?>$/i.test(token)) {
      parts.push(<br key={`br-${match.index}`} />);
    } else if (/^<strong>([\s\S]*?)<\/strong>$/i.test(token) || /^<b>([\s\S]*?)<\/b>$/i.test(token)) {
      const inner = token.replace(/^<(?:strong|b)>/i, '').replace(/<\/(?:strong|b)>$/i, '');
      parts.push(
        <strong key={`str-${match.index}`} className="font-bold text-foreground">
          {renderInlineMarkdown(inner)}
        </strong>
      );
    } else if (/^<em>([\s\S]*?)<\/em>$/i.test(token) || /^<i>([\s\S]*?)<\/i>$/i.test(token)) {
      const inner = token.replace(/^<(?:em|i)>/i, '').replace(/<\/(?:em|i)>$/i, '');
      parts.push(
        <em key={`em-${match.index}`} className="italic text-foreground/90">
          {renderInlineMarkdown(inner)}
        </em>
      );
    } else if (/^<code>([\s\S]*?)<\/code>$/i.test(token)) {
      const inner = token.replace(/^<code>/i, '').replace(/<\/code>$/i, '');
      parts.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-[11px] text-primary border border-border/40 inline-block align-baseline font-medium"
        >
          {inner}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      parts.push(
        <strong key={`b-${match.index}`} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('~~') && token.endsWith('~~') && token.length > 4) {
      parts.push(
        <del key={`del-${match.index}`} className="line-through text-muted-foreground">
          {token.slice(2, -2)}
        </del>
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      parts.push(
        <code
          key={`c-${match.index}`}
          className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-[11px] text-primary border border-border/40 inline-block align-baseline font-medium"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const splitIdx = token.indexOf('](');
      const label = token.slice(1, splitIdx);
      const url = token.slice(splitIdx + 2, -1);
      parts.push(
        <a
          key={`a-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80 font-medium"
        >
          {label}
        </a>
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      parts.push(
        <em key={`i-${match.index}`} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('@') && token.length > 1) {
      parts.push(
        <span
          key={`mention-${match.index}`}
          className="px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-medium text-[11px] inline-flex items-center align-baseline hover:bg-primary/25 transition-colors"
        >
          {token}
        </span>
      );
    } else if (token.startsWith('#') && token.length > 1 && !token.includes(' ')) {
      parts.push(
        <span
          key={`channel-${match.index}`}
          className="px-1.5 py-0.5 rounded-md bg-muted text-foreground/90 font-medium text-[11px] inline-flex items-center align-baseline border border-border/40"
        >
          {token}
        </span>
      );
    } else if (token.startsWith('http')) {
      parts.push(
        <a
          key={`url-${match.index}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          {token}
        </a>
      );
    } else {
      parts.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export interface AiMarkdownProps {
  content: string;
  className?: string;
  artifacts?: AiArtifact[];
  onOpenArtifact?: (artifact: AiArtifact) => void;
  activeArtifactId?: string;
}

export function AiMarkdown({
  content,
  className,
  artifacts: providedArtifacts,
  onOpenArtifact,
  activeArtifactId,
}: AiMarkdownProps) {
  // Automatically parse artifacts if embedded in content
  const { cleanContent, artifacts: parsedArtifacts } = useMemo(() => {
    return content ? parseArtifactsFromMessage(content) : { cleanContent: '', artifacts: [] };
  }, [content]);

  const allArtifacts = useMemo(() => {
    const list = [...(providedArtifacts || [])];
    parsedArtifacts.forEach((pa) => {
      if (!list.some((a) => a.id === pa.id)) list.push(pa);
    });
    return list;
  }, [providedArtifacts, parsedArtifacts]);

  if (!content) return null;

  const blocks: React.ReactNode[] = [];
  const lines = cleanContent.split('\n');
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for artifact token placeholder
    if (line.trim().startsWith(':::artifact{') || line.trim() === ':::') {
      if (line.trim().startsWith(':::artifact{')) {
        const idMatch = line.match(/id="([^"]*)"/);
        const artId = idMatch ? idMatch[1] : '';
        const targetArt = allArtifacts.find((a) => a.id === artId || a.identifier === artId);
        if (targetArt) {
          blocks.push(
            <ArtifactCard
              key={`artifact-${artId}-${i}`}
              artifact={targetArt}
              onClick={() => onOpenArtifact?.(targetArt)}
              isActive={activeArtifactId === targetArt.id || activeArtifactId === targetArt.identifier}
            />
          );
        }
      }
      continue;
    }

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push(
          <CodeBlock
            key={`code-${i}`}
            language={codeBlockLang}
            code={codeBlockLines.join('\n')}
            onOpenAsArtifact={onOpenArtifact}
          />
        );
        inCodeBlock = false;
        codeBlockLang = '';
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Check for Markdown Table (Header followed by separator row)
    if (isPotentialTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headerLine = line;
      const separatorLine = lines[i + 1];
      const headers = splitTableCells(headerLine);
      const alignments = getColumnAlignments(separatorLine);
      const rows: string[][] = [];

      let j = i + 2;
      while (j < lines.length && isPotentialTableRow(lines[j]) && !isTableSeparator(lines[j])) {
        const rowCells = splitTableCells(lines[j]);
        // Normalize column count to match headers
        while (rowCells.length < headers.length) {
          rowCells.push('');
        }
        rows.push(rowCells);
        j++;
      }
      i = j - 1; // Advance loop to end of table

      blocks.push(
        <div
          key={`table-${i}`}
          className="my-3 w-full overflow-x-auto rounded-xl border border-border/80 bg-zinc-950/60 shadow-xs custom-scrollbar"
        >
          <table className="w-full text-xs text-left border-collapse min-w-[340px]">
            <thead>
              <tr className="border-b border-border/80 bg-muted/60">
                {headers.map((h, idx) => (
                  <th
                    key={`th-${idx}`}
                    className={cn(
                      'px-3.5 py-2.5 font-bold text-foreground text-xs select-none',
                      alignments[idx] === 'center' && 'text-center',
                      alignments[idx] === 'right' && 'text-right'
                    )}
                  >
                    {renderInlineMarkdown(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.map((row, rIdx) => (
                <tr
                  key={`tr-${rIdx}`}
                  className="transition-colors hover:bg-muted/20 even:bg-muted/10"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={`td-${rIdx}-${cIdx}`}
                      className={cn(
                        'px-3.5 py-2.5 align-top text-foreground/90 leading-relaxed text-xs break-words',
                        alignments[cIdx] === 'center' && 'text-center',
                        alignments[cIdx] === 'right' && 'text-right'
                      )}
                    >
                      {renderInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${i}`} className="my-3 border-t border-border/70" />);
      continue;
    }

    // Task List (- [ ] or - [x])
    const taskMatch = trimmed.match(/^[-*•]\s+\[([ xX])\]\s+(.*)/);
    if (taskMatch) {
      const isChecked = taskMatch[1].toLowerCase() === 'x';
      blocks.push(
        <div key={`task-${i}`} className="flex items-center gap-2 my-1 pl-1">
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="h-3.5 w-3.5 rounded border-border text-primary pointer-events-none accent-primary"
          />
          <span
            className={cn(
              'text-xs leading-relaxed',
              isChecked && 'line-through text-muted-foreground'
            )}
          >
            {renderInlineMarkdown(taskMatch[2])}
          </span>
        </div>
      );
      continue;
    }

    // Headers
    if (trimmed.startsWith('#### ')) {
      blocks.push(
        <h5 key={`h5-${i}`} className="text-xs font-bold text-foreground mt-2 mb-0.5">
          {renderInlineMarkdown(trimmed.slice(5))}
        </h5>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={`h4-${i}`} className="text-xs font-bold text-foreground mt-2 mb-1">
          {renderInlineMarkdown(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={`h3-${i}`} className="text-sm font-bold text-foreground mt-2.5 mb-1">
          {renderInlineMarkdown(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={`h2-${i}`} className="text-base font-black text-foreground mt-3 mb-1.5">
          {renderInlineMarkdown(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-primary/60 pl-2.5 my-1.5 text-muted-foreground italic text-xs"
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or * or •) with indentation support
    if (/^[-*•]\s+/.test(trimmed)) {
      const indent = line.search(/\S/);
      const plClass = indent >= 4 ? 'pl-6' : indent >= 2 ? 'pl-3.5' : 'pl-1';
      blocks.push(
        <div key={`li-${i}`} className={cn('flex items-start gap-2 my-0.5', plClass)}>
          <span className="text-primary font-bold text-xs shrink-0 select-none">•</span>
          <div className="flex-1 leading-relaxed">
            {renderInlineMarkdown(trimmed.replace(/^[-*•]\s+/, ''))}
          </div>
        </div>
      );
      continue;
    }

    // Ordered List (1., 2.) with indentation support
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (orderedMatch) {
      const indent = line.search(/\S/);
      const plClass = indent >= 4 ? 'pl-6' : indent >= 2 ? 'pl-3.5' : 'pl-1';
      blocks.push(
        <div key={`oli-${i}`} className={cn('flex items-start gap-2 my-0.5', plClass)}>
          <span className="text-primary font-bold text-xs shrink-0 select-none font-mono">
            {orderedMatch[1]}.
          </span>
          <div className="flex-1 leading-relaxed">
            {renderInlineMarkdown(orderedMatch[2])}
          </div>
        </div>
      );
      continue;
    }

    // Normal paragraph line
    blocks.push(
      <p key={`p-${i}`} className="leading-relaxed my-0.5">
        {renderInlineMarkdown(line)}
      </p>
    );
  }

  if (inCodeBlock && codeBlockLines.length > 0) {
    blocks.push(
      <CodeBlock
        key="unclosed-code"
        language={codeBlockLang}
        code={codeBlockLines.join('\n')}
        onOpenAsArtifact={onOpenArtifact}
      />
    );
  }

  return <div className={cn('text-xs leading-relaxed space-y-0.5', className)}>{blocks}</div>;
}
