'use client';

import React, { useState } from 'react';
import { Copy, Check, Play, Zap } from 'lucide-react';
import { useBuildStore } from '../../features/chat/store/useBuildStore';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div
      className="markdown-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '14px',
        lineHeight: 1.65,
        color: 'var(--text-primary)',
        wordBreak: 'break-word',
      }}
    >
      {parseMarkdown(content)}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const openArtifact = useBuildStore((s) => s.openArtifact);
  const currentLanguage = useSettingsStore((s) => s.language);
  const tb = getTranslation(currentLanguage).buildMode;

  const normalizedLang = (language || '').toLowerCase().trim();
  const isPreviewable =
    ['html', 'htm', 'jsx', 'tsx', 'javascript', 'js', 'react', 'svg', 'xml'].includes(normalizedLang) ||
    code.includes('<!DOCTYPE html>') ||
    code.includes('<html') ||
    code.includes('<svg') ||
    code.includes('function App(') ||
    code.includes('export default function');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunInBuildMode = () => {
    openArtifact(code, normalizedLang || 'html', `${normalizedLang.toUpperCase() || 'App'} Artifact`);
  };

  return (
    <div
      style={{
        margin: '6px 0',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 12px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <span style={{ textTransform: 'lowercase', fontWeight: 600 }}>
          {language || 'text'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isPreviewable && (
            <button
              type="button"
              onClick={handleRunInBuildMode}
              style={{
                background: 'var(--brand-subtle, rgba(0, 115, 234, 0.12))',
                border: '1px solid var(--brand-primary)',
                color: 'var(--brand-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Play size={10} fill="currentColor" />
              <span>{tb.runInBuildMode}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              color: copied ? 'var(--accent-success)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              padding: '2px 4px',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '12px 14px',
          overflowX: 'auto',
          fontSize: '13px',
          lineHeight: 1.5,
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-primary)',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Render inline formatting safely without recursive RegExp splitting.
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  if (!text) return [];

  const tokens: React.ReactNode[] = [];
  // Tokenize bold, italic, inline code, strike, and links
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  parts.forEach((part, i) => {
    if (!part) return;

    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      tokens.push(
        <code
          key={i}
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1px 5px',
            fontSize: '12px',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--brand-primary)',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
      tokens.push(
        <strong key={i} style={{ fontWeight: 650, color: 'var(--text-primary)' }}>
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      tokens.push(
        <em key={i} style={{ fontStyle: 'italic' }}>
          {part.slice(1, -1)}
        </em>
      );
    } else if (part.startsWith('~~') && part.endsWith('~~') && part.length > 3) {
      tokens.push(
        <del key={i} style={{ textDecoration: 'line-through', opacity: 0.7 }}>
          {part.slice(2, -2)}
        </del>
      );
    } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        tokens.push(
          <a
            key={i}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--brand-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              wordBreak: 'break-all',
            }}
          >
            {match[1]}
          </a>
        );
      } else {
        tokens.push(part);
      }
    } else {
      tokens.push(part);
    }
  });

  return tokens;
}

/**
 * High-performance, 100% memory-safe single-pass Markdown parser.
 * Strictly guarantees progress on every loop iteration to prevent infinite loops.
 */
function parseMarkdown(md: string): React.ReactNode[] {
  if (!md) return [];

  const elements: React.ReactNode[] = [];
  const lines = md.split('\n');
  let i = 0;
  let keyIndex = 0;

  while (i < lines.length) {
    const startIndex = i;
    const line = lines[i];

    // 1. Code Blocks: ```lang ... ```
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // Skip closing ```
      elements.push(
        <CodeBlock key={keyIndex++} code={codeLines.join('\n')} language={language} />
      );
      continue;
    }

    // 2. Headings: # H1, ## H2, ### H3, #### H4
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      elements.push(
        <h1
          key={keyIndex++}
          style={{
            fontSize: '20px',
            fontWeight: 700,
            margin: '8px 0 4px 0',
            color: 'var(--text-primary)',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '4px',
          }}
        >
          {renderInlineFormatting(h1Match[1])}
        </h1>
      );
      i++;
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      elements.push(
        <h2
          key={keyIndex++}
          style={{
            fontSize: '17px',
            fontWeight: 650,
            margin: '6px 0 3px 0',
            color: 'var(--text-primary)',
          }}
        >
          {renderInlineFormatting(h2Match[1])}
        </h2>
      );
      i++;
      continue;
    }

    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      elements.push(
        <h3
          key={keyIndex++}
          style={{
            fontSize: '15px',
            fontWeight: 600,
            margin: '4px 0 2px 0',
            color: 'var(--text-primary)',
          }}
        >
          {renderInlineFormatting(h3Match[1])}
        </h3>
      );
      i++;
      continue;
    }

    const h4Match = line.match(/^####\s+(.+)$/);
    if (h4Match) {
      elements.push(
        <h4
          key={keyIndex++}
          style={{
            fontSize: '14px',
            fontWeight: 600,
            margin: '3px 0 2px 0',
            color: 'var(--text-primary)',
          }}
        >
          {renderInlineFormatting(h4Match[1])}
        </h4>
      );
      i++;
      continue;
    }

    // 3. Blockquotes: > text
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={keyIndex++}
          style={{
            margin: '4px 0',
            padding: '8px 14px',
            borderLeft: '3px solid var(--brand-primary)',
            background: 'var(--bg-subtle)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
          }}
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} style={{ margin: 0 }}>
              {renderInlineFormatting(ql)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 4. Horizontal Rule: --- or ***
    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      elements.push(
        <hr
          key={keyIndex++}
          style={{
            border: 'none',
            borderTop: '1px solid var(--border-subtle)',
            margin: '12px 0',
          }}
        />
      );
      i++;
      continue;
    }

    // 5. Unordered List items: - or *
    if (line.match(/^[-*]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        listItems.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul
          key={keyIndex++}
          style={{
            margin: '2px 0',
            paddingLeft: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {listItems.map((item, lIdx) => (
            <li key={lIdx}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Numbered List items: 1. 2. 3.
    if (line.match(/^[0-9]+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[0-9]+\.\s+/)) {
        listItems.push(lines[i].replace(/^[0-9]+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol
          key={keyIndex++}
          style={{
            margin: '2px 0',
            paddingLeft: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {listItems.map((item, lIdx) => (
            <li key={lIdx}>{renderInlineFormatting(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Markdown Tables: | col1 | col2 |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) =>
          rowStr
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());

        const headers = parseRow(tableLines[0]);
        const bodyRows = tableLines.slice(2).map(parseRow);

        elements.push(
          <div
            key={keyIndex++}
            className="markdown-table-wrapper"
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              margin: '8px 0',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              maxWidth: '100%',
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: '520px',
                borderCollapse: 'collapse',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  {headers.map((h, hIdx) => (
                    <th
                      key={hIdx}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--border-strong)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {renderInlineFormatting(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    style={{
                      borderBottom:
                        rIdx === bodyRows.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                    }}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        style={{
                          padding: '7px 12px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {renderInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else {
        // Fallback for single table line
        elements.push(
          <p key={keyIndex++} style={{ margin: 0, lineHeight: 1.65 }}>
            {tableLines.map((tl, tlIdx) => (
              <React.Fragment key={tlIdx}>
                {renderInlineFormatting(tl)}
                {tlIdx < tableLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      }
      continue;
    }

    // 8. Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // 9. Regular paragraph
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].match(/^#{1,6}\s+/) &&
      !lines[i].startsWith('>') &&
      !lines[i].match(/^[-*]\s+/) &&
      !lines[i].match(/^[0-9]+\.\s+/) &&
      !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) &&
      lines[i].trim() !== '---'
    ) {
      pLines.push(lines[i]);
      i++;
    }

    if (pLines.length > 0) {
      elements.push(
        <p key={keyIndex++} style={{ margin: 0, lineHeight: 1.65 }}>
          {pLines.map((pl, plIdx) => (
            <React.Fragment key={plIdx}>
              {renderInlineFormatting(pl)}
              {plIdx < pLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    }

    // Unconditional safety guard: If i did not advance, forcefully advance by 1
    if (i === startIndex) {
      i++;
    }
  }

  return elements;
}
