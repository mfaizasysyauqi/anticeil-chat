'use client';

import React, { useMemo } from 'react';
import { DocCategory, DocSection } from '../types';
import { Sparkles, ArrowLeft, ArrowRight, BookOpen, ChevronRight, Hash } from 'lucide-react';
import Link from 'next/link';
import { parseMarkdownBlocks } from './DocMarkdownParser';

interface DocContentRendererProps {
  section: DocSection;
  language: 'id' | 'en';
  categories: DocCategory[];
  allSections: DocSection[];
  onSelectSection: (id: string) => void;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}
export function DocContentRenderer({ section, language, categories, allSections, onSelectSection }: DocContentRendererProps) {
  const isId = language === 'id';
  const title = isId ? section.titleId : section.titleEn;
  const summary = isId ? section.summaryId : section.summaryEn;
  const rawContent = isId ? section.contentId : section.contentEn;
  const parentCategory = useMemo(() => categories.find((c) => c.sections.some((s) => s.id === section.id)), [categories, section.id]);
  const currentIndex = allSections.findIndex((s) => s.id === section.id);
  const prevSection = currentIndex > 0 ? allSections[currentIndex - 1] : null;
  const nextSection = currentIndex < allSections.length - 1 ? allSections[currentIndex + 1] : null;
  const tocItems = useMemo<TocItem[]>(() => {
    if (!rawContent) return [];
    const lines = rawContent.split('\n');
    const items: TocItem[] = [];
    for (const line of lines) {
      if (line.startsWith('## ')) items.push({ id: slugify(line.replace(/^##\s+/, '').trim()), text: line.replace(/^##\s+/, '').trim(), level: 2 });
      else if (line.startsWith('### ')) items.push({ id: slugify(line.replace(/^###\s+/, '').trim()), text: line.replace(/^###\s+/, '').trim(), level: 3 });
      else if (line.startsWith('#### ')) items.push({ id: slugify(line.replace(/^####\s+/, '').trim()), text: line.replace(/^####\s+/, '').trim(), level: 4 });
    }
    return items;
  }, [rawContent]);

  const tocTree = useMemo(() => {
    if (tocItems.length === 0) return [];

    // Find absolute minimum level to treat as "root"
    const minLevel = Math.min(...tocItems.map(i => i.level));

    const tree: { item: TocItem; children: TocItem[] }[] = [];
    let currentRoot: { item: TocItem; children: TocItem[] } | null = null;

    for (const item of tocItems) {
      if (item.level === minLevel) {
        currentRoot = { item, children: [] };
        tree.push(currentRoot);
      } else if (currentRoot) {
        currentRoot.children.push(item);
      } else {
        // Fallback: treat as new root if somehow out of order
        currentRoot = { item, children: [] };
        tree.push(currentRoot);
      }
    }
    return tree;
  }, [tocItems]);
  const scrollToAnchor = (anchorId: string) => { const el = document.getElementById(anchorId); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (<div style={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 53px)', background: 'var(--bg-canvas)' }}>
<article className="doc-content-article" style={{ flex: 1, padding: '32px var(--page-pad-x, 24px) 96px var(--page-pad-x, 24px)', maxWidth: '860px', minWidth: 0 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
<button type="button" onClick={() => onSelectSection(parentCategory?.sections[0]?.id || '')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
<BookOpen size={12} /><span>{parentCategory ? (isId ? parentCategory.titleId : parentCategory.titleEn) : 'Docs'}</span>
</button><ChevronRight size={12} /><span style={{ color: 'var(--text-secondary)' }}>{title}</span>
</div>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
<h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{title}</h1>
{section.badge && <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '5px', background: 'rgba(0, 200, 117, 0.14)', color: 'var(--accent-success)', letterSpacing: '0.03em' }}>{section.badge}</span>}
</div>
{summary && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: 1.6 }}>{summary}</p>}
<div style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}>{parseMarkdownBlocks(rawContent || '')}</div>
<div style={{ display: 'flex', gap: '12px', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
{prevSection ? (
<button type="button" onClick={() => onSelectSection(prevSection.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}>
<ArrowLeft size={15} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
<div>
<div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{isId ? 'Sebelumnya' : 'Previous'}</div>
<div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{isId ? prevSection.titleId : prevSection.titleEn}</div>
</div>
</button>
) : <div style={{ flex: 1 }} />}
{nextSection ? (
<button type="button" onClick={() => onSelectSection(nextSection.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', textAlign: 'right', transition: 'border-color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-primary)')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}>
<div>
<div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{isId ? 'Selanjutnya' : 'Next'}</div>
<div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{isId ? nextSection.titleId : nextSection.titleEn}</div>
</div>
<ArrowRight size={15} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
</button>
) : <div style={{ flex: 1 }} />}
</div>
{section.showCta !== false && (
<div style={{ marginTop: '40px', padding: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px' }}>
<div>
<div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{isId ? 'Ingin Mencoba Langsung?' : 'Want to Try It Live?'}</div>
<div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{isId ? 'Gunakan Anticeil Workspace.' : 'Experience Anticeil Workspace.'}</div>
</div>
<Link href="/chat" prefetch={false} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brand-primary)', color: '#FFFFFF', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(0, 115, 234, 0.25)', transition: 'transform 0.12s ease' }}>
<Sparkles size={15} /><span>{isId ? 'Buka Workspace' : 'Launch Workspace'}</span>
</Link>
</div>
)}
</article>
{tocItems.length > 0 && (
<aside className="doc-toc-rail" style={{ width: '240px', flexShrink: 0, padding: '32px 24px 32px 16px', position: 'sticky', top: '53px', height: 'calc(100vh - 53px)', overflowY: 'auto', borderLeft: '1px solid var(--border-subtle)' }}>
<div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
<Hash size={13} style={{ color: 'var(--brand-primary)' }} /><span>{isId ? 'Di Halaman Ini' : 'On This Page'}</span>
</div>
<nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '19px' }}>
{tocTree.map(({ item, children }) => (
  <div key={item.id}>
    <button type="button" onClick={() => scrollToAnchor(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: item.level === 2 ? '12.5px' : item.level === 3 ? '12px' : '11.5px', lineHeight: '1.4', color: 'var(--text-secondary)', paddingLeft: '0px', paddingTop: '2px', paddingBottom: '2px', transition: 'color 0.12s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
      {item.text}
    </button>
    {children.length > 0 && (
      <div style={{ marginLeft: '12px', paddingLeft: '2px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
        {children.map((sub) => (
          <button key={sub.id} type="button" onClick={() => scrollToAnchor(sub.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: sub.level === 3 ? '12px' : '11.5px', lineHeight: '1.4', color: 'var(--text-secondary)', paddingLeft: sub.level === 3 ? '0px' : '12px', paddingTop: '2px', paddingBottom: '2px', transition: 'color 0.12s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-primary)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            {sub.text}
          </button>
        ))}
      </div>
    )}
  </div>
))}
</nav>
</aside>
)}
<style jsx>{`@media (max-width: 1080px) { .doc-toc-rail { display: none !important; } } @media (max-width: 768px) { .doc-content-article { padding: 24px var(--page-pad-x-mobile, 16px) 80px var(--page-pad-x-mobile, 16px) !important; } } @media (max-width: 480px) { .doc-content-article { padding: 20px var(--page-pad-x-mobile, 16px) 64px var(--page-pad-x-mobile, 16px) !important; } }`}</style>
</div>);
}