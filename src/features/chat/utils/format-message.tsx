import React from 'react';
import { cn } from '@/lib/utils';
import { isEncryptedMessage, decryptMessage, getDecryptedCachedText } from '@/lib/e2ee';

export function DecryptedMessageText({
  content,
  channelId,
  inline = false,
}: {
  content: string;
  channelId?: string;
  inline?: boolean;
}) {
  const [decryptedText, setDecryptedText] = React.useState<string>(() => {
    if (!isEncryptedMessage(content)) return content;
    const cached = getDecryptedCachedText(content);
    if (cached) return cached;
    return '';
  });
  const [isEncrypted, setIsEncrypted] = React.useState<boolean>(() => isEncryptedMessage(content));

  React.useEffect(() => {
    let isMounted = true;
    if (!isEncryptedMessage(content)) {
      setDecryptedText(content);
      setIsEncrypted(false);
      return;
    }

    const cached = getDecryptedCachedText(content);
    if (cached) {
      setDecryptedText(cached);
      setIsEncrypted(true);
      return;
    }

    if (channelId) {
      decryptMessage(content, channelId).then((res) => {
        if (isMounted) {
          setDecryptedText(res.text);
          setIsEncrypted(res.isEncrypted);
        }
      });
    } else {
      setDecryptedText('🔒 [Pesan]');
      setIsEncrypted(true);
    }
    return () => {
      isMounted = false;
    };
  }, [content, channelId]);

  if (inline) {
    return (
      <span className="inline align-middle">
        {renderFormattedMessage(decryptedText || (isEncrypted ? 'Mendekripsi pesan...' : content))}
      </span>
    );
  }

  return (
    <div>
      <span className="align-middle">
        {renderFormattedMessage(decryptedText || (isEncrypted ? 'Mendekripsi pesan...' : content))}
      </span>
    </div>
  );
}

function renderInlineText(text: string, baseKey: string | number) {
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|@[\w\.-]+|https?:\/\/[^\s]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(line.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        tokens.push(
          <strong key={`${baseKey}-${lineIdx}-${match.index}`} className="font-semibold text-foreground">
            {token.slice(2, -2)}
          </strong>,
        );
      } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        tokens.push(
          <code
            key={`${baseKey}-${lineIdx}-${match.index}`}
            className="px-1.5 py-0.5 rounded bg-muted/80 font-mono text-[11px] text-primary border border-border/40 inline-block align-baseline"
          >
            {token.slice(1, -1)}
          </code>,
        );
      } else if (token.startsWith('@')) {
        const isAtlas = token.toLowerCase() === '@atlas' || token.toLowerCase() === '@atlas-agent';
        tokens.push(
          <span
            key={`${baseKey}-${lineIdx}-${match.index}`}
            className={cn(
              'px-1.5 py-0.5 rounded-md font-medium hover:underline cursor-pointer inline-flex items-center gap-1 align-baseline transition-all',
              isAtlas
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold shadow-xs'
                : 'bg-primary/15 text-primary rounded-sm'
            )}
          >
            {isAtlas && (
              <img
                src="/atlas-head.png"
                alt="Atlas"
                className="w-3.5 h-3.5 rounded-full object-cover shrink-0 inline-block align-middle"
              />
            )}
            <span>{token}</span>
          </span>,
        );
      } else if (token.startsWith('http')) {
        tokens.push(
          <a
            key={`${baseKey}-${lineIdx}-${match.index}`}
            href={token}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {token}
          </a>,
        );
      } else {
        tokens.push(token);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      tokens.push(line.substring(lastIndex));
    }

    return (
      <React.Fragment key={`${baseKey}-${lineIdx}`}>
        {tokens}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export function renderFormattedMessage(content: string) {
  if (!content) return null;

  // Split by fenced code blocks: ```(lang)?\n(code)\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\s*?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderInlineText(content.substring(lastIndex, match.index), `text-${lastIndex}`));
    }

    const language = (match[1] || 'code').trim();
    const code = match[2].trimEnd();

    parts.push(
      <div
        key={`code-${match.index}`}
        className="my-2.5 rounded-xl overflow-hidden border border-border/70 bg-[#090a0f] shadow-md max-w-2xl select-text"
      >
        <div className="px-3.5 py-1.5 bg-[#12131a] border-b border-border/50 flex items-center justify-between text-[11px] font-mono select-none">
          <span className="font-bold text-[#2cfae6] tracking-wider uppercase">{language}</span>
          <span className="text-[10px] text-muted-foreground/70 font-sans">Anticeil SDK</span>
        </div>
        <pre className="p-3.5 overflow-x-auto text-[12px] font-mono text-[#a5f3fc] bg-[#090a0f] leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>,
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(renderInlineText(content.substring(lastIndex), `text-${lastIndex}`));
  }

  return parts;
}
