import React from 'react';

/**
 * Shared Overleaf / Anticeil Editor Design Tokens & Styles
 * Used across Docs (LaTeX/Markdown), Sheets (AntSheet), and Slides (Markdown Slides).
 * Guarantees 100% DRY visual consistency across all studio editors.
 */

export const fileTabsBarStyle: React.CSSProperties = {
  height: '34px',
  borderBottom: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-subtle)',
  display: 'flex',
  alignItems: 'flex-end',
  overflowX: 'auto',
  overflowY: 'hidden',
  flexShrink: 0,
  scrollbarWidth: 'none',
};

export const editorToolbarStyle: React.CSSProperties = {
  height: '34px',
  padding: '0 6px',
  borderBottom: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-surface)',
  display: 'flex',
  alignItems: 'center',
  gap: '1px',
  overflowX: 'auto',
  flexShrink: 0,
  flexWrap: 'nowrap',
  scrollbarWidth: 'none',
};

export const toolbarBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px 4px',
  minWidth: '22px',
  height: '24px',
  borderRadius: '4px',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '11px',
  transition: 'all 0.15s ease',
  flexShrink: 0,
};

export const separatorStyle: React.CSSProperties = {
  width: '1px',
  height: '14px',
  backgroundColor: 'var(--border-subtle)',
  margin: '0 2px',
  flexShrink: 0,
};

export const popoverItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 8px',
  borderRadius: '5px',
  border: 'none',
  backgroundColor: 'transparent',
  color: 'var(--text-primary)',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
  transition: 'background-color 0.12s ease',
};

export const previewActionBarStyle: React.CSSProperties = {
  height: '36px',
  backgroundColor: 'var(--bg-surface)',
  borderBottom: '1px solid var(--border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 8px',
  flexShrink: 0,
  fontSize: '12px',
  userSelect: 'none',
  overflowX: 'auto',
  overflowY: 'hidden',
  whiteSpace: 'nowrap',
  gap: '8px',
};

export const recompileBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '4px 9px',
  borderTopLeftRadius: '5px',
  borderBottomLeftRadius: '5px',
  backgroundColor: '#00843D',
  border: 'none',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  flexShrink: 0,
};

export const recompileDropdownArrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 5px',
  borderTopRightRadius: '5px',
  borderBottomRightRadius: '5px',
  backgroundColor: '#00843D',
  border: 'none',
  borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
  color: '#ffffff',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};
