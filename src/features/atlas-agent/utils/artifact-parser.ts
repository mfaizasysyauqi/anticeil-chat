import type { AiArtifact } from '../types';

export function parseArtifactsFromMessage(rawContent: string): {
  cleanContent: string;
  artifacts: AiArtifact[];
} {
  if (!rawContent) return { cleanContent: '', artifacts: [] };

  const artifacts: AiArtifact[] = [];

  // Regex to match <antArtifact ...>...</antArtifact> or <artifact ...>...</artifact>
  const artifactTagRegex = /<(?:antArtifact|artifact)\s+([^>]*?)>([\s\S]*?)(?:<\/(?:antArtifact|artifact)>|$)/gi;

  const cleanContent = rawContent.replace(artifactTagRegex, (match, attrsStr, body) => {
    // Helper to safely extract attribute values
    const extractAttr = (name: string): string => {
      const regex = new RegExp(`${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
      const attrMatch = attrsStr.match(regex);
      return attrMatch ? (attrMatch[1] || attrMatch[2] || attrMatch[3] || '') : '';
    };

    const identifier = extractAttr('identifier') || `artifact_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const type = extractAttr('type') || 'text/html';
    const title = extractAttr('title') || 'Artifact';
    const language = extractAttr('language') || (type.includes('html') ? 'html' : type.includes('svg') ? 'svg' : type.includes('react') ? 'jsx' : 'code');
    const content = body.trim();

    const artifact: AiArtifact = {
      id: identifier,
      identifier,
      type,
      title,
      language,
      content,
      createdAt: new Date().toISOString(),
    };

    artifacts.push(artifact);

    // Replace XML in the message text with a custom artifact marker token
    return `\n\n:::artifact{id="${identifier}" title="${title}" type="${type}" language="${language}"}\n:::\n\n`;
  });

  return {
    cleanContent: cleanContent.trim(),
    artifacts,
  };
}

export function getArtifactFileExtension(artifact: AiArtifact): string {
  const type = artifact.type.toLowerCase();
  const lang = (artifact.language || '').toLowerCase();

  if (type.includes('html') || lang === 'html') return 'html';
  if (type.includes('svg') || lang === 'svg') return 'svg';
  if (type.includes('markdown') || lang === 'md' || lang === 'markdown') return 'md';
  if (type.includes('mermaid') || lang === 'mermaid') return 'mmd';
  if (type.includes('react') || lang === 'jsx' || lang === 'tsx') return 'jsx';

  switch (lang) {
    case 'python':
    case 'py':
      return 'py';
    case 'javascript':
    case 'js':
      return 'js';
    case 'typescript':
    case 'ts':
      return 'ts';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'sql':
      return 'sql';
    case 'bash':
    case 'sh':
      return 'sh';
    default:
      return 'txt';
  }
}

export function isArtifactPreviewable(artifact: AiArtifact): boolean {
  const type = artifact.type.toLowerCase();
  const lang = (artifact.language || '').toLowerCase();

  return (
    type.includes('html') ||
    type.includes('svg') ||
    type.includes('markdown') ||
    type.includes('mermaid') ||
    type.includes('react') ||
    ['html', 'svg', 'md', 'markdown', 'mermaid', 'jsx', 'tsx'].includes(lang)
  );
}
