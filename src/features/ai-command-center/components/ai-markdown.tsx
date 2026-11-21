import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-border/80 bg-zinc-950/90 overflow-hidden shadow-md text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/50 text-muted-foreground text-[11px] font-mono select-none">
        <span className="uppercase font-semibold tracking-wider text-primary">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto custom-scrollbar font-mono text-[11px] leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\)|\*.*?\*|https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];

    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      parts.push(
        <strong key={match.index} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      parts.push(
        <code
          key={match.index}
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
          key={match.index}
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
        <em key={match.index} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('http')) {
      parts.push(
        <a
          key={match.index}
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

export function AiMarkdown({ content, className }: { content: string; className?: string }) {
  if (!content) return null;

  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push(
          <CodeBlock
            key={`code-${i}`}
            language={codeBlockLang}
            code={codeBlockLines.join('\n')}
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

    // Headers
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

    // Unordered List (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      blocks.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-0.5 pl-1">
          <span className="text-primary font-bold text-xs shrink-0 select-none">•</span>
          <div className="flex-1 leading-relaxed">
            {renderInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}
          </div>
        </div>
      );
      continue;
    }

    // Ordered List (1., 2.)
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (orderedMatch) {
      blocks.push(
        <div key={`oli-${i}`} className="flex items-start gap-2 my-0.5 pl-1">
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
      />
    );
  }

  return <div className={cn('text-xs leading-relaxed space-y-0.5', className)}>{blocks}</div>;
}
