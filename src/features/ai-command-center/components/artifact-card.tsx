import React from 'react';
import {
  Code2,
  Globe,
  Palette,
  FileText,
  GitFork,
  ArrowRight,
  Eye,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiArtifact } from '../types';

interface ArtifactCardProps {
  artifact: AiArtifact;
  onClick: () => void;
  isActive?: boolean;
}

export function ArtifactCard({ artifact, onClick, isActive }: ArtifactCardProps) {
  const type = artifact.type.toLowerCase();
  const lang = (artifact.language || '').toLowerCase();

  const getIcon = () => {
    if (type.includes('svg') || lang === 'svg') {
      return <Palette className="w-5 h-5 text-pink-400" />;
    }
    if (type.includes('html') || lang === 'html') {
      return <Globe className="w-5 h-5 text-blue-400" />;
    }
    if (type.includes('react') || lang === 'jsx' || lang === 'tsx') {
      return <Globe className="w-5 h-5 text-cyan-400" />;
    }
    if (type.includes('markdown') || lang === 'md') {
      return <FileText className="w-5 h-5 text-amber-400" />;
    }
    if (type.includes('mermaid') || lang === 'mermaid') {
      return <GitFork className="w-5 h-5 text-emerald-400" />;
    }
    return <Code2 className="w-5 h-5 text-primary" />;
  };

  const getTypeLabel = () => {
    if (type.includes('html') || lang === 'html') return 'HTML';
    if (type.includes('svg') || lang === 'svg') return 'SVG';
    if (type.includes('react') || lang === 'jsx' || lang === 'tsx') return 'React';
    if (type.includes('markdown') || lang === 'md') return 'Markdown';
    if (type.includes('mermaid') || lang === 'mermaid') return 'Mermaid';
    return (artifact.language || 'Code').toUpperCase();
  };

  const lineCount = artifact.content ? artifact.content.split('\n').length : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group my-2 flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none shadow-sm',
        isActive
          ? 'bg-primary/10 border-primary shadow-primary/10 ring-1 ring-primary/40'
          : 'bg-[#18191c] hover:bg-[#1e1f22] border-white/10 hover:border-primary/40'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 pr-3">
        <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          {getIcon()}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-foreground truncate max-w-[240px] sm:max-w-[340px]">
              {artifact.title || 'Untitled Artifact'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-white/5 text-muted-foreground border border-white/10 shrink-0">
              {getTypeLabel()}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground/70 truncate flex items-center gap-1.5 mt-0.5">
            <span>{lineCount} baris</span>
            <span>•</span>
            <span className="text-primary/90 font-medium group-hover:underline">Klik untuk membuka</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-primary hover:text-white transition-all text-muted-foreground group-hover:text-foreground"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Buka</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
