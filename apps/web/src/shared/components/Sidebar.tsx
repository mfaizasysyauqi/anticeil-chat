'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getTierStorageName, getTierBadgeStyle } from '@anticeil/core';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  Copy,
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
  Table,
  Presentation,
  BookOpen,
} from 'lucide-react';
import { useChatStore } from '../../features/chat/store/useChatStore';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { ConnectorsModal } from '../../features/connectors/components/ConnectorsModal';
import { StorageMeter } from '../../features/storage/components/StorageMeter';
import { BottomRailMeters } from './BottomRailMeters';
import { DrawerPanelHeader } from './DrawerPanelHeader';
import { ProfileBar } from './ProfileBar';
import { SidebarRail } from './SidebarRail';
import { RailIconButton } from './RailIconButton';
import { getTranslation, ChatSession } from '@anticeil/core';
import { useWorkspaceStore } from '../../features/storage/store/useWorkspaceStore';
import { useProjectStore } from '../../features/chat/store/useProjectStore';
import { useImageStore } from '../../features/image/store/useImageStore';
import { useDocsStore, DocItem } from '../../features/docs/store/useDocsStore';
import { FolderFileDrawer } from '../../features/storage/components/FolderFileDrawer';
import { useCreditStore } from '../../features/credits/store/useCreditStore';
import { MediaDetailModal } from './MediaDetailModal';
import { createClient } from '../utils/supabase/client';
import { DOC_CATEGORIES, ALL_DOC_SECTIONS } from '../../features/documentation/data';
import { DocSidebar } from '../../features/documentation/components/DocSidebar';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isDesktopCollapsed?: boolean;
  onToggleDesktopCollapse?: () => void;
  onOpenModelSelector?: () => void;
  railOnly?: boolean;
  drawerOnly?: boolean;
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
  const [copied, setCopied] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; left: number } | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);

  const fullMediaItem = useImageStore((s) => s.items).find((i) => i.id === item.id);

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.prompt);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1000);
    } catch {}
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fullMediaItem?.url) {
      try {
        const res = await fetch(fullMediaItem.url);
        const blob = await res.blob();
        const ext = item.type === 'video' ? 'mp4' : item.type === 'audio' ? 'mp3' : 'png';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anticeil-${item.type}-${item.id.slice(0, 8)}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        window.open(fullMediaItem.url, '_blank');
      }
    }
    setOpen(false);
  };

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
      const menuWidth = 160;
      const menuHeight = 160;
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
            minWidth: '155px',
          }}
        >
          {/* Pin / Unpin */}
          {(() => {
            const pinColor = item.type === 'video' ? '#fb7185' : item.type === 'audio' ? '#60a5fa' : 'var(--rail-media-color)';
            return (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); togglePin(item.id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
                  borderRadius: '4px', border: 'none', background: 'transparent',
                  color: item.isPinned ? pinColor : 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Pin size={11} fill={item.isPinned ? pinColor : 'none'} color={item.isPinned ? pinColor : 'currentColor'} />
                <span>{item.isPinned ? (language === 'id' ? 'Lepas sematkan' : 'Unpin') : (language === 'id' ? 'Sematkan' : 'Pin')}</span>
              </button>
            );
          })()}

          {/* Copy Prompt */}
          <button
            type="button"
            onClick={handleCopyPrompt}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: copied ? '#10B981' : 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {copied ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
            <span>{copied ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin Prompt' : 'Copy Prompt')}</span>
          </button>

          {/* Download File */}
          {fullMediaItem?.url && (
            <button
              type="button"
              onClick={handleDownload}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
                borderRadius: '4px', border: 'none', background: 'transparent',
                color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Download size={11} />
              <span>{language === 'id' ? 'Unduh Berkas' : 'Download'}</span>
            </button>
          )}

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
                        background: item.collectionId === c.id ? 'var(--rail-media-bg)' : 'transparent',
                        color: item.collectionId === c.id ? 'var(--rail-media-color)' : 'var(--text-primary)',
                        fontSize: '11px', cursor: 'pointer', textAlign: 'left', fontWeight: item.collectionId === c.id ? 600 : 400,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = item.collectionId === c.id ? 'var(--rail-media-bg)' : 'transparent')}
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
    if (doc.format === 'sheet') return <Table size={12} color="#22c55e" style={{ flexShrink: 0 }} />;
    if (doc.format === 'slide') return <Presentation size={12} color="#f59e0b" style={{ flexShrink: 0 }} />;
    return <FileText size={12} color="var(--brand-primary)" style={{ flexShrink: 0 }} />;
  };

  const activeColor = doc.format === 'sheet' ? '#22c55e' : doc.format === 'slide' ? '#f59e0b' : 'var(--brand-primary)';
  const activeBg = doc.format === 'sheet' ? 'rgba(34, 197, 94, 0.12)' : doc.format === 'slide' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0, 115, 234, 0.12)';
  const pinnedBg = doc.format === 'sheet' ? 'rgba(34, 197, 94, 0.05)' : doc.format === 'slide' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(0, 115, 234, 0.05)';

  return (
    <div
      className="clickable-pill"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '4px 8px',
        borderRadius: 'var(--radius-sm, 6px)',
        background: isActive ? activeBg : doc.isPinned ? pinnedBg : 'transparent',
        color: isActive ? activeColor : 'var(--text-secondary)',
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
            color: isActive ? activeColor : 'var(--text-primary)',
            flex: 1,
          }}
        >
          {doc.title || 'Untitled Doc'}
        </span>
        {doc.isPinned && <Pin size={9} color={activeColor} style={{ flexShrink: 0 }} />}
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

interface DateGroup<T> {
  labelId: string;
  labelEn: string;
  items: T[];
}

function groupItemsByDate<T extends { updatedAt?: number; createdAt?: number; isPinned?: boolean }>(
  items: T[]
): DateGroup<T>[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const getTime = (item: T) => item.updatedAt || item.createdAt || 0;

  const pinned = items.filter((item) => item.isPinned);
  const unpinned = items.filter((item) => !item.isPinned);

  const today = unpinned.filter((item) => getTime(item) >= startOfToday);
  const yesterday = unpinned.filter((item) => getTime(item) >= startOfYesterday && getTime(item) < startOfToday);
  const previous7Days = unpinned.filter((item) => getTime(item) >= startOf7Days && getTime(item) < startOfYesterday);
  const earlier = unpinned.filter((item) => getTime(item) < startOf7Days);

  const groups: DateGroup<T>[] = [];

  if (pinned.length > 0) {
    groups.push({ labelId: 'Disematkan', labelEn: 'Pinned', items: pinned });
  }
  if (today.length > 0) {
    groups.push({ labelId: 'Hari Ini', labelEn: 'Today', items: today });
  }
  if (yesterday.length > 0) {
    groups.push({ labelId: 'Kemarin', labelEn: 'Yesterday', items: yesterday });
  }
  if (previous7Days.length > 0) {
    groups.push({ labelId: '7 Hari Terakhir', labelEn: 'Previous 7 Days', items: previous7Days });
  }
  if (earlier.length > 0) {
    groups.push({ labelId: 'Sebelumnya', labelEn: 'Earlier', items: earlier });
  }

  return groups;
}

export function Sidebar({
  isOpenMobile = false,
  onCloseMobile,
  isDesktopCollapsed = false,
  onToggleDesktopCollapse,
  onOpenModelSelector,
  railOnly = false,
  drawerOnly = false,
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
  const [avatarImgError, setAvatarImgError] = useState(false);
  const session = useAuthStore((s) => s.session);

  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab');
  const isMedia = pathname === '/media' || pathname?.startsWith('/media');
  const isImage = pathname === '/image' || (isMedia && (!currentTab || currentTab === 'image'));
  const isVideo = pathname === '/video' || (isMedia && currentTab === 'video');
  const isAudio = pathname === '/audio' || (isMedia && currentTab === 'audio');
  const isDocs = pathname === '/docs' || pathname?.startsWith('/docs');
  const isDocumentation = pathname === '/documentation' || pathname?.startsWith('/documentation');
  const isMediaMode = isMedia || pathname === '/image' || pathname === '/video' || pathname === '/audio';

  const activeDocSectionId = searchParams?.get('section') || 'intro';

  // Docs store state (isolated database & folders completely independent from Chat)
  const docs = useDocsStore((s) => s.documents);
  const docFolders = useDocsStore((s) => s.folders);
  const createDocFolder = useDocsStore((s) => s.createFolder);
  const renameDocFolder = useDocsStore((s) => s.renameFolder);
  const deleteDocFolder = useDocsStore((s) => s.deleteFolder);
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const activeProjectId = useDocsStore((s) => s.activeProjectId);
  const selectedDocFormat = useDocsStore((s) => s.selectedFormat);
  const setSelectedDocFormat = useDocsStore((s) => s.setSelectedFormat);
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

  // Active Doc format derivation & format filtering
  const activeDoc = docs.find((d) => d.id === activeDocId || (pathname.startsWith('/docs/') && pathname.endsWith(d.id)));
  const currentDocFormat = pathname === '/docs' ? selectedDocFormat : (activeDoc?.format || selectedDocFormat || 'latex');
  const isSheetDoc = currentDocFormat === 'sheet';
  const isSlideDoc = currentDocFormat === 'slide';
  const isLatexDoc = !isSheetDoc && !isSlideDoc;

  // Filtered documents by format (LaTeX/Document, Sheet, Slide) and search query
  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFormat = isSheetDoc
        ? d.format === 'sheet'
        : isSlideDoc
        ? d.format === 'slide'
        : (d.format === 'latex' || d.format === 'typst' || d.format === 'markdown' || !d.format);
      return matchSearch && matchFormat;
    });
  }, [docs, searchQuery, isSheetDoc, isSlideDoc]);

  const unassignedDocs = useMemo(() => {
    return filteredDocs
      .filter((d) => !d.projectId)
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt);
  }, [filteredDocs]);

  // Imagine Mode UI States
  const [isAddingImagineCollection, setIsAddingImagineCollection] = useState(false);
  const [newImagineCollectionName, setNewImagineCollectionName] = useState('');
  const [selectedMediaItem, setSelectedMediaItem] = useState<any>(null);

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

  const mediaAccentColor = isVideo ? '#fb7185' : isAudio ? '#60a5fa' : 'var(--rail-media-color)';
  const mediaBadgeBg = isVideo ? 'rgba(251, 113, 133, 0.15)' : isAudio ? 'rgba(96, 165, 250, 0.15)' : 'var(--rail-media-bg)';
  const mediaPinnedBg = isVideo ? 'rgba(251, 113, 133, 0.08)' : isAudio ? 'rgba(96, 165, 250, 0.08)' : 'rgba(56, 189, 248, 0.08)';

  // Strictly isolate history by media type: video on /video, audio on /audio, image on /image
  const currentMediaHistory = useMemo(() => {
    return imagineHistory.filter((item) => {
      if (isVideo) return item.type === 'video';
      if (isAudio) return item.type === 'audio';
      if (isImage) return item.type === 'image' || !item.type;
      return true;
    });
  }, [imagineHistory, isVideo, isAudio, isImage]);

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
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

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

  const drawerTitle = isDocumentation
    ? (language === 'id' ? 'Dokumentasi' : 'Documentation')
    : isMediaMode
    ? 'Media Studio'
    : isDocs
    ? 'Docs Studio'
    : (language === 'id' ? 'Percakapan' : 'Chat');

  const docSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !isDocumentation) return [];
    return ALL_DOC_SECTIONS.filter((sec) => {
      const titleMatch = (sec.titleId + ' ' + sec.titleEn).toLowerCase().includes(q);
      const summaryMatch = ((sec.summaryId || '') + ' ' + (sec.summaryEn || '')).toLowerCase().includes(q);
      const contentMatch = JSON.stringify(language === 'id' ? sec.contentId : sec.contentEn).toLowerCase().includes(q);
      return titleMatch || summaryMatch || contentMatch;
    });
  }, [searchQuery, isDocumentation, language]);

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
            color={isActive ? 'var(--rail-chat-color)' : 'var(--text-muted)'}
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
    (user?.email ? user.email.split('@')[0] : (t.common.guest || (language === 'id' ? 'Tamu' : 'Guest')));

  const displayEmail = user?.email || '-';

  const avatarUrl =
    (typeof user?.user_metadata?.avatar_url === 'string' && user.user_metadata.avatar_url) ||
    (typeof user?.user_metadata?.picture === 'string' && user.user_metadata.picture) ||
    null;

  // Prevent hydration mismatch by rendering correctly proportioned placeholder until mounted
  if (!isMounted) {
    if (railOnly) {
      return (
        <aside
          className="sidebar-rail-aside"
          style={{
            width: '48px',
            minWidth: '48px',
            maxWidth: '48px',
            height: '100%',
            display: 'flex',
            background: 'var(--bg-main)',
            borderRight: '1px solid var(--border-subtle)',
            flexShrink: 0,
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div
            className="sidebar-icon-rail"
            style={{
              width: '48px',
              height: '100%',
              background: 'var(--bg-main)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 0,
              flexShrink: 0,
            }}
          >
            {/* Top: Brand Logo matching header height 48px */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
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
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src="/anticeil-logo.png"
                    alt="Anticeil Logo"
                    style={{ width: '26px', height: '26px', objectFit: 'contain', borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* Quick App Icons Placeholder */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingTop: '4px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: pathname === '/chat' ? 'rgba(0, 115, 234, 0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={17} color={pathname === '/chat' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                </div>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: (pathname === '/docs' || pathname.startsWith('/docs')) ? 'rgba(0, 115, 234, 0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={17} color={(pathname === '/docs' || pathname.startsWith('/docs')) ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                </div>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: (pathname === '/media' || pathname.startsWith('/audio') || pathname.startsWith('/image') || pathname.startsWith('/video')) ? 'rgba(162, 93, 220, 0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={17} color={(pathname === '/media' || pathname.startsWith('/audio') || pathname.startsWith('/image') || pathname.startsWith('/video')) ? '#A25DDC' : 'var(--text-muted)'} />
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              />
            </div>
          </div>
        </aside>
      );
    }

    if (drawerOnly) {
      return (
        <aside
          className={`app-sidebar-drawer drawer-only-panel ${isOpenMobile ? 'drawer-open' : ''} ${isDesktopCollapsed ? 'collapsed' : ''}`}
          style={{
            height: '100%',
            display: 'flex',
            background: 'var(--bg-sidebar)',
            flexShrink: 0,
            zIndex: 1000,
            overflow: 'visible',
            border: 'none',
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
      />
    );
  }

  return (
    <aside
      className={`app-sidebar-drawer${drawerOnly ? ' drawer-only-panel' : ''} ${isOpenMobile ? 'drawer-open' : ''} ${isDesktopCollapsed ? 'collapsed' : ''}`}
      style={{
        height: '100%',
        display: 'flex',
        background: 'var(--bg-sidebar)',
        flexShrink: 0,
        zIndex: 1000,
        overflow: 'visible',
        // railOnly: fix the aside to exactly 48px (CSS class sets 288px otherwise)
        ...(railOnly ? { width: '48px', minWidth: '48px' } : {}),
        // drawerOnly: no rail means no left border on the aside itself (desktop only)
        ...(drawerOnly ? { border: 'none' } : {}),
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
       * 1. Slim Left Icon Rail (48px)
       * Show on desktop when not drawerOnly, or on mobile/tablet always
       * ───────────────────────────────────────────────────────────── */}
      {/* 1. Desktop Icon Rail (48px fixed width) */}
      {!drawerOnly && (
        <SidebarRail
          className="hide-on-drawer"
          topContent={
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
          }
          bottomContent={
            <>
              <RailIconButton
                href="/documentation"
                label={language === 'id' ? 'Dokumentasi' : 'Documentation'}
                icon={<BookOpen size={17} />}
                isActive={isDocumentation}
                colorType="docs"
              />
              <BottomRailMeters onOpenTopup={() => openPricingModal('topup')} onOpenTiers={() => openPricingModal('tiers')} />
            </>
          }
        >
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
            <RailIconButton
              href="/chat"
              label={t.nav.chat || 'Anticeil Chat'}
              icon={<MessageSquare size={17} />}
              isActive={pathname === '/chat'}
              colorType="chat"
            />
            <RailIconButton
              href="/docs"
              label={t.nav.docs || 'Docs Studio'}
              icon={<FileText size={17} />}
              isActive={pathname === '/docs' || pathname.startsWith('/docs')}
              colorType="docs"
            />
            <RailIconButton
              href="/media"
              label={t.nav.imagine || 'Media Studio'}
              icon={<Sparkles size={17} />}
              isActive={isMediaMode}
              colorType="media"
            />
          </div>
        </SidebarRail>
      )}

      {/* ─────────────────────────────────────────────────────────────
       * 2. Main Workspace & Navigation Panel (Grok / Monday style)
       * Hidden on desktop when sidebar is collapsed (mini-rail mode)
       * ───────────────────────────────────────────────────────────── */}
      {!railOnly && <div
        className={`sidebar-workspace-panel${isDesktopCollapsed ? ' desktop-collapsed-hidden' : ''}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          background: 'var(--bg-sidebar)',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Icon Rail for Drawer Mode (Mobile/Tablet only - shown when drawer is open) */}
        {drawerOnly && (
          <SidebarRail
            className="show-on-drawer"
            onOpenTopup={() => {
              onCloseMobile?.();
              openPricingModal('topup');
            }}
            onOpenTiers={() => {
              onCloseMobile?.();
              openPricingModal('tiers');
            }}
            topContent={
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
                onClick={onCloseMobile}
              >
                <img
                  src="/anticeil-logo.png"
                  alt="Anticeil Logo"
                  style={{ width: '26px', height: '26px', objectFit: 'contain', borderRadius: '6px' }}
                />
              </Link>
            }
            bottomContent={
              <>
                <RailIconButton
                  href="/documentation"
                  onClick={onCloseMobile}
                  label={language === 'id' ? 'Dokumentasi' : 'Documentation'}
                  icon={<BookOpen size={17} />}
                  isActive={isDocumentation}
                  colorType="docs"
                />
                <BottomRailMeters onOpenTopup={() => { onCloseMobile?.(); openPricingModal('topup'); }} onOpenTiers={() => { onCloseMobile?.(); openPricingModal('tiers'); }} />
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingTop: '4px' }}>
              <RailIconButton
                href="/chat"
                onClick={onCloseMobile}
                label={t.nav.chat || 'Anticeil Chat'}
                icon={<MessageSquare size={17} />}
                isActive={pathname === '/chat'}
                colorType="chat"
              />
              <RailIconButton
                href="/docs"
                onClick={onCloseMobile}
                label={t.nav.docs || 'Docs Studio'}
                icon={<FileText size={17} />}
                isActive={pathname === '/docs' || pathname.startsWith('/docs')}
                colorType="docs"
              />
              <RailIconButton
                href="/media"
                onClick={onCloseMobile}
                label={t.nav.imagine || 'Media Studio'}
                icon={<Sparkles size={17} />}
                isActive={isMediaMode}
                colorType="media"
              />
            </div>
          </SidebarRail>
        )}

        {/* Main Content Panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}>
        {/* Workspace Title Header — hidden when drawerOnly (Navbar is above and shows title) */}
        {!drawerOnly && (
          <DrawerPanelHeader
            title={drawerTitle}
            titleStyle="primary"
            onClose={onCloseMobile}
            collapseLabel={t.sidebar.collapseSidebar}
            onCollapse={onToggleDesktopCollapse}
          />
        )}

        {/* Drawer-only top bar: feature title + collapse button */}
        {drawerOnly && (
          <DrawerPanelHeader
            hideClass="hide-on-drawer"
            title={drawerTitle}
            collapseLabel={t.sidebar.collapseSidebar}
            onCollapse={onToggleDesktopCollapse}
          />
        )}

        {/* Mobile-only Feature Subheader */}
        <DrawerPanelHeader
          showClass="show-on-drawer"
          title={drawerTitle}
          onClose={onCloseMobile}
        />

        {/* Primary Action Button (Mode-Aware) */}
        {!isDocumentation && (
          <div style={{ padding: '8px 10px 4px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {isMediaMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
              <button
                type="button"
                onClick={() => {
                  router.push('/media?tab=image');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md, 6px)',
                  background: isImage ? 'var(--rail-media-bg)' : 'transparent',
                  border: isImage ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                  color: isImage ? 'var(--rail-media-color)' : 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: isImage ? 600 : 500,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <ImageIcon size={14} color="var(--rail-media-color)" />
                <span>{language === 'id' ? 'Gambar Baru' : 'New Image'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push('/media?tab=video');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md, 6px)',
                  background: isVideo ? 'rgba(251, 113, 133, 0.12)' : 'transparent',
                  border: isVideo ? '1px solid rgba(251, 113, 133, 0.3)' : '1px solid transparent',
                  color: isVideo ? '#fb7185' : 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: isVideo ? 600 : 500,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Film size={14} color="#fb7185" />
                <span>{language === 'id' ? 'Video Baru' : 'New Video'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push('/media?tab=audio');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md, 6px)',
                  background: isAudio ? 'rgba(96, 165, 250, 0.12)' : 'transparent',
                  border: isAudio ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid transparent',
                  color: isAudio ? '#60a5fa' : 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontWeight: isAudio ? 600 : 500,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Music size={14} color="#60a5fa" />
                <span>{language === 'id' ? 'Audio Baru' : 'New Audio'}</span>
              </button>
            </div>
          ) : isDocs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
              {(() => {
                const activeDoc = docs.find((d) => d.id === activeDocId);
                const currentDocFormat = pathname === '/docs' ? selectedDocFormat : (activeDoc?.format || 'latex');

                const docsNavItems = [
                  {
                    format: 'latex' as const,
                    icon: <FileText size={14} color="var(--rail-docs-color)" />,
                    label: language === 'id' ? 'Dokumen Baru' : 'New Document',
                    color: 'var(--rail-docs-color)',
                    bg: 'var(--rail-docs-bg)',
                    border: 'rgba(52, 211, 153, 0.3)',
                    isActive: isDocs && (currentDocFormat === 'latex' || currentDocFormat === 'markdown' || !currentDocFormat),
                  },
                  {
                    format: 'sheet' as const,
                    icon: <Table size={14} color="#22c55e" />,
                    label: language === 'id' ? 'Spreadsheet Baru' : 'New Spreadsheet',
                    color: '#22c55e',
                    bg: 'rgba(34, 197, 94, 0.12)',
                    border: 'rgba(34, 197, 94, 0.3)',
                    isActive: isDocs && currentDocFormat === 'sheet',
                  },
                  {
                    format: 'slide' as const,
                    icon: <Presentation size={14} color="#f59e0b" />,
                    label: language === 'id' ? 'Slide Baru' : 'New Slide',
                    color: '#f59e0b',
                    bg: 'rgba(245, 158, 11, 0.12)',
                    border: 'rgba(245, 158, 11, 0.3)',
                    isActive: isDocs && currentDocFormat === 'slide',
                  },
                ];

                return docsNavItems.map(({ format, icon, label, color, bg, border, isActive }) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => {
                      if (selectedDocFormat !== format) {
                        setSelectedDocFormat(format);
                      }
                      if (activeDocId !== null) {
                        setActiveDocId(null);
                      }
                      if (pathname !== '/docs') {
                        router.push('/docs');
                      }
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="clickable-pill"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-md, 6px)',
                      background: isActive ? bg : 'transparent',
                      border: isActive ? `1px solid ${border}` : '1px solid transparent',
                      color: isActive ? color : 'var(--text-primary)',
                      fontSize: '12.5px',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                ));
              })()}
            </div>
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
              <SquarePen size={15} color="var(--rail-chat-color)" />
              <span>{t.nav.newChat}</span>
            </button>
          )}

          {/* Connectors & Integrations Shortcut in Chat Mode */}
          {!isMediaMode && !isDocs && !isDocumentation && (
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
              <Plug size={14} color="var(--rail-chat-color)" />
              <span>{t.nav.connectors || (language === 'id' ? 'Konektor & Integrasi' : 'Connectors & Integrations')}</span>
            </button>
          )}

          {/* Divider between Menu Navigation & Search */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              margin: '3px 0 1px 0',
            }}
          />

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
            }}
          >
            <Search size={12} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={
                isDocumentation
                  ? (language === 'id' ? 'Filter topik...' : 'Filter topics...')
                  : isDocs
                  ? isSheetDoc
                    ? (language === 'id' ? 'Cari spreadsheet & folder...' : 'Search spreadsheets & folders...')
                    : isSlideDoc
                    ? (language === 'id' ? 'Cari slide & folder...' : 'Search slides & folders...')
                    : (language === 'id' ? 'Cari dokumen & folder...' : 'Search docs & folders...')
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
        )}

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
          {isDocumentation ? (
            <DocSidebar
              embedded
              categories={DOC_CATEGORIES}
              activeSectionId={activeDocSectionId}
              onSelectSection={(secId) => {
                router.push(`/documentation?section=${secId}`);
                if (onCloseMobile) onCloseMobile();
              }}
              language={language as 'id' | 'en'}
              searchQuery={searchQuery}
              onSearchChange={(q) => setSearchQuery(q)}
              searchResults={docSearchResults}
            />
          ) : isDocs ? (
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
                    {isSheetDoc
                      ? (language === 'id' ? 'Folder Spreadsheet' : 'Spreadsheet Folders')
                      : isSlideDoc
                      ? (language === 'id' ? 'Folder Slide' : 'Slide Folders')
                      : (language === 'id' ? 'Folder Dokumen' : 'Document Folders')}
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
                    const folderDocs = filteredDocs
                      .filter((d) => d.projectId === folder.id)
                      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.updatedAt - a.updatedAt);

                    const folderActiveColor = isSheetDoc ? '#22c55e' : isSlideDoc ? '#f59e0b' : 'var(--brand-primary)';
                    const folderActiveBg = isSheetDoc ? 'rgba(34, 197, 94, 0.12)' : isSlideDoc ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0, 115, 234, 0.12)';

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
                            background: isSelected ? folderActiveBg : isFolderOpen ? 'var(--bg-subtle)' : 'transparent',
                            color: isSelected ? folderActiveColor : isFolderOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
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
                              <FolderOpen size={13} color={isSelected ? folderActiveColor : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />
                            ) : (
                              <Folder size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            )}
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                              {folder.name}
                            </span>
                            {folderDocs.length > 0 && (
                              <span style={{
                                fontSize: '10px',
                                background: isSelected ? folderActiveColor : 'var(--bg-subtle)',
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
                                {isSheetDoc
                                  ? (language === 'id' ? 'Belum ada spreadsheet di folder ini' : 'No spreadsheets in this folder')
                                  : isSlideDoc
                                  ? (language === 'id' ? 'Belum ada slide di folder ini' : 'No slides in this folder')
                                  : (language === 'id' ? 'Belum ada dokumen di folder ini' : 'No docs in this folder')}
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
                                    router.push('/docs');
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
                                const newFormat = isSheetDoc ? 'sheet' : isSlideDoc ? 'slide' : 'latex';
                                const defaultTitle = isSheetDoc
                                  ? (language === 'id' ? 'Spreadsheet Baru' : 'New Spreadsheet')
                                  : isSlideDoc
                                  ? (language === 'id' ? 'Slide Baru' : 'New Slide')
                                  : (language === 'id' ? 'Dokumen Baru' : 'New Document');
                                const newId = createDocument(defaultTitle, undefined, newFormat, folder.id);
                                setActiveDocId(newId);
                                router.push('/docs');
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
                                color: folderActiveColor,
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                marginTop: '2px',
                              }}
                            >
                              <Plus size={10} />
                              <span>
                                {isSheetDoc
                                  ? (language === 'id' ? 'Buat spreadsheet di folder ini' : 'Add spreadsheet to folder')
                                  : isSlideDoc
                                  ? (language === 'id' ? 'Buat slide di folder ini' : 'Add slide to folder')
                                  : (language === 'id' ? 'Buat dokumen di folder ini' : 'Add document to folder')}
                              </span>
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
                      <span>
                        {isSheetDoc
                          ? (language === 'id' ? 'Tambah folder spreadsheet' : 'Add spreadsheet folder')
                          : isSlideDoc
                          ? (language === 'id' ? 'Tambah folder slide' : 'Add slide folder')
                          : (language === 'id' ? 'Tambah folder dokumen' : 'Add doc folder')}
                      </span>
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
                          {isSheetDoc
                            ? (language === 'id' ? 'Spreadsheet Lainnya' : 'Other Spreadsheets')
                            : isSlideDoc
                            ? (language === 'id' ? 'Slide Lainnya' : 'Other Slides')
                            : (language === 'id' ? 'Dokumen Lainnya' : 'Other Documents')} ({unassignedDocs.length})
                        </span>
                        {isUnassignedExpanded ? <ChevronDown size={10} color="var(--text-muted)" /> : <ChevronRight size={10} color="var(--text-muted)" />}
                      </div>

                      {isUnassignedExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '2px' }}>
                          {groupItemsByDate(unassignedDocs).map((group) => (
                            <div key={group.labelEn} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <div
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  color: 'var(--text-muted)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  padding: '4px 6px 2px 4px',
                                }}
                              >
                                {language === 'id' ? group.labelId : group.labelEn}
                              </div>
                              {group.items.map((doc) => (
                                <DocSidebarItem
                                  key={doc.id}
                                  doc={doc}
                                  isActive={activeDocId === doc.id}
                                  language={language}
                                  folders={docFolders}
                                  onSelect={() => {
                                    setActiveProjectId(null);
                                    setActiveDocId(doc.id);
                                    router.push('/docs');
                                    if (onCloseMobile) onCloseMobile();
                                  }}
                                  onRename={(id, title) => updateDocumentTitle(id, title)}
                                  onDelete={(id) => deleteDocument(id)}
                                  onTogglePin={(id) => togglePin(id)}
                                  onMove={(id, targetProjId) => moveDocumentToProject(id, targetProjId)}
                                />
                              ))}
                            </div>
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
                          background: activeImageCollectionId === col.id ? mediaBadgeBg : 'transparent',
                          color: activeImageCollectionId === col.id ? mediaAccentColor : 'var(--text-secondary)',
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
                          <Folder size={12} color={activeImageCollectionId === col.id ? mediaAccentColor : 'var(--text-muted)'} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{col.name}</span>
                          {col.files.length > 0 && (
                            <span style={{ fontSize: '10px', background: mediaAccentColor, color: '#fff', borderRadius: '999px', padding: '0 5px', lineHeight: '16px', flexShrink: 0 }}>
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
                          placeholder={
                            isVideo
                              ? (language === 'id' ? 'Nama koleksi video...' : 'Video collection name...')
                              : isAudio
                              ? (language === 'id' ? 'Nama koleksi audio...' : 'Audio collection name...')
                              : (language === 'id' ? 'Nama koleksi gambar...' : 'Image collection name...')
                          }
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
                        <span>
                          {isVideo
                            ? (language === 'id' ? 'Tambah koleksi video' : 'Add video collection')
                            : isAudio
                            ? (language === 'id' ? 'Tambah koleksi audio' : 'Add audio collection')
                            : (language === 'id' ? 'Tambah koleksi gambar' : 'Add image collection')}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Media History (Filtered per mode: Video on /video, Audio on /audio, Image on /image) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
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
                      {isVideo
                        ? (language === 'id' ? 'Riwayat Video' : 'Video History')
                        : isAudio
                        ? (language === 'id' ? 'Riwayat Audio' : 'Audio History')
                        : (language === 'id' ? 'Riwayat Gambar' : 'Image History')}
                    </span>
                    {isHistoryExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isHistoryExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {currentMediaHistory.length === 0 ? (
                      <div style={{ padding: '8px 10px', fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {isVideo
                          ? (language === 'id' ? 'Belum ada video dibuat' : 'No videos generated yet')
                          : isAudio
                          ? (language === 'id' ? 'Belum ada audio dibuat' : 'No audios generated yet')
                          : (language === 'id' ? 'Belum ada gambar dibuat' : 'No images generated yet')}
                      </div>
                    ) : (
                      (() => {
                        const filteredMedia = currentMediaHistory.filter((item) => {
                          const matchSearch = item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || item.style.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchCol = activeImageCollectionId ? item.collectionId === activeImageCollectionId : true;
                          return matchSearch && matchCol;
                        });

                        return groupItemsByDate(filteredMedia).map((group) => (
                          <div key={group.labelEn} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                padding: '4px 6px 2px 4px',
                              }}
                            >
                              {language === 'id' ? group.labelId : group.labelEn}
                            </div>
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                className="clickable-pill"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '5px 8px',
                                  borderRadius: 'var(--radius-sm, 6px)',
                                  background: item.isPinned ? mediaPinnedBg : 'transparent',
                                  color: 'var(--text-secondary)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  position: 'relative',
                                }}
                              >
                                {/* Type icon & Title */}
                                <div
                                  onClick={() => {
                                    const fullItem = imagineItems.find((i) => i.id === item.id);
                                    if (fullItem) {
                                      setSelectedMediaItem(fullItem);
                                    }
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: '7px' }}
                                >
                                  {item.type === 'video' ? (
                                    <Film size={13} color="#fb7185" style={{ flexShrink: 0 }} />
                                  ) : item.type === 'audio' ? (
                                    <Music size={13} color="#60a5fa" style={{ flexShrink: 0 }} />
                                  ) : (
                                    <ImageIcon size={13} color="var(--rail-media-color)" style={{ flexShrink: 0 }} />
                                  )}
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      {item.isPinned && <Pin size={9} color={mediaAccentColor} style={{ flexShrink: 0 }} />}
                                      <span>{item.prompt}</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <span>{item.style}</span>
                                      <span>•</span>
                                      <span>{item.time}</span>
                                      {item.collectionId && (
                                        <span style={{ background: mediaBadgeBg, color: mediaAccentColor, padding: '0 4px', borderRadius: '3px', fontSize: '9.5px', fontWeight: 600 }}>
                                          {imageCollections.find((c) => c.id === item.collectionId)?.name || '📁'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Three-dot menu for Media item */}
                                <ImagineItemMenu
                                  item={item}
                                  language={language}
                                  collections={imageCollections.filter((c) => !['ic_cyberpunk', 'ic_wallpapers', 'ic_mockups'].includes(c.id))}
                                  togglePin={toggleImaginePin}
                                  moveToCollection={moveImagineToCollection}
                                  removeItem={removeImagineItem}
                                />
                              </div>
                            ))}
                          </div>
                        ));
                      })()
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
                    padding: '0px 6px 4px 6px',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
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
         * 3. Bottom Profile Bar (Reusable ProfileBar Component)
         * ───────────────────────────────────────────────────────────── */}
        <ProfileBar />
        </div>{/* end Main Content Panel */}
      </div>}

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

      <MediaDetailModal
        item={selectedMediaItem}
        onClose={() => setSelectedMediaItem(null)}
        onDelete={(id) => { removeImagineItem(id); setSelectedMediaItem(null); }}
        language={language as 'en' | 'id'}
      />
    </aside>
  );
}
