import React from 'react';
import { Layers, FileText, FileSpreadsheet, Presentation, X } from 'lucide-react';
import { DocItem, DocSubFile, useDocsStore } from '../../store/useDocsStore';
import { fileTabsBarStyle } from '../../styles/editorSharedStyles';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface DocFileTabsBarProps {
  activeDoc?: DocItem | null;
  activeFileId?: string;
  onSelectFile: (docId: string, fileId: string) => void;
  onCloseFile?: (docId: string, fileId: string) => void;
  formatIcon?: 'file' | 'layers' | 'sheet' | 'slide' | 'doc';
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Standardized 34px Overleaf-style file tabs bar with close (X) buttons.
 * Reusable across Docs (LaTeX/Markdown), Sheets (AntSheet), and Slides (Presentation).
 */
export function DocFileTabsBar({
  activeDoc,
  activeFileId,
  onSelectFile,
  onCloseFile,
  formatIcon = 'layers',
  style,
  className = 'hide-scrollbar',
}: DocFileTabsBarProps) {
  const storeCloseSubFileTab = useDocsStore((s) => s.closeSubFileTab);
  const language = useSettingsStore((s) => s.language);

  if (!activeDoc) return null;

  const allFiles = activeDoc.files || [];
  const openFileIds = activeDoc.openFileIds || allFiles.map((f) => f.id);
  const docFiles = allFiles.filter((f) => openFileIds.includes(f.id));
  const resolvedActiveFileId = activeFileId || activeDoc.activeFileId || docFiles[0]?.id;
  const handleClose = onCloseFile || storeCloseSubFileTab;

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
              backgroundColor: 'var(--accent-success, #10B981)',
              flexShrink: 0,
            }}
            title="Main document entry"
          />
        </div>
      </div>
    );
  }

  const showCloseButton = docFiles.length > 0;

  return (
    <div style={{ ...fileTabsBarStyle, ...style }} className={className}>
      {docFiles.map((file: DocSubFile) => {
        const isActive = file.id === resolvedActiveFileId;
        return (
          <div
            key={file.id}
            onClick={() => onSelectFile(activeDoc.id, file.id)}
            title={file.name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '0 8px 0 10px',
              height: isActive ? '33px' : '30px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              cursor: 'pointer',
              borderRight: '1px solid var(--border-subtle)',
              borderTop: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
              backgroundColor: isActive ? 'var(--bg-main)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11.5px',
              fontWeight: isActive ? 650 : 400,
              transition: 'all 0.1s ease',
              position: 'relative',
              userSelect: 'none',
            }}
            className="hover-subtle"
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
                  backgroundColor: 'var(--accent-success, #10B981)',
                  flexShrink: 0,
                }}
                title={language === 'id' ? 'Entri dokumen utama' : 'Main document entry'}
              />
            )}

            {showCloseButton && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose(activeDoc.id, file.id);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '15px',
                  height: '15px',
                  borderRadius: '3px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: '2px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.color = 'var(--accent-danger, #ef4444)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
                title={language === 'id' ? 'Tutup Tab' : 'Close Tab'}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
