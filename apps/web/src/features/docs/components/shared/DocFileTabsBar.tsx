import React from 'react';
import { Layers, FileText, FileSpreadsheet, Presentation } from 'lucide-react';
import { DocItem, DocSubFile } from '../../store/useDocsStore';
import { fileTabsBarStyle } from '../../styles/editorSharedStyles';

export interface DocFileTabsBarProps {
  activeDoc?: DocItem | null;
  activeFileId?: string;
  onSelectFile: (docId: string, fileId: string) => void;
  formatIcon?: 'file' | 'layers' | 'sheet' | 'slide' | 'doc';
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Standardized 34px Overleaf-style file tabs bar.
 * Reusable across Docs (LaTeX/Markdown), Sheets (AntSheet), and Slides (Presentation).
 */
export function DocFileTabsBar({
  activeDoc,
  activeFileId,
  onSelectFile,
  formatIcon = 'layers',
  style,
  className = 'hide-scrollbar',
}: DocFileTabsBarProps) {
  if (!activeDoc) return null;

  const docFiles = activeDoc.files || [];
  const resolvedActiveFileId = activeFileId || activeDoc.activeFileId || docFiles[0]?.id;

  const renderIcon = (isActive: boolean) => {
    const color = isActive ? 'var(--brand-primary)' : 'var(--text-muted)';
    const size = 11;
    switch (formatIcon) {
      case 'file':
      case 'doc':
        return <FileText size={size} color={color} />;
      case 'sheet':
        return <FileSpreadsheet size={size} color={color} />;
      case 'slide':
        return <Presentation size={size} color={color} />;
      case 'layers':
      default:
        return <Layers size={size} color={color} />;
    }
  };

  if (docFiles.length === 0) {
    return (
      <div style={{ ...fileTabsBarStyle, ...style }} className={className}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '0 12px',
            height: '33px',
            borderTop: '2px solid var(--brand-primary)',
            backgroundColor: 'var(--bg-main)',
            borderRight: '1px solid var(--border-subtle)',
            fontSize: '11.5px',
            color: 'var(--text-primary)',
            fontWeight: 650,
            flexShrink: 0,
          }}
        >
          {renderIcon(true)}
          <span>{activeDoc.title || 'main'}</span>
          <span
            style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              flexShrink: 0,
            }}
            title="Main document entry"
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...fileTabsBarStyle, ...style }} className={className}>
      {docFiles.map((file: DocSubFile) => {
        const isActive = file.id === resolvedActiveFileId;
        return (
          <button
            key={file.id}
            type="button"
            onClick={() => onSelectFile(activeDoc.id, file.id)}
            title={file.name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '0 12px',
              height: isActive ? '33px' : '30px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'pointer',
              border: 'none',
              borderRight: '1px solid var(--border-subtle)',
              borderTop: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
              backgroundColor: isActive ? 'var(--bg-main)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11.5px',
              fontWeight: isActive ? 650 : 400,
              transition: 'all 0.1s ease',
              position: 'relative',
              marginBottom: isActive ? 0 : undefined,
            }}
          >
            {renderIcon(isActive)}
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.name}
            </span>
            {file.isMain && (
              <span
                style={{
                  display: 'inline-block',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  flexShrink: 0,
                }}
                title="Main document entry"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
