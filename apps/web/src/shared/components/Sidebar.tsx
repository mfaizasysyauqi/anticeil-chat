'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Search,
  MessageSquare,
  SquarePen,
  Sparkles,
  Clock,
  Activity,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  ShieldCheck,
  Bot,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
  Folder,
  FolderOpen,
  KeyRound,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Settings,
  HelpCircle,
  Zap,
  Palette,
  Database,
  Image as ImageIcon,
  Workflow,
  Globe,
  CircleDot,
  User,
  Plug,
  FileText,
  Upload,
  FolderInput,
  FolderMinus,
  Film,
  Music,
  Download,
  Gauge,
  Sliders,
  Radar,
  GitFork,
  Table,
  Presentation,
} from 'lucide-react';
import { useChatStore } from '../../features/chat/store/useChatStore';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { ConnectorsModal } from '../../features/connectors/components/ConnectorsModal';
import { StorageMeter } from '../../features/storage/components/StorageMeter';
import { getTranslation, ChatSession } from '@anticeil/core';
import { useWorkspaceStore } from '../../features/storage/store/useWorkspaceStore';
import { useProjectStore } from '../../features/chat/store/useProjectStore';
import { useImageStore } from '../../features/image/store/useImageStore';
import { useDocsStore, DocItem } from '../../features/docs/store/useDocsStore';
import { FolderFileDrawer } from '../../features/storage/components/FolderFileDrawer';
import { useCreditStore } from '../../features/credits/store/useCreditStore';
import { createClient } from '../utils/supabase/client';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isDesktopCollapsed?: boolean;
  onToggleDesktopCollapse?: () => void;
  onOpenModelSelector?: () => void;
}

interface ImagineHistoryItem {
  id: string;
  prompt: string;
  style: string;
  time: string;
  collectionId?: string;
  isPinned?: boolean;
  type?: 'image' | 'video' | 'audio';
}

// ─── FolderMenu ───────────────────────────────────────────────────────────────
// Small self-contained component for the folder three-dot menu (rename / delete)
interface FolderMenuProps {
  proj: { id: string; name: string };
  language: string;
  t: { sidebar: { rename: string }; common: { delete: string } };
  accessToken?: string | null;
  renameFolder: (id: string, name: string, token: string) => Promise<void>;
  deleteFolder: (id: string, token: string) => Promise<void>;
  onDeleted: () => void;
}

function FolderMenu({ proj, language, t, accessToken, renameFolder, deleteFolder, onDeleted }: FolderMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameText, setRenameText] = React.useState(proj.name);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setOpen(false);
        setIsRenaming(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const getToken = async () => {
    if (accessToken) return accessToken;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || useAuthStore.getState().session?.access_token || null;
    } catch {
      return useAuthStore.getState().session?.access_token || null;
    }
  };

  const handleRename = async () => {
    const name = renameText.trim();
    if (!name) return;
    const token = await getToken();
    if (!token) return;
    await renameFolder(proj.id, name, token);
    setIsRenaming(false);
    setOpen(false);
  };

  const handleDelete = async () => {
    const token = await getToken();
    if (!token) return;
    await deleteFolder(proj.id, token);
    onDeleted();
    setOpen(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 140;
      const menuHeight = 80;
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      let top = rect.bottom + 4;
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4;
      }
      setMenuPosition({ top, left });
      setOpen(true);
    }
  };

  if (isRenaming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.stopPropagation(); handleRename(); }
            if (e.key === 'Escape') { setIsRenaming(false); setOpen(false); }
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '80px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '4px',
            padding: '2px 5px',
            fontSize: '11px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button type="button" onClick={(e) => { e.stopPropagation(); handleRename(); }}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px', display: 'flex' }}>
          <Check size={11} />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); setIsRenaming(false); setOpen(false); }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px', display: 'flex' }}>
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="session-options-btn"
        style={{
          background: 'transparent', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center',
        }}
      >
        <MoreHorizontal size={12} />
      </button>

      {open && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={portalRef}
          data-foldermenu-portal="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            background: 'var(--bg-surface)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--shadow-xl, 0 10px 25px rgba(0,0,0,0.25))',
            padding: '4px',
            zIndex: 999999999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '130px',
          }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setRenameText(proj.name); setIsRenaming(true); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Edit2 size={11} />
            <span>{t.sidebar.rename}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--accent-danger)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={11} />
            <span>{language === 'id' ? 'Hapus folder' : 'Delete folder'}</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── ImagineFolderMenu ────────────────────────────────────────────────────────
interface ImagineFolderMenuProps {
  col: { id: string; name: string };
  language: string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  onOpenUpload: () => void;
}

function ImagineFolderMenu({ col, language, renameCollection, deleteCollection, onOpenUpload }: ImagineFolderMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameText, setRenameText] = React.useState(col.name);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setOpen(false);
        setIsRenaming(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleRename = () => {
    const name = renameText.trim();
    if (!name) return;
    renameCollection(col.id, name);
    setIsRenaming(false);
    setOpen(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 140;
      const menuHeight = 110;
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      let top = rect.bottom + 4;
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4;
      }
      setMenuPosition({ top, left });
      setOpen(true);
    }
  };

  if (isRenaming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.stopPropagation(); handleRename(); }
            if (e.key === 'Escape') { setIsRenaming(false); setOpen(false); }
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '80px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '4px',
            padding: '2px 5px',
            fontSize: '11px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button type="button" onClick={(e) => { e.stopPropagation(); handleRename(); }}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px', display: 'flex' }}>
          <Check size={11} />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); setIsRenaming(false); setOpen(false); }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px', display: 'flex' }}>
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="session-options-btn"
        style={{
          background: 'transparent', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center',
        }}
      >
        <MoreHorizontal size={12} />
      </button>

      {open && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={portalRef}
          data-foldermenu-portal="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            background: 'var(--bg-surface)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--shadow-xl, 0 10px 25px rgba(0,0,0,0.25))',
            padding: '4px',
            zIndex: 999999999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '140px',
          }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setRenameText(col.name); setIsRenaming(true); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Edit2 size={11} />
            <span>{language === 'id' ? 'Ubah nama' : 'Rename'}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenUpload(); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Upload size={11} />
            <span>{language === 'id' ? 'Unggah media' : 'Upload media'}</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--accent-danger)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={11} />
            <span>{language === 'id' ? 'Hapus folder' : 'Delete folder'}</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── ImagineItemMenu ──────────────────────────────────────────────────────────
interface ImagineItemMenuProps {
  item: ImagineHistoryItem;
  language: string;
  collections: Array<{ id: string; name: string }>;
  togglePin: (id: string) => void;
  moveToCollection: (id: string, collectionId: string | null) => void;
  removeItem: (id: string) => void;
}

function ImagineItemMenu({ item, language, collections, togglePin, moveToCollection, removeItem }: ImagineItemMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [folderSubmenuOpen, setFolderSubmenuOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setOpen(false);
        setFolderSubmenuOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      setFolderSubmenuOpen(false);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 150;
      const menuHeight = 120;
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      let top = rect.bottom + 4;
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4;
      }
      setMenuPosition({ top, left });
      setOpen(true);
    }
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="session-options-btn"
        style={{
          background: 'transparent', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center',
        }}
      >
        <MoreHorizontal size={12} />
      </button>

      {open && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={portalRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            background: 'var(--bg-surface)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--shadow-xl, 0 10px 25px rgba(0,0,0,0.25))',
            padding: '4px',
            zIndex: 999999999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '150px',
          }}
        >
          {/* Pin / Unpin */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); togglePin(item.id); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: item.isPinned ? '#A25DDC' : 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Pin size={11} fill={item.isPinned ? '#A25DDC' : 'none'} />
            <span>{item.isPinned ? (language === 'id' ? 'Lepas sematkan' : 'Unpin') : (language === 'id' ? 'Sematkan' : 'Pin')}</span>
          </button>

          {/* Move to folder */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFolderSubmenuOpen(!folderSubmenuOpen); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '5px 8px', borderRadius: '4px', border: 'none', background: 'transparent',
                color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderInput size={11} />
                <span>{language === 'id' ? 'Pindah ke folder' : 'Move to folder'}</span>
              </div>
              <ChevronRight size={10} color="var(--text-muted)" />
            </button>

            {folderSubmenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: '100%',
                  marginRight: '4px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '4px',
                  minWidth: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 1000000000,
                }}
              >
                {item.collectionId && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveToCollection(item.id, null); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
                      borderRadius: '4px', border: 'none', background: 'transparent',
                      color: 'var(--accent-warning, #eab308)', fontSize: '11px', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <FolderMinus size={11} />
                    <span>{language === 'id' ? 'Keluarkan dari folder' : 'Remove from folder'}</span>
                  </button>
                )}

                {collections.length === 0 ? (
                  <div style={{ padding: '6px 8px', fontSize: '10.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {language === 'id' ? 'Belum ada folder' : 'No folders'}
                  </div>
                ) : (
                  collections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveToCollection(item.id, c.id); setOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
                        borderRadius: '4px', border: 'none',
                        background: item.collectionId === c.id ? 'rgba(162, 93, 220, 0.15)' : 'transparent',
                        color: item.collectionId === c.id ? '#A25DDC' : 'var(--text-primary)',
                        fontSize: '11px', cursor: 'pointer', textAlign: 'left', fontWeight: item.collectionId === c.id ? 600 : 400,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = item.collectionId === c.id ? 'rgba(162, 93, 220, 0.15)' : 'transparent')}
                    >
                      <Folder size={11} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeItem(item.id); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--accent-danger)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={11} />
            <span>{language === 'id' ? 'Hapus' : 'Delete'}</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── DocFolderMenu ───────────────────────────────────────────────────────────
interface DocFolderMenuProps {
  folder: { id: string; name: string };
  language: string;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

function DocFolderMenu({ folder, language, onRename, onDelete }: DocFolderMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameText, setRenameText] = React.useState(folder.name);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setOpen(false);
        setIsRenaming(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleRename = () => {
    const name = renameText.trim();
    if (name) {
      onRename(folder.id, name);
    }
    setIsRenaming(false);
    setOpen(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 140;
      const menuHeight = 80;
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      let top = rect.bottom + 4;
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4;
      }
      setMenuPosition({ top, left });
      setOpen(true);
    }
  };

  if (isRenaming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') setIsRenaming(false);
          }}
          autoFocus
          style={{
            width: '90px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: '11px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={handleRename}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
        >
          <Check size={11} />
        </button>
        <button
          type="button"
          onClick={() => setIsRenaming(false)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
        >
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="more-button"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: open ? 1 : undefined,
        }}
      >
        <MoreHorizontal size={12} />
      </button>

      {open && menuPosition && createPortal(
        <div
          ref={portalRef}
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 99999,
            backgroundColor: 'var(--bg-surface, #18181b)',
            border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.35))',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '130px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Edit2 size={11} color="var(--text-secondary)" />
            <span>{language === 'id' ? 'Ganti Nama' : 'Rename'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(folder.id); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--accent-danger)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={11} />
            <span>{language === 'id' ? 'Hapus' : 'Delete'}</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── DocItemMenu ─────────────────────────────────────────────────────────────
interface DocItemMenuProps {
  doc: DocItem;
  language: string;
  folders: Array<{ id: string; name: string }>;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMove: (id: string, projectId: string | null) => void;
}

function DocItemMenu({ doc, language, folders, onRename, onDelete, onTogglePin, onMove }: DocItemMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [showMoveSubmenu, setShowMoveSubmenu] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameText, setRenameText] = React.useState(doc.title);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setOpen(false);
        setShowMoveSubmenu(false);
        setIsRenaming(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleRenameSubmit = () => {
    const text = renameText.trim();
    if (text) {
      onRename(doc.id, text);
    }
    setIsRenaming(false);
    setOpen(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      setShowMoveSubmenu(false);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 160;
      const menuHeight = 130;
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      let top = rect.bottom + 4;
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4;
      }
      setMenuPosition({ top, left });
      setOpen(true);
      setShowMoveSubmenu(false);
    }
  };

  if (isRenaming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit();
            if (e.key === 'Escape') { setIsRenaming(false); setRenameText(doc.title); }
          }}
          autoFocus
          style={{
            width: '100px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '4px',
            padding: '2px 5px',
            fontSize: '11px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={handleRenameSubmit}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
        >
          <Check size={11} />
        </button>
        <button
          type="button"
          onClick={() => { setIsRenaming(false); setRenameText(doc.title); }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
        >
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="more-button"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: open ? 1 : undefined,
        }}
      >
        <MoreHorizontal size={12} />
      </button>

      {open && menuPosition && createPortal(
        <div
          ref={portalRef}
          data-docmenu-portal="true"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 99999,
            backgroundColor: 'var(--bg-surface, #18181b)',
            border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.35))',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '155px',
            animation: 'fadeIn 0.1s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Rename */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsRenaming(true); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Edit2 size={11} color="var(--text-secondary)" />
            <span>{language === 'id' ? 'Ganti Nama' : 'Rename'}</span>
          </button>

          {/* Pin */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onTogglePin(doc.id); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Pin size={11} color={doc.isPinned ? 'var(--brand-primary)' : 'var(--text-secondary)'} />
            <span>{doc.isPinned ? (language === 'id' ? 'Lepas Sematan' : 'Unpin') : (language === 'id' ? 'Sematkan' : 'Pin')}</span>
          </button>

          {/* Move to project folder */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowMoveSubmenu(!showMoveSubmenu); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '5px 8px', borderRadius: '4px', border: 'none', background: 'transparent',
                color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <FolderInput size={11} color="var(--text-secondary)" />
                <span>{language === 'id' ? 'Pindah Folder' : 'Move Folder'}</span>
              </div>
              <ChevronRight size={10} color="var(--text-muted)" />
            </button>

            {showMoveSubmenu && (
              <div
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: '-4px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  minWidth: '140px',
                  zIndex: 100000,
                }}
              >
                {/* Remove from folder option */}
                {doc.projectId && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMove(doc.id, null); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
                      borderRadius: '4px', border: 'none', background: 'transparent',
                      color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <FolderMinus size={11} />
                    <span>{language === 'id' ? 'Keluarkan dari Folder' : 'Remove from Folder'}</span>
                  </button>
                )}

                {folders.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMove(doc.id, p.id); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
                      borderRadius: '4px', border: 'none',
                      background: doc.projectId === p.id ? 'rgba(0,115,234,0.1)' : 'transparent',
                      color: doc.projectId === p.id ? 'var(--brand-primary)' : 'var(--text-primary)',
                      fontSize: '11px', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Folder size={11} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 0' }} />

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(doc.id); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--accent-danger)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={11} />
            <span>{language === 'id' ? 'Hapus' : 'Delete'}</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── DocSidebarItem ─────────────────────────────────────────────────────────
interface DocSidebarItemProps {
  doc: DocItem;
  isActive: boolean;
  language: string;
  folders: Array<{ id: string; name: string }>;
  onSelect: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMove: (id: string, projectId: string | null) => void;
}

function DocSidebarItem({
  doc,
  isActive,
  language,
  folders,
  onSelect,
  onRename,
  onDelete,
  onTogglePin,
  onMove,
}: DocSidebarItemProps) {
  const getFormatIcon = () => {
    if (doc.format === 'sheet') return <Table size={12} color="#10B981" style={{ flexShrink: 0 }} />;
    if (doc.format === 'slide') return <Presentation size={12} color="#8B5CF6" style={{ flexShrink: 0 }} />;
    return <FileText size={12} color="#0073EA" style={{ flexShrink: 0 }} />;
  };

  return (
    <div
      className="clickable-pill"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '4px 8px',
        borderRadius: 'var(--radius-sm, 6px)',
        background: isActive ? 'rgba(0, 115, 234, 0.12)' : doc.isPinned ? 'rgba(0, 115, 234, 0.05)' : 'transparent',
        color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
        fontSize: '12px',
        fontWeight: isActive ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      <div
        onClick={onSelect}
        style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}
      >
        {getFormatIcon()}
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isActive ? 'var(--brand-primary)' : 'var(--text-primary)',
            flex: 1,
          }}
        >
          {doc.title || 'Untitled Doc'}
        </span>
        {doc.isPinned && <Pin size={9} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
      </div>

      <DocItemMenu
        doc={doc}
        language={language}
        folders={folders}
        onRename={onRename}
        onDelete={onDelete}
        onTogglePin={onTogglePin}
        onMove={onMove}
      />
    </div>
  );
}

export function Sidebar({
  isOpenMobile = false,
  onCloseMobile,
  isDesktopCollapsed = false,
  onToggleDesktopCollapse,
  onOpenModelSelector,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  // Track which project folders are expanded (showing their chats)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const session = useAuthStore((s) => s.session);

  const isImage = pathname === '/image';
  const isVideo = pathname === '/video';
  const isAudio = pathname === '/audio';
  const isDocs = pathname === '/docs' || pathname.startsWith('/docs');
  const isMediaMode = isImage || isVideo || isAudio;

  // Docs store state (isolated database & folders completely independent from Chat)
  const docs = useDocsStore((s) => s.documents);
  const docFolders = useDocsStore((s) => s.folders);
  const createDocFolder = useDocsStore((s) => s.createFolder);
  const renameDocFolder = useDocsStore((s) => s.renameFolder);
  const deleteDocFolder = useDocsStore((s) => s.deleteFolder);
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const activeProjectId = useDocsStore((s) => s.activeProjectId);
  const setActiveDocId = useDocsStore((s) => s.setActiveDocId);
  const setActiveProjectId = useDocsStore((s) => s.setActiveProjectId);
  const createDocument = useDocsStore((s) => s.createDocument);
  const updateDocumentTitle = useDocsStore((s) => s.updateDocumentTitle);
  const deleteDocument = useDocsStore((s) => s.deleteDocument);
  const togglePin = useDocsStore((s) => s.togglePin);
  const moveDocumentToProject = useDocsStore((s) => s.moveDocumentToProject);
  const [isUnassignedExpanded, setIsUnassignedExpanded] = useState(true);
  const [isAddingDocFolder, setIsAddingDocFolder] = useState(false);
  const [newDocFolderName, setNewDocFolderName] = useState('');

  const unassignedDocs = useMemo(() => {
    return docs
      .filter((d) => !d.projectId && d.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt);
  }, [docs, searchQuery]);

  // Imagine Mode UI States
  const [isAddingImagineCollection, setIsAddingImagineCollection] = useState(false);
  const [newImagineCollectionName, setNewImagineCollectionName] = useState('');

  // Real image history from store
  const imagineItems = useImageStore((s) => s.items);
  const toggleImaginePin = useImageStore((s) => s.togglePin);
  const moveImagineToCollection = useImageStore((s) => s.moveToCollection);
  const imagineHistory: ImagineHistoryItem[] = imagineItems.map((item) => ({
    id: item.id,
    prompt: item.prompt,
    style: item.style || item.type || 'Media',
    time: item.createdAtLabel,
    collectionId: item.collectionId ?? undefined,
    isPinned: item.isPinned,
    type: item.type,
  }));

  // ── Project store (DB-backed via Supabase) ──────────────────────────────────
  const projects = useProjectStore((s) => s.folders);
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const createProject = useProjectStore((s) => s.createFolder);
  const renameProject = useProjectStore((s) => s.renameFolder);
  const deleteProject = useProjectStore((s) => s.deleteFolder);
  const assignSessionToProject = useProjectStore((s) => s.assignSession);
  const removeSessionFromProject = useProjectStore((s) => s.removeSession);
  const fetchProjects = useProjectStore((s) => s.fetchFolders);

  const imageCollections = useWorkspaceStore((s) => s.imageCollections);
  const activeImageCollectionId = useWorkspaceStore((s) => s.activeImageCollectionId);
  const setActiveImageCollection = useWorkspaceStore((s) => s.setActiveImageCollection);
  const createImageCollection = useWorkspaceStore((s) => s.createImageCollection);
  const renameImageCollection = useWorkspaceStore((s) => s.renameImageCollection);
  const deleteImageCollection = useWorkspaceStore((s) => s.deleteImageCollection);
  const addFileToImageCollection = useWorkspaceStore((s) => s.addFileToImageCollection);
  const removeFileFromImageCollection = useWorkspaceStore((s) => s.removeFileFromImageCollection);

  const removeImagineItem = useImageStore((s) => s.removeItem);

  const documentCategories = useWorkspaceStore((s) => s.documentCategories);
  const activeDocumentCategoryId = useWorkspaceStore((s) => s.activeDocumentCategoryId);
  const setActiveDocumentCategory = useWorkspaceStore((s) => s.setActiveDocumentCategory);
  const createDocumentCategory = useWorkspaceStore((s) => s.createDocumentCategory);
  const addFileToDocumentCategory = useWorkspaceStore((s) => s.addFileToDocumentCategory);
  const removeFileFromDocumentCategory = useWorkspaceStore((s) => s.removeFileFromDocumentCategory);

  // Drawer state (file manager per folder)
  const [drawerState, setDrawerState] = useState<{
    type: 'project' | 'imageCollection' | 'documentCategory';
    id: string;
  } | null>(null);

  const getDrawerFolder = () => {
    if (!drawerState) return null;
    if (drawerState.type === 'imageCollection') return imageCollections.find((c) => c.id === drawerState.id) ?? null;
    if (drawerState.type === 'documentCategory') return documentCategories.find((c) => c.id === drawerState.id) ?? null;
    return null;
  };

  const drawerFolder = getDrawerFolder();

  const handleDrawerFileAdded = (file: any) => {
    if (!drawerState) return;
    if (drawerState.type === 'imageCollection') addFileToImageCollection(drawerState.id, file);
    if (drawerState.type === 'documentCategory') addFileToDocumentCategory(drawerState.id, file);
  };

  const handleDrawerFileRemoved = (fileId: string) => {
    if (!drawerState) return;
    if (drawerState.type === 'imageCollection') removeFileFromImageCollection(drawerState.id, fileId);
    if (drawerState.type === 'documentCategory') removeFileFromDocumentCategory(drawerState.id, fileId);
  };

  const drawerAcceptTypes =
    drawerState?.type === 'imageCollection'
      ? 'image/*'
      : drawerState?.type === 'documentCategory'
      ? '.pdf,.doc,.docx,.txt,.csv,.json,.md'
      : '*/*';

  // Dropdown menu state for session options (...)
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  // "Move to folder" submenu
  const [folderSubmenuSessionId, setFolderSubmenuSessionId] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Profile Popover State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  // Mini Sidebar Settings Popover State
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);

  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const selectSession = useChatStore((s) => s.selectSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const createSession = useChatStore((s) => s.createSession);
  const updateSession = useChatStore((s) => s.updateSession);
  const moveSessionToProject = useChatStore((s) => s.moveSessionToProject);

  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);
  const openSettingsTab = useSettingsStore((s) => s.openSettingsTab);
  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const signOut = useAuthStore((s) => s.signOut);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const dailyCredits = useCreditStore((s) => s.credits) || 0;
  const maxCredits = useCreditStore((s) => s.maxDailyCredits) || 50;
  const paidCredits = useCreditStore((s) => s.paidCredits) || 0;
  const openPricingModal = useCreditStore((s) => s.openPricingModal);
  const t = getTranslation(language);

  // Helper to reliably get accessToken from active session or store
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || useAuthStore.getState().session?.access_token || null;
    } catch {
      return useAuthStore.getState().session?.access_token || null;
    }
  };

  // Fix hydration mismatch & initialize auth on mount
  useEffect(() => {
    setIsMounted(true);
    initializeAuth();
  }, [initializeAuth]);

  // Close dropdown & profile popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      
      const submenuElement = document.querySelector('[data-submenu-portal="true"]');
      const folderMenuElement = document.querySelector('[data-foldermenu-portal="true"]');
      const isInsideSubmenu = submenuElement && submenuElement.contains(target);
      const isInsideFolderMenu = folderMenuElement && folderMenuElement.contains(target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(target);
      
      // Close session menu and submenu only if click is outside main menu and portals
      if (!isInsideMenu && !isInsideSubmenu && !isInsideFolderMenu) {
        setMenuSessionId(null);
        setFolderSubmenuSessionId(null);
        setSubmenuPosition(null);
      }
      
      // Check if click is outside profile menu
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }

      // Check if click is outside mini-sidebar settings menu
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setIsSettingsMenuOpen(false);
      }
    };
    
    // Add listener only if we have active menus
    if (menuSessionId || folderSubmenuSessionId || isProfileMenuOpen || isSettingsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuSessionId, folderSubmenuSessionId, isProfileMenuOpen, isSettingsMenuOpen]);

  const handleSelectSession = (sessionId: string) => {
    selectSession(sessionId);
    if (pathname !== '/chat') {
      router.push('/chat');
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleCreateSession = () => {
    createSession();
    if (pathname !== '/chat') {
      router.push('/chat');
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleText(session.title);
    setMenuSessionId(null);
  };

  const handleSaveRename = (sessionId: string) => {
    if (editTitleText.trim()) {
      updateSession(sessionId, { title: editTitleText.trim() });
    }
    setEditingSessionId(null);
  };

  const handleTogglePin = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session.isPinned) {
      const currentPinnedCount = userSessions.filter((s) => s.isPinned).length;
      if (currentPinnedCount >= 3) {
        alert(language === 'id' ? 'Maksimal 3 obrolan yang dapat disematkan ke paling atas.' : 'Maximum of 3 pinned chats allowed.');
        setMenuSessionId(null);
        return;
      }
    }
    updateSession(session.id, { isPinned: !session.isPinned });
    setMenuSessionId(null);
  };

  const handleAddProject = async () => {
    const name = newProjectName.trim();
    if (!name || projects.some((p) => p.name === name)) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      await createProject(name, token);
      setNewProjectName('');
      setIsAddingProject(false);
    } catch (err) {
      console.error('[Sidebar] Failed to add project folder:', err);
    }
  };

  const handleMoveToProject = async (session: ChatSession, targetProjectId: string | null) => {
    const oldProjectId = session.projectId;
    
    // Optimistic update - update UI immediately
    moveSessionToProject(session.id, targetProjectId);
    
    // Close menus immediately for snappy UX
    setMenuSessionId(null);
    setFolderSubmenuSessionId(null);
    setSubmenuPosition(null);

    // Auto-expand target project folder so user sees the moved chat immediately
    if (targetProjectId) {
      setExpandedFolderIds((prev) => new Set(prev).add(targetProjectId));
    }

    try {
      const token = await getAccessToken();
      if (token) {
        // Remove from old project
        if (oldProjectId) {
          await removeSessionFromProject(oldProjectId, session.id, token);
        }
        // Assign to new project
        if (targetProjectId) {
          await assignSessionToProject(targetProjectId, session.id, token);
        }
        
        // Refresh projects in background (no await - don't block UI)
        fetchProjects(token);
      }
    } catch (error) {
      console.error('[Sidebar] Failed to move session:', error);
      // Revert on error
      moveSessionToProject(session.id, oldProjectId ?? null);
    }
  };

  // User-isolated sessions: only show sessions that belong to the active user (or legacy/guest if unauthenticated)
  const userSessions = useMemo(() => {
    const currentUserId = user?.id;
    if (!currentUserId) {
      return sessions.filter((s) => !s.userId || s.userId === 'guest');
    }
    return sessions.filter((s) => s.userId === currentUserId || !s.userId);
  }, [sessions, user?.id]);

  // Filter sessions by search query.
  // Sessions assigned to a project only appear under that folder (if folder exists in user's projects), not in the general list.
  const filteredSessions = userSessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isInExistingProject = s.projectId && projects.some((p) => p.id === s.projectId);
    return matchesSearch && !isInExistingProject;
  });

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const unpinnedSessions = filteredSessions.filter((s) => !s.isPinned);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const todaySessions = unpinnedSessions.filter((s) => s.updatedAt >= startOfToday);
  const yesterdaySessions = unpinnedSessions.filter(
    (s) => s.updatedAt >= startOfYesterday && s.updatedAt < startOfToday
  );
  const earlierSessions = unpinnedSessions.filter((s) => s.updatedAt < startOfYesterday);

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === activeSessionId && pathname === '/chat';
    const isEditing = session.id === editingSessionId;

    if (isEditing) {
      return (
        <div
          key={session.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 8px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--brand-primary)',
          }}
        >
          <input
            type="text"
            value={editTitleText}
            onChange={(e) => setEditTitleText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename(session.id);
              if (e.key === 'Escape') setEditingSessionId(null);
            }}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
            }}
          />
          <button
            type="button"
            onClick={() => handleSaveRename(session.id)}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer' }}
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            onClick={() => setEditingSessionId(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
        </div>
      );
    }

    return (
      <div
        key={session.id}
        onClick={() => handleSelectSession(session.id)}
        className="sidebar-session-item clickable-pill"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          borderRadius: 'var(--radius-sm, 6px)',
          background: isActive ? 'var(--bg-subtle)' : 'transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontSize: '12.5px',
          fontWeight: isActive ? 600 : 400,
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.15s ease',
          zIndex: menuSessionId === session.id ? 99999998 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
          <MessageSquare
            size={13}
            color={isActive ? 'var(--brand-primary)' : 'var(--text-muted)'}
            style={{ flexShrink: 0 }}
          />
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
          >
            {session.title || 'Untitled Chat'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          {session.isPinned && (
            <Pin size={11} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
          )}

          {/* More Options (...) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuSessionId(menuSessionId === session.id ? null : session.id);
            }}
            className="session-options-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <MoreHorizontal size={13} />
          </button>
        </div>

        {/* Dropdown Menu */}
        {menuSessionId === session.id && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: '100%',
              right: '8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md, 8px)',
              boxShadow: 'var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.25))',
              padding: '4px',
              zIndex: 9999999,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              minWidth: '160px',
              pointerEvents: 'auto',
            }}
          >
            <button
              type="button"
              onClick={(e) => handleTogglePin(session, e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 8px',
                borderRadius: '4px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '11.5px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Pin size={12} />
              <span>{session.isPinned ? t.sidebar.unpin : t.sidebar.pin}</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleStartRename(session, e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 8px',
                borderRadius: '4px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '11.5px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Edit2 size={12} />
              <span>{t.sidebar.rename}</span>
            </button>

            {/* Move to folder — shows sub-list of projects */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const submenuWidth = 180;
                const submenuHeight = Math.min(projects.length * 32 + 30, 300);
                
                let left = rect.right + 4;
                if (left + submenuWidth > window.innerWidth) {
                  left = Math.max(10, rect.left - submenuWidth - 4);
                }
                
                let top = Math.max(10, Math.min(rect.top, window.innerHeight - submenuHeight - 10));
                setFolderSubmenuSessionId(session.id);
                setSubmenuPosition({ top, left });
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (folderSubmenuSessionId === session.id) {
                    setFolderSubmenuSessionId(null);
                    setSubmenuPosition(null);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const submenuWidth = 180;
                    const submenuHeight = Math.min(projects.length * 32 + 30, 300);
                    
                    let left = rect.right + 4;
                    if (left + submenuWidth > window.innerWidth) {
                      left = Math.max(10, rect.left - submenuWidth - 4);
                    }
                    
                    let top = Math.max(10, Math.min(rect.top, window.innerHeight - submenuHeight - 10));
                    setFolderSubmenuSessionId(session.id);
                    setSubmenuPosition({ top, left });
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: folderSubmenuSessionId === session.id ? 'var(--bg-subtle)' : 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FolderInput size={12} />
                  <span>{t.sidebar.moveToFolder}</span>
                </span>
                <ChevronRight size={10} color="var(--text-muted)" />
              </button>

              {/* Submenu for Projects - Portal with smart positioning */}
              {isMounted && folderSubmenuSessionId === session.id && submenuPosition && createPortal(
                <div
                  data-submenu-portal="true"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'fixed',
                    top: `${submenuPosition.top}px`,
                    left: `${submenuPosition.left}px`,
                    width: '180px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md, 8px)',
                    boxShadow: 'var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.25))',
                    padding: '4px',
                    zIndex: 999999999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {projects.length === 0 && (
                    <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      {language === 'id' ? 'Belum ada folder' : 'No folders yet'}
                    </div>
                  )}
                  {projects.map((proj) => {
                    const isCurrent = session.projectId === proj.id;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[Sidebar] Moving to project:', proj.id, proj.name);
                          handleMoveToProject(session, proj.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: isCurrent ? 'var(--bg-subtle)' : 'transparent',
                          color: isCurrent ? 'var(--brand-primary)' : 'var(--text-primary)',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isCurrent ? 'var(--bg-subtle)' : 'transparent')}
                      >
                        <Folder size={11} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {proj.name}
                        </span>
                        {isCurrent && <Check size={11} color="var(--brand-primary)" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                  {/* Option to remove from current folder inside submenu */}
                  {session.projectId && (
                    <>
                      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 4px' }} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[Sidebar] Removing from project via submenu');
                          handleMoveToProject(session, null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--accent-danger)',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <FolderMinus size={11} />
                        <span>{t.sidebar.removeFromFolder}</span>
                      </button>
                    </>
                  )}
                </div>,
                document.body
              )}
            </div>

            {/* Direct "Keluarkan dari folder" option in main dropdown when session is in a project */}
            {session.projectId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[Sidebar] Removing from project via main menu');
                  handleMoveToProject(session, null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  setFolderSubmenuSessionId(null);
                  setSubmenuPosition(null);
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                }}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <FolderMinus size={12} color="var(--text-secondary)" />
                <span>{t.sidebar.removeFromFolder}</span>
              </button>
            )}

            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 4px' }} />

            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const token = await getAccessToken();
                  if (session.projectId && token) {
                    await removeSessionFromProject(session.projectId, session.id, token);
                  }
                } catch (err) {
                  console.error('[Sidebar] Failed to remove session from project on delete:', err);
                }
                deleteSession(session.id);
                setMenuSessionId(null);
                setFolderSubmenuSessionId(null);
                setSubmenuPosition(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 8px',
                borderRadius: '4px',
                border: 'none',
                background: 'transparent',
                color: 'var(--accent-danger)',
                fontSize: '11.5px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                setFolderSubmenuSessionId(null);
                setSubmenuPosition(null);
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Trash2 size={12} />
              <span>{t.common.delete}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const displayName =
    (typeof user?.user_metadata?.name === 'string' && user.user_metadata.name) ||
    (user?.email ? user.email.split('@')[0] : 'M Faiz asy syauqi');

  const displayEmail = user?.email || 'm.faizasysyauqi@gmail.com';

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <aside
        className={`app-sidebar-drawer ${isOpenMobile ? 'drawer-open' : ''} ${isDesktopCollapsed ? 'collapsed' : ''}`}
        style={{
          height: '100%',
          display: 'flex',
          background: 'var(--bg-sidebar)',
          flexShrink: 0,
          zIndex: 1000,
          overflow: 'visible',
        }}
      />
    );
  }

  return (
    <aside
      className={`app-sidebar-drawer ${isOpenMobile ? 'drawer-open' : ''} ${isDesktopCollapsed ? 'collapsed' : ''}`}
      style={{
        height: '100%',
        display: 'flex',
        background: 'var(--bg-sidebar)',
        flexShrink: 0,
        zIndex: 1000,
        overflow: 'visible',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
       * 1. Slim Left Icon Rail (48px)
       * ───────────────────────────────────────────────────────────── */}
      <div
        className="sidebar-icon-rail"
        style={{
          width: '48px',
          height: '100%',
          background: 'var(--bg-main)',
          borderRight: '1px solid var(--border-subtle)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0 12px 0',
          flexShrink: 0,
        }}
      >
        {/* Top: Brand Logo + Primary Feature Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* Logo container matching exact 48px header height for 1:1 symmetry */}
          <div
            style={{
              height: '48px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Link
              href="/chat"
              title="Anticeil Chat"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'transform 0.15s ease',
              }}
            >
              <img
                src="/anticeil-logo.png"
                alt="Anticeil Logo"
                style={{ width: '26px', height: '26px', objectFit: 'contain', borderRadius: '6px' }}
              />
            </Link>
          </div>

          {/* Expand button — only shown on desktop when collapsed */}
          {isDesktopCollapsed && onToggleDesktopCollapse && (
            <button
              onClick={onToggleDesktopCollapse}
              title="Expand sidebar"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: '2px',
              }}
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={17} />
            </button>
          )}

          {/* Quick App Icons */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingTop: '4px' }}>
            {/* Chat */}
            <Link
              href="/chat"
              title={t.nav.chat}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: pathname === '/chat' ? 'var(--brand-subtle, rgba(0, 115, 234, 0.15))' : 'transparent',
                color: pathname === '/chat' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageSquare size={17} />
            </Link>

            {/* Docs & LaTeX */}
            <Link
              href="/docs"
              title={t.nav.docs || 'Docs & LaTeX'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: pathname === '/docs' ? 'rgba(0, 115, 234, 0.15)' : 'transparent',
                color: pathname === '/docs' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={17} />
            </Link>

            {/* Image */}
            <Link
              href="/image"
              title={t.nav.imagine}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: pathname === '/image' ? 'rgba(162, 93, 220, 0.2)' : 'transparent',
                color: pathname === '/image' ? '#A25DDC' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <ImageIcon size={17} />
            </Link>

            {/* Video */}
            <Link
              href="/video"
              title={language === 'id' ? 'Video' : 'Video'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: pathname === '/video' ? 'rgba(251, 113, 133, 0.2)' : 'transparent',
                color: pathname === '/video' ? '#fb7185' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <Film size={17} />
            </Link>

            {/* Audio */}
            <Link
              href="/audio"
              title={language === 'id' ? 'Audio' : 'Audio'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: pathname === '/audio' ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                color: pathname === '/audio' ? '#60a5fa' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <Music size={17} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
       * 2. Main Workspace & Navigation Panel (Grok / Monday style)
       * Hidden on desktop when sidebar is collapsed (mini-rail mode)
       * ───────────────────────────────────────────────────────────── */}
      <div
        className={`sidebar-workspace-panel${isDesktopCollapsed ? ' desktop-collapsed-hidden' : ''}`}
        style={{
          flex: 1,
          background: 'var(--bg-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Workspace Title Header */}
        <div
          style={{
            height: '48px',
            boxSizing: 'border-box',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <span
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isImage
                ? 'Anticeil Image'
                : isVideo
                ? 'Anticeil Video'
                : isAudio
                ? 'Anticeil Audio'
                : 'Anticeil'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Mobile Drawer Close */}
            <button
              onClick={onCloseMobile}
              className="show-on-drawer"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '3px',
              }}
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>

            {/* Desktop Collapse Button */}
            {onToggleDesktopCollapse && (
              <button
                onClick={onToggleDesktopCollapse}
                className="hide-on-drawer"
                title={t.sidebar.collapseSidebar}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '3px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={t.sidebar.collapseSidebar}
              >
                <PanelLeftClose size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Primary Action Button (Mode-Aware) */}
        <div style={{ padding: '8px 10px 4px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {isImage ? (
            <button
              type="button"
              onClick={() => {
                if (pathname !== '/image') router.push('/image');
                if (onCloseMobile) onCloseMobile();
              }}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md, 6px)',
                background: pathname === '/image' ? 'var(--bg-subtle)' : 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
            >
              <Sparkles size={15} color="#A25DDC" />
              <span>{language === 'id' ? 'Gambar Baru' : 'New Image'}</span>
            </button>
          ) : isVideo ? (
            <button
              type="button"
              onClick={() => {
                if (pathname !== '/video') router.push('/video');
                if (onCloseMobile) onCloseMobile();
              }}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md, 6px)',
                background: pathname === '/video' ? 'var(--bg-subtle)' : 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
            >
              <Film size={15} color="#fb7185" />
              <span>{language === 'id' ? 'Video Baru' : 'New Video'}</span>
            </button>
          ) : isAudio ? (
            <button
              type="button"
              onClick={() => {
                if (pathname !== '/audio') router.push('/audio');
                if (onCloseMobile) onCloseMobile();
              }}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md, 6px)',
                background: pathname === '/audio' ? 'var(--bg-subtle)' : 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
            >
              <Music size={15} color="#60a5fa" />
              <span>{language === 'id' ? 'Audio Baru' : 'New Audio'}</span>
            </button>
          ) : isDocs ? (
            <button
              type="button"
              onClick={() => {
                const newId = createDocument('Dokumen Baru', undefined, 'latex', activeProjectId);
                setActiveDocId(newId);
                if (pathname !== '/docs') router.push('/docs');
                if (onCloseMobile) onCloseMobile();
              }}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md, 6px)',
                background: 'rgba(0, 115, 234, 0.1)',
                border: '1px solid rgba(0, 115, 234, 0.25)',
                color: 'var(--brand-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
            >
              <Plus size={15} color="var(--brand-primary)" />
              <span>{language === 'id' ? 'Dokumen Baru' : 'New Document'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateSession}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md, 6px)',
                background: pathname === '/chat' ? 'var(--bg-subtle)' : 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
            >
              <SquarePen size={15} color="var(--brand-primary)" />
              <span>{t.nav.newChat}</span>
            </button>
          )}

          {/* Connectors & Integrations Shortcut in Chat Mode */}
          {!isMediaMode && !isDocs && (
            <button
              type="button"
              onClick={() => setIsConnectorsModalOpen(true)}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-md, 6px)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Plug size={14} color="var(--brand-primary)" />
              <span>{t.nav.connectors || (language === 'id' ? 'Konektor & Integrasi' : 'Connectors & Integrations')}</span>
            </button>
          )}

          {/* Search Box (Mode-Aware) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              marginTop: '4px',
            }}
          >
            <Search size={12} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={
                isDocs
                  ? (language === 'id' ? 'Cari dokumen & folder...' : 'Search docs & folders...')
                  : isImage
                  ? language === 'id'
                    ? 'Cari prompt gambar...'
                    : 'Search image prompts...'
                  : isVideo
                  ? language === 'id'
                    ? 'Cari prompt video...'
                    : 'Search video prompts...'
                  : isAudio
                  ? language === 'id'
                    ? 'Cari prompt audio...'
                    : 'Search audio prompts...'
                    : t.sidebar.searchChats
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
            />
          </div>
        </div>

        {/* Scrollable Tree (Projects & History - Mode-Aware) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* ─────────────────────────────────────────────────────────────
           * A. MEDIA MODE SIDEBAR CONTENT (Image/Video/Audio)
           * ───────────────────────────────────────────────────────────── */}
          {isDocs ? (
            /* ─────────────────────────────────────────────────────────────
             * C. DOCS STUDIO MODE SIDEBAR CONTENT (Project Folders & Isolated Docs)
             * ───────────────────────────────────────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Workspace Project Folders Header */}
              <div
                onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {language === 'id' ? 'Folder Proyek' : 'Project Folders'}
                  </span>
                  {isProjectsExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                </div>
              </div>

              {isProjectsExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '2px' }}>
                  {/* Loading indicator */}
                  {projectsLoading && projects.length === 0 && (
                    <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'Memuat folder...' : 'Loading folders...'}
                    </div>
                  )}

                  {docFolders.map((folder) => {
                    const isFolderOpen = expandedFolderIds.has(folder.id);
                    const isSelected = activeProjectId === folder.id;
                    const folderDocs = docs
                      .filter(
                        (d) => d.projectId === folder.id &&
                          d.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt);

                    return (
                      <div key={folder.id} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {/* Folder Row */}
                        <div
                          className="clickable-pill"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '5px 8px',
                            borderRadius: 'var(--radius-sm, 6px)',
                            background: isSelected ? 'rgba(0, 115, 234, 0.12)' : isFolderOpen ? 'var(--bg-subtle)' : 'transparent',
                            color: isSelected ? 'var(--brand-primary)' : isFolderOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: isSelected || isFolderOpen ? 600 : 400,
                            cursor: 'pointer',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}
                            onClick={() => {
                              setActiveProjectId(folder.id);
                              setExpandedFolderIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(folder.id)) next.delete(folder.id);
                                else next.add(folder.id);
                                return next;
                              });
                            }}
                          >
                            {isFolderOpen ? (
                              <FolderOpen size={13} color={isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />
                            ) : (
                              <Folder size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            )}
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                              {folder.name}
                            </span>
                            {folderDocs.length > 0 && (
                              <span style={{
                                fontSize: '10px',
                                background: isSelected ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                                color: isSelected ? '#fff' : 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '999px',
                                padding: '0 5px',
                                lineHeight: '15px',
                                flexShrink: 0,
                              }}>
                                {folderDocs.length}
                              </span>
                            )}
                            <span style={{ flexShrink: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                              {isFolderOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                            </span>
                          </div>

                          {/* Folder Menu */}
                          <DocFolderMenu
                            folder={folder}
                            language={language}
                            onRename={renameDocFolder}
                            onDelete={deleteDocFolder}
                          />
                        </div>

                        {/* Inline docs inside folder */}
                        {isFolderOpen && (
                          <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '1px' }}>
                            {folderDocs.length === 0 ? (
                              <div style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                              }}>
                                {language === 'id' ? 'Belum ada dokumen di folder ini' : 'No docs in this folder'}
                              </div>
                            ) : (
                              folderDocs.map((doc) => (
                                <DocSidebarItem
                                  key={doc.id}
                                  doc={doc}
                                  isActive={activeDocId === doc.id}
                                  language={language}
                                  folders={docFolders}
                                  onSelect={() => {
                                    setActiveProjectId(folder.id);
                                    setActiveDocId(doc.id);
                                    if (pathname !== '/docs') router.push('/docs');
                                    if (onCloseMobile) onCloseMobile();
                                  }}
                                  onRename={(id, title) => updateDocumentTitle(id, title)}
                                  onDelete={(id) => deleteDocument(id)}
                                  onTogglePin={(id) => togglePin(id)}
                                  onMove={(id, targetProjId) => moveDocumentToProject(id, targetProjId)}
                                />
                              ))
                            )}

                            {/* Shortcut: Create new doc in this folder */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveProjectId(folder.id);
                                const newId = createDocument('Dokumen Baru', undefined, 'latex', folder.id);
                                setActiveDocId(newId);
                                if (pathname !== '/docs') router.push('/docs');
                                if (onCloseMobile) onCloseMobile();
                              }}
                              className="clickable-pill"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm, 6px)',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--brand-primary)',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                marginTop: '2px',
                              }}
                            >
                              <Plus size={10} />
                              <span>{language === 'id' ? 'Buat dokumen di folder ini' : 'Add document to folder'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Folder button for Docs */}
                  {isAddingDocFolder ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px' }}>
                      <input
                        type="text"
                        placeholder={language === 'id' ? 'Nama folder baru...' : 'New folder name...'}
                        value={newDocFolderName}
                        onChange={(e) => setNewDocFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const trimmed = newDocFolderName.trim();
                            if (trimmed) {
                              const newId = createDocFolder(trimmed);
                              setExpandedFolderIds((prev) => new Set(prev).add(newId));
                              setNewDocFolderName('');
                              setIsAddingDocFolder(false);
                            }
                          }
                          if (e.key === 'Escape') setIsAddingDocFolder(false);
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          fontSize: '11px',
                          color: 'var(--text-primary)',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newDocFolderName.trim();
                          if (trimmed) {
                            const newId = createDocFolder(trimmed);
                            setExpandedFolderIds((prev) => new Set(prev).add(newId));
                            setNewDocFolderName('');
                            setIsAddingDocFolder(false);
                          }
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer' }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingDocFolder(false)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingDocFolder(true)}
                      className="clickable-pill"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm, 6px)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        marginTop: '4px',
                      }}
                    >
                      <Plus size={11} />
                      <span>{language === 'id' ? 'Tambah folder dokumen' : 'Add doc folder'}</span>
                    </button>
                  )}

                  {/* Unassigned Docs / Dokumen Mandiri section (if any exist) */}
                  {unassignedDocs.length > 0 && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                      <div
                        onClick={() => {
                          setActiveProjectId(null);
                          setIsUnassignedExpanded(!isUnassignedExpanded);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 6px',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '10.5px', fontWeight: 650, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {language === 'id' ? 'Dokumen Lainnya' : 'Other Documents'} ({unassignedDocs.length})
                        </span>
                        {isUnassignedExpanded ? <ChevronDown size={10} color="var(--text-muted)" /> : <ChevronRight size={10} color="var(--text-muted)" />}
                      </div>

                      {isUnassignedExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingLeft: '4px' }}>
                          {unassignedDocs.map((doc) => (
                            <DocSidebarItem
                              key={doc.id}
                              doc={doc}
                              isActive={activeDocId === doc.id}
                              language={language}
                              folders={docFolders}
                              onSelect={() => {
                                setActiveProjectId(null);
                                setActiveDocId(doc.id);
                                if (pathname !== '/docs') router.push('/docs');
                                if (onCloseMobile) onCloseMobile();
                              }}
                              onRename={(id, title) => updateDocumentTitle(id, title)}
                              onDelete={(id) => deleteDocument(id)}
                              onTogglePin={(id) => togglePin(id)}
                              onMove={(id, targetProjId) => moveDocumentToProject(id, targetProjId)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isMediaMode ? (
            <>
              {/* Imagine Media Collections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {isVideo 
                        ? (language === 'id' ? 'Koleksi Video' : 'Video Collections')
                        : isAudio
                        ? (language === 'id' ? 'Koleksi Audio' : 'Audio Collections')
                        : (language === 'id' ? 'Koleksi Gambar' : 'Image Collections')}
                    </span>
                    {isProjectsExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isProjectsExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '2px' }}>
                    {imageCollections
                      .filter((col) => !['ic_cyberpunk', 'ic_wallpapers', 'ic_mockups'].includes(col.id))
                      .map((col) => (
                      <div
                        key={col.id}
                        className="clickable-pill"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm, 6px)',
                          background: activeImageCollectionId === col.id ? 'rgba(162, 93, 220, 0.15)' : 'transparent',
                          color: activeImageCollectionId === col.id ? '#A25DDC' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: activeImageCollectionId === col.id ? 600 : 400,
                          cursor: 'pointer',
                          justifyContent: 'space-between',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}
                          onClick={() => setActiveImageCollection(activeImageCollectionId === col.id ? null : col.id)}
                        >
                          <Folder size={12} color={activeImageCollectionId === col.id ? '#A25DDC' : 'var(--text-muted)'} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{col.name}</span>
                          {col.files.length > 0 && (
                            <span style={{ fontSize: '10px', background: '#A25DDC', color: '#fff', borderRadius: '999px', padding: '0 5px', lineHeight: '16px', flexShrink: 0 }}>
                              {col.files.length}
                            </span>
                          )}
                          <span style={{ flexShrink: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={10} />
                          </span>
                        </div>

                        {/* Three-dot menu for Media Collection */}
                        <ImagineFolderMenu
                          col={col}
                          language={language}
                          renameCollection={renameImageCollection}
                          deleteCollection={deleteImageCollection}
                          onOpenUpload={() => setDrawerState({ type: 'imageCollection', id: col.id })}
                        />
                      </div>
                    ))}

                    {isAddingImagineCollection ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px' }}>
                        <input
                          type="text"
                          placeholder={language === 'id' ? 'Nama koleksi media...' : 'Media collection name...'}
                          value={newImagineCollectionName}
                          onChange={(e) => setNewImagineCollectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const name = newImagineCollectionName.trim();
                              if (name && !imageCollections.some((c) => c.name === name)) {
                                createImageCollection(name);
                                setNewImagineCollectionName('');
                                setIsAddingImagineCollection(false);
                              }
                            }
                            if (e.key === 'Escape') setIsAddingImagineCollection(false);
                          }}
                          autoFocus
                          style={{
                            flex: 1,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const name = newImagineCollectionName.trim();
                            if (name && !imageCollections.some((c) => c.name === name)) {
                              createImageCollection(name);
                              setNewImagineCollectionName('');
                              setIsAddingImagineCollection(false);
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingImagineCollection(false)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingImagineCollection(true)}
                        className="clickable-pill"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm, 6px)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                        }}
                      >
                        <Plus size={11} />
                        <span>{language === 'id' ? 'Tambah koleksi media' : 'Add media collection'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Imagine History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {language === 'id' ? 'Riwayat Generasi' : 'Generation History'}
                    </span>
                    {isHistoryExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isHistoryExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {imagineHistory.length === 0 ? (
                      <div style={{ padding: '8px 10px', fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {language === 'id' ? 'Belum ada media dibuat' : 'No media generated yet'}
                      </div>
                    ) : (
                      imagineHistory
                        .filter((item) => {
                          const matchSearch = item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || item.style.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchCol = activeImageCollectionId ? item.collectionId === activeImageCollectionId : true;
                          return matchSearch && matchCol;
                        })
                        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
                        .map((item) => (
                          <div
                            key={item.id}
                            className="clickable-pill"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '5px 8px',
                              borderRadius: 'var(--radius-sm, 6px)',
                              background: item.isPinned ? 'rgba(162, 93, 220, 0.08)' : 'transparent',
                              color: 'var(--text-secondary)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              position: 'relative',
                            }}
                          >
                            {/* Type icon & Title */}
                            <div
                              onClick={() => { if (pathname !== '/image') router.push('/image'); if (onCloseMobile) onCloseMobile(); }}
                              style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: '7px' }}
                            >
                              {item.type === 'video' ? (
                                <Film size={13} color="#A25DDC" style={{ flexShrink: 0 }} />
                              ) : item.type === 'audio' ? (
                                <Music size={13} color="#A25DDC" style={{ flexShrink: 0 }} />
                              ) : (
                                <ImageIcon size={13} color="#A25DDC" style={{ flexShrink: 0 }} />
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {item.isPinned && <Pin size={9} color="#A25DDC" style={{ flexShrink: 0 }} />}
                                  <span>{item.prompt}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span>{item.style}</span>
                                  <span>•</span>
                                  <span>{item.time}</span>
                                  {item.collectionId && (
                                    <span style={{ background: 'rgba(162,93,220,0.15)', color: '#A25DDC', padding: '0 4px', borderRadius: '3px', fontSize: '9.5px', fontWeight: 600 }}>
                                      {imageCollections.find((c) => c.id === item.collectionId)?.name || '📁'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Three-dot menu for Media item (Same clean style as Chat) */}
                            <ImagineItemMenu
                              item={item}
                              language={language}
                              collections={imageCollections.filter((c) => !['ic_cyberpunk', 'ic_wallpapers', 'ic_mockups'].includes(c.id))}
                              togglePin={toggleImaginePin}
                              moveToCollection={moveImagineToCollection}
                              removeItem={removeImagineItem}
                            />
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ─────────────────────────────────────────────────────────────
             * D. DEFAULT CHAT MODE SIDEBAR CONTENT
             * ───────────────────────────────────────────────────────────── */
            <>
              {/* Projects Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t.sidebar.workspaceFolders}
                    </span>
                    {isProjectsExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isProjectsExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '2px' }}>
                    {/* Loading indicator */}
                    {projectsLoading && projects.length === 0 && (
                      <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {language === 'id' ? 'Memuat folder...' : 'Loading folders...'}
                      </div>
                    )}

                    {projects.map((proj) => {
                      const isFolderOpen = expandedFolderIds.has(proj.id);
                      const folderSessions = userSessions
                        .filter(
                          (s) => s.projectId === proj.id &&
                            s.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

                      return (
                        <div key={proj.id} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          {/* Folder row */}
                          <div
                            className="clickable-pill"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '7px',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm, 6px)',
                              background: isFolderOpen ? 'var(--bg-subtle)' : 'transparent',
                              color: isFolderOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontSize: '12px',
                              fontWeight: isFolderOpen ? 600 : 400,
                              cursor: 'pointer',
                              position: 'relative',
                            }}
                          >
                            {/* Left: toggle expand */}
                            <div
                              style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}
                              onClick={() => {
                                setExpandedFolderIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(proj.id)) next.delete(proj.id);
                                  else next.add(proj.id);
                                  return next;
                                });
                              }}
                            >
                              {isFolderOpen
                                ? <FolderOpen size={12} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                                : <Folder size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                              }
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                {proj.name}
                              </span>
                              {folderSessions.length > 0 && (
                                <span style={{
                                  fontSize: '10px',
                                  background: 'var(--brand-primary)',
                                  color: '#fff',
                                  borderRadius: '999px',
                                  padding: '0 5px',
                                  lineHeight: '16px',
                                  flexShrink: 0,
                                }}>
                                  {folderSessions.length}
                                </span>
                              )}
                              <span style={{ flexShrink: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                {isFolderOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                              </span>
                            </div>

                            {/* Folder three-dot menu */}
                            <FolderMenu
                              proj={proj}
                              language={language}
                              t={t}
                              accessToken={useAuthStore.getState().session?.access_token ?? null}
                              renameFolder={renameProject}
                              deleteFolder={deleteProject}
                              onDeleted={() => {
                                sessions
                                  .filter((s) => s.projectId === proj.id)
                                  .forEach((s) => moveSessionToProject(s.id, null));
                                setExpandedFolderIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(proj.id);
                                  return next;
                                });
                              }}
                            />
                          </div>

                          {/* Inline chat list inside folder */}
                          {isFolderOpen && (
                            <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              {folderSessions.length === 0 ? (
                                <div style={{
                                  padding: '6px 8px',
                                  fontSize: '11px',
                                  color: 'var(--text-muted)',
                                  fontStyle: 'italic',
                                }}>
                                  {t.sidebar.noFolderChats}
                                </div>
                              ) : (
                                folderSessions.map((s) => renderSessionItem(s))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isAddingProject ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px' }}>
                        <input
                          type="text"
                          placeholder={t.sidebar.newFolderPlaceholder}
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddProject();
                            if (e.key === 'Escape') setIsAddingProject(false);
                          }}
                          autoFocus
                          style={{
                            flex: 1,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            fontSize: '11px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddProject}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingProject(false)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingProject(true)}
                        className="clickable-pill"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm, 6px)',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                        }}
                      >
                        <Plus size={11} />
                        <span>{t.sidebar.addFolder}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Chat History Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 6px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t.sidebar.chatHistory}
                    </span>
                    {isHistoryExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isHistoryExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Pinned Chats at the Very Top (Max 3) */}
                    {pinnedSessions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '2px' }}>
                        <div style={{ padding: '3px 6px 1px 6px', fontSize: '10px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Pin size={10} color="var(--brand-primary)" />
                          <span>{language === 'id' ? 'Disematkan' : 'Pinned'} ({pinnedSessions.length}/3)</span>
                        </div>
                        {pinnedSessions.map(renderSessionItem)}
                        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 6px' }} />
                      </div>
                    )}

                    {todaySessions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {todaySessions.map(renderSessionItem)}
                      </div>
                    )}

                    {yesterdaySessions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ padding: '4px 6px 1px 6px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {t.common.yesterday}
                        </div>
                        {yesterdaySessions.map(renderSessionItem)}
                      </div>
                    )}

                    {earlierSessions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ padding: '4px 6px 1px 6px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {t.common.older}
                        </div>
                        {earlierSessions.map(renderSessionItem)}
                      </div>
                    )}

                    {filteredSessions.length === 0 && (
                      <div style={{ padding: '12px 8px', fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {t.sidebar.noChatsFound}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
         * 3. Bottom Profile Bar with Grok-style Floating Popover Menu
         * ───────────────────────────────────────────────────────────── */}
        <div
          ref={profileMenuRef}
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '8px 10px',
            background: 'var(--bg-main)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Floating Profile Popover Menu (moved to be anchored at trigger button) */}

          {/* AI Credits Meter (Matching StorageMeter design) */}
          <div style={{ marginBottom: '8px' }}>
            <div
              onClick={() => openPricingModal('topup')}
              title={language === 'id' ? 'Kredit AI Harian & Saldo Tambahan — Klik untuk Top-up / Upgrade' : 'Daily AI Credits & Extra Balance — Click to Top-up / Upgrade'}
              className="clickable-pill"
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <Zap size={12} color="#f59e0b" fill="#f59e0b" />
                  <span>{language === 'id' ? 'Kredit AI' : 'AI Credits'}</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 700, color: dailyCredits === 0 ? 'var(--accent-danger, #ef4444)' : 'var(--text-primary)' }}>
                    {dailyCredits}/{maxCredits}
                  </span>
                  {paidCredits > 0 && (
                    <span style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      color: '#f59e0b',
                      background: 'rgba(245, 158, 11, 0.18)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}>
                      +{paidCredits}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Track */}
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--border-subtle)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (dailyCredits / maxCredits) * 100))}%`,
                    height: '100%',
                    backgroundColor: dailyCredits === 0 ? 'var(--accent-danger, #ef4444)' : '#f59e0b',
                    borderRadius: '9999px',
                    transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Storage Quota Progress Bar (Sleek Compact View) */}
          <div style={{ marginBottom: '8px' }}>
            <StorageMeter compact onManageClick={() => openPricingModal('tiers')} />
          </div>

          {/* Profile Trigger Button (Avatar + Name) */}
          <div style={{ position: 'relative' }}>
          {/* Floating Profile Popover Menu (anchored above trigger button only) */}
          {isProfileMenuOpen && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: 'var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.25))',
                padding: '6px',
                zIndex: 999999999,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {/* User Header */}
              <div
                style={{
                  padding: '8px 10px 6px 10px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '3px',
                }}
              >
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayEmail}
                </div>
              </div>

              {/* Settings Section Label */}
              <div style={{ padding: '6px 10px 3px', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {language === 'id' ? 'Pengaturan' : 'Settings'}
              </div>

              {/* API Keys */}
              <button
                type="button"
                onClick={() => { openSettingsTab('keys'); setIsProfileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <KeyRound size={14} color="var(--text-secondary)" />
                <span>{language === 'id' ? 'Kunci API (BYOK)' : 'API Keys (BYOK)'}</span>
              </button>

              {/* Appearance */}
              <button
                type="button"
                onClick={() => { openSettingsTab('appearance'); setIsProfileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Palette size={14} color="var(--text-secondary)" />
                <span>{language === 'id' ? 'Tampilan & Bahasa' : 'Appearance & Language'}</span>
              </button>

              {/* Database */}
              <button
                type="button"
                onClick={() => { openSettingsTab('backup'); setIsProfileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Database size={14} color="var(--text-secondary)" />
                <span>{language === 'id' ? 'Database & Cadangan' : 'Database & Backup'}</span>
              </button>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '3px 0' }} />

              {/* Tingkatkan Paket */}
              <button
                type="button"
                onClick={() => { openPricingModal('tiers'); setIsProfileMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,115,234,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Zap size={14} color="var(--brand-primary)" />
                <span>{language === 'id' ? 'Tingkatkan Paket' : 'Upgrade Plan'}</span>
              </button>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '3px 0' }} />

              {/* Logout / Login */}
              {user ? (
                <button
                  type="button"
                  onClick={() => { signOut(); setIsProfileMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--accent-danger)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={14} />
                  <span>{language === 'id' ? 'Keluar' : 'Log Out'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={14} />
                  <span>{language === 'id' ? 'Masuk' : 'Log In'}</span>
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="clickable-pill"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: 'var(--radius-md, 8px)',
              background: isProfileMenuOpen ? 'var(--bg-subtle)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0073EA, #A25DDC)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12.5px',
                fontWeight: 700,
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0, 115, 234, 0.3)',
              }}
            >
              {displayName[0].toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {displayName}
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: tier === 'enterprise' ? 'rgba(139, 92, 246, 0.15)' : tier === 'pro' ? 'rgba(0, 115, 234, 0.15)' : 'rgba(0, 200, 117, 0.12)',
                    color: tier === 'enterprise' ? '#a78bfa' : tier === 'pro' ? 'var(--brand-primary)' : 'var(--accent-success)',
                    border: `1px solid ${tier === 'enterprise' ? 'rgba(139, 92, 246, 0.4)' : tier === 'pro' ? 'rgba(0, 115, 234, 0.3)' : 'rgba(0, 200, 117, 0.3)'}`,
                    flexShrink: 0,
                  }}
                >
                  {tier === 'enterprise' ? 'ENTERPRISE' : tier === 'pro' ? 'PRO' : 'FREE'}
                </span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tier === 'enterprise' ? 'Custom Supabase' : tier === 'pro' ? 'Supabase Cloud' : (language === 'id' ? 'Penyimpanan Lokal' : 'Local Storage')}
              </div>
            </div>

            <MoreHorizontal size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          </button>
          </div>{/* end position:relative wrapper */}
        </div>
      </div>

      <ConnectorsModal
        isOpen={isConnectorsModalOpen}
        onClose={() => setIsConnectorsModalOpen(false)}
      />

      <FolderFileDrawer
        isOpen={drawerState !== null}
        onClose={() => setDrawerState(null)}
        folderName={drawerFolder?.name ?? ''}
        files={drawerFolder?.files ?? []}
        onFileAdded={handleDrawerFileAdded}
        onFileRemoved={handleDrawerFileRemoved}
        acceptTypes={drawerAcceptTypes}
        language={language}
      />
    </aside>
  );
}
