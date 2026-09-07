'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DocCategory, DocSection } from '../types';
import {
  Search,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface DocSidebarProps {
  categories: DocCategory[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  language: 'id' | 'en';
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: DocSection[];
  embedded?: boolean;
  style?: React.CSSProperties;
}

// Helper to find parent chain for a section (for auto-expand)
function findParentChain(
  categories: DocCategory[],
  targetId: string
): { categoryId: string; sectionIds: string[] } | null {
  for (const cat of categories) {
    function searchInSections(
      sections: DocSection[],
      chain: string[]
    ): string[] | null {
      for (const sec of sections) {
        if (sec.id === targetId) {
          return chain;
        }
        if (sec.children && sec.children.length > 0) {
          const found = searchInSections(sec.children, [...chain, sec.id]);
          if (found) return found;
        }
      }
      return null;
    }
    const chain = searchInSections(cat.sections, []);
    if (chain !== null) {
      return { categoryId: cat.id, sectionIds: chain };
    }
  }
  return null;
}

// Recursive tree item component for nested navigation
interface TreeItemProps {
  section: DocSection;
  level: number;
  activeSectionId: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  language: 'id' | 'en';
}

function TreeItem({
  section,
  level,
  activeSectionId,
  expandedIds,
  onToggleExpand,
  onSelect,
  language,
}: TreeItemProps) {
  const isId = language === 'id';
  const hasChildren = section.children && section.children.length > 0;
  const isExpanded = expandedIds.has(section.id);
  const isActive = activeSectionId === section.id;

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand(section.id);
    }
    onSelect(section.id);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0px',
          padding: level > 0 ? '5px 8px 5px 4px' : '7px 10px 7px 2px',
          borderRadius: '6px',
          border: 'none',
          background: isActive ? 'rgba(0, 115, 234, 0.1)' : 'transparent',
          color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
          fontWeight: isActive ? 600 : 500,
          fontSize: level > 0 ? '12.5px' : '13px',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          position: 'relative',
          transition: 'all 0.12s ease',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        {hasChildren && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              transition: 'transform 0.15s ease',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              color: 'var(--text-muted)',
              flexShrink: 0,
              marginRight: '6px',
              marginTop: '2px',
            }}
          >
            <ChevronRight size={13} />
          </span>
        )}
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isActive ? 'var(--brand-primary)' : 'inherit',
            flex: 1,
          }}
        >
          {isId ? section.titleId : section.titleEn}
        </span>
      </button>
      {hasChildren && isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            paddingLeft: '12px',
            marginLeft: '6px',
          }}
        >
          {section.children!.map((child) => (
            <TreeItem
              key={child.id}
              section={child}
              level={level + 1}
              activeSectionId={activeSectionId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocSidebar({
  categories,
  activeSectionId,
  onSelectSection,
  language,
  searchQuery,
  onSearchChange,
  searchResults,
  embedded = false,
  style,
}: DocSidebarProps) {
  const isId = language === 'id';

    // Track expanded state for categories and nested sections
  // Categories are tracked with `cat-${categoryId}` prefix to avoid ID collisions with sections
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Auto-expand all categories by default
    return new Set(categories.map((c) => `cat-${c.id}`));
  });

  // Auto-expand parent chain when activeSectionId changes
  useMemo(() => {
    const chain = findParentChain(categories, activeSectionId);
    if (chain) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(`cat-${chain.categoryId}`); // Expand the parent category
        for (const sid of chain.sectionIds) {
          next.add(sid);
        }
        return next;
      });
    }
  }, [activeSectionId, categories]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const containerStyle: React.CSSProperties = embedded
    ? {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflowY: 'auto',
        ...style,
      }
    : {
        width: '270px',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 53px)',
        position: 'sticky',
        top: '53px',
        flexShrink: 0,
        overflowY: 'auto',
        ...style,
      };

  return (
    <aside style={containerStyle}>
      {/* Search Bar Filter (only when not embedded in shared sidebar) */}
      {!embedded && (
        <div style={{ padding: '14px 14px 10px 18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 10px',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={isId ? 'Filter topik...' : 'Filter topics...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                width: '100%',
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ padding: '8px 10px 32px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {searchQuery.trim() ? (
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '8px',
                paddingLeft: '8px',
                letterSpacing: '0.04em',
              }}
            >
              {isId ? `Hasil Pencarian (${searchResults.length})` : `Search Results (${searchResults.length})`}
            </div>
            {searchResults.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 8px' }}>
                {isId ? 'Tidak ada artikel yang cocok.' : 'No matching articles.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {searchResults.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => onSelectSection(sec.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: activeSectionId === sec.id ? 'var(--bg-subtle)' : 'transparent',
                      color: activeSectionId === sec.id ? 'var(--brand-primary)' : 'var(--text-primary)',
                      fontWeight: activeSectionId === sec.id ? 600 : 400,
                      fontSize: '13px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span>{isId ? sec.titleId : sec.titleEn}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
                ) : (
          categories.map((cat) => {
            const isCategoryExpanded = expandedIds.has(`cat-${cat.id}`);
            return (
              <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => toggleExpand(`cat-${cat.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '6px 10px 6px 2px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: '6px',
                  }}
                >
                  <span style={{ flex: 1 }}>{isId ? cat.titleId : cat.titleEn}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: isCategoryExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                      marginTop: '1px',
                    }}
                  />
                </button>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    maxHeight: isCategoryExpanded ? 'none' : '0px',
                    transition: 'max-height 0.3s ease',
                    overflow: 'hidden',
                    marginLeft: '12px',
                    paddingLeft: '10px',
                    borderLeft: '1px solid var(--border-subtle)',
                  }}
                >
                  {cat.sections.map((sec) => (
                    <TreeItem
                      key={sec.id}
                      section={sec}
                      level={0}
                      activeSectionId={activeSectionId}
                      expandedIds={expandedIds}
                      onToggleExpand={toggleExpand}
                      onSelect={onSelectSection}
                      language={language}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
