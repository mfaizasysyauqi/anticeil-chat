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
  if (!content) return null;

  // Automatically parse artifacts if embedded in content
  const { cleanContent, artifacts: parsedArtifacts } = useMemo(() => {
    return parseArtifactsFromMessage(content);
  }, [content]);

  const allArtifacts = useMemo(() => {
    const list = [...(providedArtifacts || [])];
    parsedArtifacts.forEach((pa) => {
      if (!list.some((a) => a.id === pa.id)) list.push(pa);
    });
    return list;
  }, [providedArtifacts, parsedArtifacts]);

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
        onOpenAsArtifact={onOpenArtifact}
      />
    );
  }

  return <div className={cn('text-xs leading-relaxed space-y-0.5', className)}>{blocks}</div>;
}
