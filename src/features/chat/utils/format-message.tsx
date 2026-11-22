import React from 'react';
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

export function renderFormattedMessage(content: string) {
  if (!content) return null;
  const lines = content.split('\n');

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
          <strong key={`${lineIdx}-${match.index}`} className="font-semibold text-foreground">
            {token.slice(2, -2)}
          </strong>,
        );
      } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        tokens.push(
          <code
            key={`${lineIdx}-${match.index}`}
            className="px-1.5 py-0.5 rounded bg-muted/80 font-mono text-[11px] text-primary border border-border/40 inline-block align-baseline"
          >
            {token.slice(1, -1)}
          </code>,
        );
      } else if (token.startsWith('@')) {
        tokens.push(
          <span
            key={`${lineIdx}-${match.index}`}
            className="px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary font-medium hover:underline cursor-pointer inline-block"
          >
            {token}
          </span>,
        );
      } else if (token.startsWith('http')) {
        tokens.push(
          <a
            key={`${lineIdx}-${match.index}`}
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
      <React.Fragment key={lineIdx}>
        {tokens}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}
