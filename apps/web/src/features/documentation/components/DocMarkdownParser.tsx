'use client';

import React, { useState } from 'react';
import { Copy, Check, Info, AlertTriangle, Lightbulb, AlertCircle } from 'lucide-react';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

export function renderMarkdownText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} style={{ color: 'var(--text-primary)' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          style={{
            background: 'var(--bg-subtle)',
            color: 'var(--brand-primary)',
            padding: '2px 6px',
            borderRadius: '5px',
            fontSize: '12.5px',
            fontFamily: 'JetBrains Mono, monospace',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function CopyCodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-input, #141414)',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 14px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            letterSpacing: '0.05em',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'transparent',
            border: 'none',
            color: copied ? 'var(--accent-success)' : 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '14px 16px',
          overflowX: 'auto',
          fontSize: '13px',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function AdmonitionBlock({ type, text }: { type: 'note' | 'tip' | 'warning' | 'important'; text: string }) {
  const configs = {
    note: {
      icon: <Info size={16} />,
      title: 'Note',
      border: 'var(--brand-primary)',
      bg: 'rgba(0, 115, 234, 0.07)',
      color: 'var(--brand-primary)',
    },
    tip: {
      icon: <Lightbulb size={16} />,
      title: 'Tip',
      border: 'var(--accent-success)',
      bg: 'rgba(0, 200, 117, 0.07)',
      color: 'var(--accent-success)',
    },
    warning: {
      icon: <AlertTriangle size={16} />,
      title: 'Warning',
      border: 'var(--accent-warning)',
      bg: 'rgba(253, 171, 61, 0.09)',
      color: 'var(--accent-warning)',
    },
    important: {
      icon: <AlertCircle size={16} />,
      title: 'Important',
      border: 'var(--accent-danger)',
      bg: 'rgba(226, 68, 92, 0.08)',
      color: 'var(--accent-danger)',
    },
  };

  const config = configs[type] || configs.note;

  return (
    <div
      style={{
        borderLeft: `4px solid ${config.border}`,
        background: config.bg,
        borderRadius: '0 8px 8px 0',
        padding: '12px 16px',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          fontWeight: 700,
          fontSize: '12.5px',
          color: config.color,
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        {config.icon}
        <span>{config.title}</span>
      </div>
      <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {renderMarkdownText(text)}
      </div>
    </div>
  );
}

export function parseMarkdownBlocks(rawMarkdown: string) {
  const lines = rawMarkdown.trim().split('\n');
  const blocks: React.ReactNode[] = [];
  let tableBuffer: string[] = [];
  let codeBuffer: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';

  const flushTable = () => {
    if (tableBuffer.length < 2) {
      tableBuffer = [];
      return;
    }
    const headers = tableBuffer[0].split('|').map((c) => c.trim()).filter(Boolean);
    const rows = tableBuffer.slice(2).map((r) =>
      r.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length)
    ).filter((r) => r.length > 0);

    blocks.push(
      <div
        key={`table-${blocks.length}`}
        className="markdown-table-wrapper"
        style={{
          overflowX: 'auto',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          margin: '16px 0',
          background: 'var(--bg-surface)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              {headers.map((h, hIdx) => (
                <th key={hIdx} style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {renderMarkdownText(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  borderBottom: rIdx < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  background: rIdx % 2 === 1 ? 'var(--bg-subtle)' : 'transparent',
                }}
              >
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                    {renderMarkdownText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim();
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        blocks.push(
          <CopyCodeBlock
            key={`code-${blocks.length}`}
            code={codeBuffer.join('\n')}
            lang={codeLang}
          />
        );
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      tableBuffer.push(line);
      continue;
    } else if (tableBuffer.length > 0) {
      flushTable();
    }

    // Admonitions / Callouts: > [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT]
    const calloutMatch = line.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*(.*)$/i);
    if (calloutMatch) {
      const type = calloutMatch[1].toLowerCase() as 'note' | 'tip' | 'warning' | 'important';
      const text = calloutMatch[2];
      blocks.push(<AdmonitionBlock key={`admonition-${blocks.length}`} type={type} text={text} />);
      continue;
    }

    // Standard blockquote
    if (line.trim().startsWith('> ')) {
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          style={{
            borderLeft: '3px solid var(--brand-primary)',
            padding: '8px 16px',
            margin: '14px 0',
            color: 'var(--text-secondary)',
            background: 'var(--bg-subtle)',
            borderRadius: '0 6px 6px 0',
            fontStyle: 'italic',
            fontSize: '13.5px',
          }}
        >
          {renderMarkdownText(line.trim().slice(2))}
        </blockquote>
      );
      continue;
    }

    if (line.trim() === '---') {
      blocks.push(
        <hr
          key={`hr-${blocks.length}`}
          style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '24px 0' }}
        />
      );
      continue;
    }

    if (line.startsWith('#### ')) {
      const headingText = line.replace('#### ', '').trim();
      const id = slugify(headingText);
      blocks.push(
        <h4
          key={`h4-${blocks.length}`}
          id={id}
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '18px 0 6px 0',
            scrollMarginTop: '80px',
          }}
        >
          {renderMarkdownText(headingText)}
        </h4>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      const headingText = line.replace('### ', '').trim();
      const id = slugify(headingText);
      blocks.push(
        <h3
          key={`h3-${blocks.length}`}
          id={id}
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '22px 0 8px 0',
            scrollMarginTop: '80px',
          }}
        >
          {headingText}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      const headingText = line.replace('## ', '').trim();
      const id = slugify(headingText);
      blocks.push(
        <h2
          key={`h2-${blocks.length}`}
          id={id}
          style={{
            fontSize: '21px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '28px 0 10px 0',
            scrollMarginTop: '80px',
          }}
        >
          {headingText}
        </h2>
      );
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      blocks.push(
        <li
          key={`li-${blocks.length}`}
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginLeft: '20px',
            marginBottom: '4px',
          }}
        >
          {renderMarkdownText(line.trim().slice(2))}
        </li>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      const num = line.trim().split('.')[0];
      const rest = line.trim().replace(/^\d+\.\s/, '');
      blocks.push(
        <div
          key={`num-${blocks.length}`}
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginLeft: '8px',
            display: 'flex',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--brand-primary)', minWidth: '18px' }}>
            {num}.
          </span>
          <div>{renderMarkdownText(rest)}</div>
        </div>
      );
      continue;
    }

    if (line.trim()) {
      blocks.push(
        <p
          key={`p-${blocks.length}`}
          style={{
            fontSize: '14.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.75,
            margin: '8px 0',
          }}
        >
          {renderMarkdownText(line)}
        </p>
      );
    }
  }

  if (tableBuffer.length > 0) flushTable();
  return blocks;
}
