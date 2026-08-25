'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { useChatStore } from '../../features/chat/store/useChatStore';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { ConnectorsModal } from '../../features/connectors/components/ConnectorsModal';
import { StorageMeter } from '../../features/storage/components/StorageMeter';
import { getTranslation, ChatSession } from '@anticeil/core';
import { useWorkspaceStore } from '../../features/storage/store/useWorkspaceStore';
import { useProjectStore } from '../../features/chat/store/useProjectStore';
import { FolderFileDrawer } from '../../features/storage/components/FolderFileDrawer';

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
}

interface AutomationWorkflowItem {
  id: string;
  name: string;
  status: 'active' | 'paused';
  runsCount: number;
  categoryId?: string;
}

interface PdfHistoryItem {
  id: string;
  name: string;
  action: string;
  time: string;
  categoryId?: string;
}

// ─── FolderMenu ───────────────────────────────────────────────────────────────
// Small self-contained component for the folder three-dot menu (rename / delete)
interface FolderMenuProps {
  proj: { id: string; name: string };
  language: string;
  t: { sidebar: { rename: string }; common: { delete: string } };
  accessToken: string | null;
  renameFolder: (id: string, name: string, token: string) => Promise<void>;
  deleteFolder: (id: string, token: string) => Promise<void>;
  onDeleted: () => void;
}

function FolderMenu({ proj, language, t, accessToken, renameFolder, deleteFolder, onDeleted }: FolderMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameText, setRenameText] = React.useState(proj.name);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setIsRenaming(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleRename = async () => {
    const name = renameText.trim();
    if (!name || !accessToken) return;
    await renameFolder(proj.id, name, accessToken);
    setIsRenaming(false);
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!accessToken) return;
    await deleteFolder(proj.id, accessToken);
    onDeleted();
    setOpen(false);
  };

  if (isRenaming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} ref={menuRef}>
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
    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="session-options-btn"
        style={{
          background: 'transparent', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center',
        }}
      >
        <MoreHorizontal size={12} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md, 8px)', boxShadow: 'var(--shadow-lg)',
          padding: '4px', zIndex: 999999999, display: 'flex', flexDirection: 'column',
          gap: '2px', minWidth: '120px',
        }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setRenameText(proj.name); setIsRenaming(true); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px',
              borderRadius: '4px', border: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer', textAlign: 'left',
            }}
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
          >
            <Trash2 size={11} />
            <span>{language === 'id' ? 'Hapus folder' : 'Delete folder'}</span>
          </button>
        </div>
      )}
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

  const isImagine = pathname === '/imagine';
  const isAutomations = pathname === '/automations';
  const isPdfTools = pathname === '/pdf-tools';

  // Imagine Mode UI States
  const [isAddingImagineCollection, setIsAddingImagineCollection] = useState(false);
  const [newImagineCollectionName, setNewImagineCollectionName] = useState('');
  const [imagineHistory] = useState<ImagineHistoryItem[]>([
    { id: 'img_1', prompt: 'Neon futuristic cyberpunk metropolis glowing in rain 8K', style: 'Cyberpunk', time: 'Just now', collectionId: 'ic_cyberpunk' },
    { id: 'img_2', prompt: 'Minimalist 3D glassmorphic geometric crystal orb', style: '3D Render', time: '2h ago', collectionId: 'ic_mockups' },
    { id: 'img_3', prompt: 'Anime style floating garden sunset cinematic', style: 'Anime', time: 'Yesterday', collectionId: 'ic_wallpapers' },
    { id: 'img_4', prompt: 'Vintage oil painting foggy mountain cabin landscape', style: 'Oil Painting', time: '2 days ago', collectionId: 'ic_wallpapers' },
  ]);

  // Automations Mode UI States
  const [isAddingAutomationCategory, setIsAddingAutomationCategory] = useState(false);
  const [newAutomationCategoryName, setNewAutomationCategoryName] = useState('');
  const [automationWorkflows] = useState<AutomationWorkflowItem[]>([
    { id: 'wf_1', name: 'Briefing Kalender Harian Otomatis → Telegram/Email', status: 'active', runsCount: 42, categoryId: 'wc_productivity' },
    { id: 'wf_2', name: 'Klasifikasi Email VIP Gmail & Draf Otomatis', status: 'active', runsCount: 18, categoryId: 'wc_productivity' },
    { id: 'wf_3', name: 'Sinkronisasi Lead Kontak Baru ke Google Sheets', status: 'paused', runsCount: 9, categoryId: 'wc_crm' },
    { id: 'wf_4', name: 'Ringkasan Rapat & Notula Otomatis dari Kalender', status: 'active', runsCount: 27, categoryId: 'wc_productivity' },
  ]);

  // PDF Studio Mode UI States
  const [isAddingPdfCategory, setIsAddingPdfCategory] = useState(false);
  const [newPdfCategoryName, setNewPdfCategoryName] = useState('');
  const [pdfHistory] = useState<PdfHistoryItem[]>([
    { id: 'pdf_1', name: 'Laporan_Keuangan_Q3_Merged.pdf', action: 'Gabung PDF', time: '10m lalu', categoryId: 'dc_contracts' },
    { id: 'pdf_2', name: 'Kontrak_Kerja_Watermarked.pdf', action: 'Cap Air', time: '1 jam lalu', categoryId: 'dc_contracts' },
    { id: 'pdf_3', name: 'Paper_Arsitektur_AI_OCR.pdf', action: 'AI OCR', time: 'Kemarin', categoryId: 'dc_research' },
  ]);

  // ── Project store (DB-backed via Supabase) ──────────────────────────────────
  const projects = useProjectStore((s) => s.folders);
  const projectsLoading = useProjectStore((s) => s.isLoading);
  const createProject = useProjectStore((s) => s.createFolder);
  const renameProject = useProjectStore((s) => s.renameFolder);
  const deleteProject = useProjectStore((s) => s.deleteFolder);
  const assignSessionToProject = useProjectStore((s) => s.assignSession);
  const removeSessionFromProject = useProjectStore((s) => s.removeSession);

  // ── Workspace store (image/workflow/document collections — still localStorage) ──
  const imageCollections = useWorkspaceStore((s) => s.imageCollections);
  const activeImageCollectionId = useWorkspaceStore((s) => s.activeImageCollectionId);
  const setActiveImageCollection = useWorkspaceStore((s) => s.setActiveImageCollection);
  const createImageCollection = useWorkspaceStore((s) => s.createImageCollection);
  const addFileToImageCollection = useWorkspaceStore((s) => s.addFileToImageCollection);
  const removeFileFromImageCollection = useWorkspaceStore((s) => s.removeFileFromImageCollection);

  const workflowCategories = useWorkspaceStore((s) => s.workflowCategories);
  const activeWorkflowCategoryId = useWorkspaceStore((s) => s.activeWorkflowCategoryId);
  const setActiveWorkflowCategory = useWorkspaceStore((s) => s.setActiveWorkflowCategory);
  const createWorkflowCategory = useWorkspaceStore((s) => s.createWorkflowCategory);
  const addFileToWorkflowCategory = useWorkspaceStore((s) => s.addFileToWorkflowCategory);
  const removeFileFromWorkflowCategory = useWorkspaceStore((s) => s.removeFileFromWorkflowCategory);

  const documentCategories = useWorkspaceStore((s) => s.documentCategories);
  const activeDocumentCategoryId = useWorkspaceStore((s) => s.activeDocumentCategoryId);
  const setActiveDocumentCategory = useWorkspaceStore((s) => s.setActiveDocumentCategory);
  const createDocumentCategory = useWorkspaceStore((s) => s.createDocumentCategory);
  const addFileToDocumentCategory = useWorkspaceStore((s) => s.addFileToDocumentCategory);
  const removeFileFromDocumentCategory = useWorkspaceStore((s) => s.removeFileFromDocumentCategory);

  // Drawer state (file manager per folder)
  const [drawerState, setDrawerState] = useState<{
    type: 'project' | 'imageCollection' | 'workflowCategory' | 'documentCategory';
    id: string;
  } | null>(null);

  const getDrawerFolder = () => {
    if (!drawerState) return null;
    if (drawerState.type === 'imageCollection') return imageCollections.find((c) => c.id === drawerState.id) ?? null;
    if (drawerState.type === 'workflowCategory') return workflowCategories.find((c) => c.id === drawerState.id) ?? null;
    if (drawerState.type === 'documentCategory') return documentCategories.find((c) => c.id === drawerState.id) ?? null;
    return null;
  };

  const drawerFolder = getDrawerFolder();

  const handleDrawerFileAdded = (file: any) => {
    if (!drawerState) return;
    if (drawerState.type === 'imageCollection') addFileToImageCollection(drawerState.id, file);
    if (drawerState.type === 'workflowCategory') addFileToWorkflowCategory(drawerState.id, file);
    if (drawerState.type === 'documentCategory') addFileToDocumentCategory(drawerState.id, file);
  };

  const handleDrawerFileRemoved = (fileId: string) => {
    if (!drawerState) return;
    if (drawerState.type === 'imageCollection') removeFileFromImageCollection(drawerState.id, fileId);
    if (drawerState.type === 'workflowCategory') removeFileFromWorkflowCategory(drawerState.id, fileId);
    if (drawerState.type === 'documentCategory') removeFileFromDocumentCategory(drawerState.id, fileId);
  };

  const drawerAcceptTypes =
    drawerState?.type === 'imageCollection'
      ? 'image/*'
      : drawerState?.type === 'documentCategory'
      ? '.pdf,.doc,.docx,.txt,.csv,.json,.md'
      : drawerState?.type === 'workflowCategory'
      ? '.json,.yaml,.yml,.js,.ts,.py,.txt'
      : '*/*';

  // Dropdown menu state for session options (...)
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  // "Move to folder" submenu
  const [folderSubmenuSessionId, setFolderSubmenuSessionId] = useState<string | null>(null);

  // Profile Popover State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
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
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const t = getTranslation(language);

  // Close dropdown & profile popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuSessionId(null);
        setFolderSubmenuSessionId(null);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    updateSession(session.id, { isPinned: !session.isPinned });
    setMenuSessionId(null);
  };

  const handleAddProject = async () => {
    const name = newProjectName.trim();
    if (!name || projects.some((p) => p.name === name)) return;
    const token = useAuthStore.getState().session?.access_token;
    if (!token) return;
    await createProject(name, token);
    setNewProjectName('');
    setIsAddingProject(false);
  };

  const handleMoveToProject = async (session: ChatSession, targetProjectId: string | null) => {
    const token = useAuthStore.getState().session?.access_token;
    if (!token) return;

    // Remove from old project
    if (session.projectId) {
      await removeSessionFromProject(session.projectId, session.id, token);
    }
    // Assign to new project
    if (targetProjectId) {
      await assignSessionToProject(targetProjectId, session.id, token);
    }
    // Update session's own projectId field
    moveSessionToProject(session.id, targetProjectId);
    setMenuSessionId(null);
    setFolderSubmenuSessionId(null);
  };

  // Filter sessions by search query.
  // Sessions assigned to a project only appear under that folder, not in the general list.
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const notInAnyFolder = !s.projectId;
    return matchesSearch && notInAnyFolder;
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const todaySessions = filteredSessions.filter((s) => s.updatedAt >= startOfToday);
  const yesterdaySessions = filteredSessions.filter(
    (s) => s.updatedAt >= startOfYesterday && s.updatedAt < startOfToday
  );
  const earlierSessions = filteredSessions.filter((s) => s.updatedAt < startOfYesterday);

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
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderSubmenuSessionId(
                    folderSubmenuSessionId === session.id ? null : session.id
                  );
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

              {folderSubmenuSessionId === session.id && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 'calc(100% + 4px)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md, 8px)',
                    boxShadow: 'var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.25))',
                    padding: '4px',
                    zIndex: 2147483647,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    minWidth: '140px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {projects.length === 0 && (
                    <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'Belum ada folder' : 'No folders yet'}
                    </div>
                  )}
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveToProject(session, proj.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: session.projectId === proj.id ? 'var(--bg-subtle)' : 'transparent',
                        color: session.projectId === proj.id ? 'var(--brand-primary)' : 'var(--text-primary)',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <Folder size={11} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {proj.name}
                      </span>
                      {session.projectId === proj.id && <Check size={10} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                    </button>
                  ))}
                  {/* Option to remove from current folder */}
                  {session.projectId && (
                    <>
                      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 4px' }} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
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
                      >
                        <FolderMinus size={11} />
                        <span>{t.sidebar.removeFromFolder}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 4px' }} />

            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                const token = useAuthStore.getState().session?.access_token;
                if (session.projectId && token) {
                  await removeSessionFromProject(session.projectId, session.id, token);
                }
                deleteSession(session.id);
                setMenuSessionId(null);
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
              href="/"
              title="Anticeil Home"
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

            {/* Imagine */}
            <Link
              href="/imagine"
              title={t.nav.imagine}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: pathname === '/imagine' ? 'rgba(162, 93, 220, 0.2)' : 'transparent',
                color: pathname === '/imagine' ? '#A25DDC' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <ImageIcon size={17} />
            </Link>

            {/* Automations */}
            <Link
              href="/automations"
              title={t.nav.automations}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: pathname === '/automations' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                color: pathname === '/automations' ? '#F59E0B' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <Workflow size={17} />
            </Link>

            {/* PDF Studio */}
            <Link
              href="/pdf-tools"
              title={t.nav.pdfTools}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: pathname === '/pdf-tools' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: pathname === '/pdf-tools' ? '#EF4444' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={17} />
            </Link>

            {/* Connectors */}
            <button
              type="button"
              onClick={() => setIsConnectorsModalOpen(true)}
              title={t.nav.connectors}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Plug size={17} />
            </button>
          </div>
        </div>

        {/* Bottom: Settings Shortcut */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title={t.nav.settings}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
       * 2. Main Workspace & Navigation Panel (Grok / Monday style)
       * ───────────────────────────────────────────────────────────── */}
      <div
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
              {isImagine
                ? 'Anticeil Imagine'
                : isAutomations
                  ? language === 'id'
                    ? 'Anticeil Otomatisasi'
                    : 'Anticeil Automations'
                  : isPdfTools
                    ? language === 'id'
                      ? 'Anticeil Studio Dokumen'
                      : 'Anticeil PDF Studio'
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
          {isImagine ? (
            <button
              type="button"
              onClick={() => {
                if (pathname !== '/imagine') router.push('/imagine');
                if (onCloseMobile) onCloseMobile();
              }}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md, 6px)',
                background: pathname === '/imagine' ? 'var(--bg-subtle)' : 'transparent',
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
              <span>{language === 'id' ? 'Imagine Baru' : 'New Imagine'}</span>
            </button>
          ) : isAutomations ? (
            <button
              type="button"
              onClick={() => {
                if (pathname !== '/automations') router.push('/automations');
                if (onCloseMobile) onCloseMobile();
              }}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md, 6px)',
                background: pathname === '/automations' ? 'var(--bg-subtle)' : 'transparent',
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
              <Workflow size={15} color="#F59E0B" />
              <span>{language === 'id' ? 'Alur Kerja Baru' : 'New Workflow'}</span>
            </button>
          ) : isPdfTools ? (
            <button
              type="button"
              onClick={() => {
                if (pathname !== '/pdf-tools') router.push('/pdf-tools');
                if (onCloseMobile) onCloseMobile();
              }}
              className="clickable-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md, 6px)',
                background: pathname === '/pdf-tools' ? 'var(--bg-subtle)' : 'transparent',
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
              <FileText size={15} color="#EF4444" />
              <span>{language === 'id' ? 'Olah PDF Baru' : 'New PDF Task'}</span>
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
                isImagine
                  ? language === 'id'
                    ? 'Cari prompt gambar...'
                    : 'Search image prompts...'
                  : isAutomations
                    ? language === 'id'
                      ? 'Cari alur kerja...'
                      : 'Search workflows...'
                    : isPdfTools
                      ? language === 'id'
                        ? 'Cari file PDF...'
                        : 'Search PDF files...'
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
           * A. IMAGINE MODE SIDEBAR CONTENT
           * ───────────────────────────────────────────────────────────── */}
          {isImagine ? (
            <>
              {/* Imagine Collections */}
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
                      {language === 'id' ? 'Koleksi Gambar' : 'Image Collections'}
                    </span>
                    {isProjectsExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isProjectsExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '2px' }}>
                    {imageCollections.map((col) => (
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
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}
                          onClick={() => setActiveImageCollection(activeImageCollectionId === col.id ? null : col.id)}
                        >
                          <Folder size={12} color={activeImageCollectionId === col.id ? '#A25DDC' : 'var(--text-muted)'} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</span>
                          {col.files.length > 0 && (
                            <span style={{ fontSize: '10px', background: '#A25DDC', color: '#fff', borderRadius: '999px', padding: '0 5px', lineHeight: '16px', flexShrink: 0 }}>
                              {col.files.length}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          title={language === 'id' ? 'Unggah gambar' : 'Upload images'}
                          onClick={(e) => { e.stopPropagation(); setDrawerState({ type: 'imageCollection', id: col.id }); }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        >
                          <Upload size={11} />
                        </button>
                      </div>
                    ))}

                    {isAddingImagineCollection ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px' }}>
                        <input
                          type="text"
                          placeholder={language === 'id' ? 'Nama koleksi...' : 'Collection name...'}
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
                        <span>{language === 'id' ? 'Tambah koleksi' : 'Add collection'}</span>
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
                    {imagineHistory
                      .filter((item) => {
                        const matchSearch = item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || item.style.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchCol = activeImageCollectionId ? item.collectionId === activeImageCollectionId : true;
                        return matchSearch && matchCol;
                      })
                      .map((item) => (
                        <div
                          key={item.id}
                          className="clickable-pill"
                          onClick={() => {
                            if (pathname !== '/imagine') router.push('/imagine');
                            if (onCloseMobile) onCloseMobile();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm, 6px)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <ImageIcon size={13} color="#A25DDC" style={{ flexShrink: 0 }} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', fontWeight: 500 }}>
                              {item.prompt}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '6px' }}>
                              <span>{item.style}</span>
                              <span>•</span>
                              <span>{item.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : isAutomations ? (
            /* ─────────────────────────────────────────────────────────────
             * B. AUTOMATIONS MODE SIDEBAR CONTENT
             * ───────────────────────────────────────────────────────────── */
            <>
              {/* Workflow Categories */}
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
                      {language === 'id' ? 'Kategori Alur' : 'Workflow Categories'}
                    </span>
                    {isProjectsExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isProjectsExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '2px' }}>
                    {workflowCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="clickable-pill"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm, 6px)',
                          background: activeWorkflowCategoryId === cat.id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                          color: activeWorkflowCategoryId === cat.id ? '#F59E0B' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: activeWorkflowCategoryId === cat.id ? 600 : 400,
                          cursor: 'pointer',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}
                          onClick={() => setActiveWorkflowCategory(activeWorkflowCategoryId === cat.id ? null : cat.id)}
                        >
                          <Folder size={12} color={activeWorkflowCategoryId === cat.id ? '#F59E0B' : 'var(--text-muted)'} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
                          {cat.files.length > 0 && (
                            <span style={{ fontSize: '10px', background: '#F59E0B', color: '#fff', borderRadius: '999px', padding: '0 5px', lineHeight: '16px', flexShrink: 0 }}>
                              {cat.files.length}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          title={language === 'id' ? 'Unggah berkas' : 'Upload files'}
                          onClick={(e) => { e.stopPropagation(); setDrawerState({ type: 'workflowCategory', id: cat.id }); }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        >
                          <Upload size={11} />
                        </button>
                      </div>
                    ))}

                    {isAddingAutomationCategory ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px' }}>
                        <input
                          type="text"
                          placeholder={language === 'id' ? 'Nama kategori...' : 'Category name...'}
                          value={newAutomationCategoryName}
                          onChange={(e) => setNewAutomationCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const name = newAutomationCategoryName.trim();
                              if (name && !workflowCategories.some((c) => c.name === name)) {
                                createWorkflowCategory(name);
                                setNewAutomationCategoryName('');
                                setIsAddingAutomationCategory(false);
                              }
                            }
                            if (e.key === 'Escape') setIsAddingAutomationCategory(false);
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
                            const name = newAutomationCategoryName.trim();
                            if (name && !workflowCategories.some((c) => c.name === name)) {
                              createWorkflowCategory(name);
                              setNewAutomationCategoryName('');
                              setIsAddingAutomationCategory(false);
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingAutomationCategory(false)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingAutomationCategory(true)}
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
                        <span>{language === 'id' ? 'Tambah kategori' : 'Add category'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Workflow List */}
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
                      {language === 'id' ? 'Daftar Alur Kerja' : 'Active Workflows'}
                    </span>
                    {isHistoryExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isHistoryExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {automationWorkflows
                      .filter((item) => {
                        const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchCat = activeWorkflowCategoryId ? item.categoryId === activeWorkflowCategoryId : true;
                        return matchSearch && matchCat;
                      })
                      .map((item) => (
                        <div
                          key={item.id}
                          className="clickable-pill"
                          onClick={() => {
                            if (pathname !== '/automations') router.push('/automations');
                            if (onCloseMobile) onCloseMobile();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm, 6px)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: item.status === 'active' ? '#10B981' : '#F59E0B',
                              boxShadow: item.status === 'active' ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', fontWeight: 500 }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {item.runsCount} {language === 'id' ? 'eksekusi' : 'runs'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : isPdfTools ? (
            /* ─────────────────────────────────────────────────────────────
             * C. PDF TOOLS MODE SIDEBAR CONTENT
             * ───────────────────────────────────────────────────────────── */
            <>
              {/* PDF Categories */}
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
                      {language === 'id' ? 'Kategori Dokumen' : 'Doc Categories'}
                    </span>
                    {isProjectsExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isProjectsExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '2px' }}>
                    {documentCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="clickable-pill"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm, 6px)',
                          background: activeDocumentCategoryId === cat.id ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                          color: activeDocumentCategoryId === cat.id ? '#EF4444' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: activeDocumentCategoryId === cat.id ? 600 : 400,
                          cursor: 'pointer',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}
                          onClick={() => setActiveDocumentCategory(activeDocumentCategoryId === cat.id ? null : cat.id)}
                        >
                          <Folder size={12} color={activeDocumentCategoryId === cat.id ? '#EF4444' : 'var(--text-muted)'} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
                          {cat.files.length > 0 && (
                            <span style={{ fontSize: '10px', background: '#EF4444', color: '#fff', borderRadius: '999px', padding: '0 5px', lineHeight: '16px', flexShrink: 0 }}>
                              {cat.files.length}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          title={language === 'id' ? 'Unggah dokumen' : 'Upload docs'}
                          onClick={(e) => { e.stopPropagation(); setDrawerState({ type: 'documentCategory', id: cat.id }); }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        >
                          <Upload size={11} />
                        </button>
                      </div>
                    ))}

                    {isAddingPdfCategory ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px' }}>
                        <input
                          type="text"
                          placeholder={language === 'id' ? 'Nama kategori...' : 'Category name...'}
                          value={newPdfCategoryName}
                          onChange={(e) => setNewPdfCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const name = newPdfCategoryName.trim();
                              if (name && !documentCategories.some((c) => c.name === name)) {
                                createDocumentCategory(name);
                                setNewPdfCategoryName('');
                                setIsAddingPdfCategory(false);
                              }
                            }
                            if (e.key === 'Escape') setIsAddingPdfCategory(false);
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
                            const name = newPdfCategoryName.trim();
                            if (name && !documentCategories.some((c) => c.name === name)) {
                              createDocumentCategory(name);
                              setNewPdfCategoryName('');
                              setIsAddingPdfCategory(false);
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingPdfCategory(false)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingPdfCategory(true)}
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
                        <span>{language === 'id' ? 'Tambah kategori' : 'Add category'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* PDF Recent Processed History */}
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
                      {language === 'id' ? 'Dokumen Diproses' : 'Processed Files'}
                    </span>
                    {isHistoryExpanded ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />}
                  </div>
                </div>

                {isHistoryExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {pdfHistory
                      .filter((item) => {
                        const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchCat = activeDocumentCategoryId ? item.categoryId === activeDocumentCategoryId : true;
                        return matchSearch && matchCat;
                      })
                      .map((item) => (
                        <div
                          key={item.id}
                          className="clickable-pill"
                          onClick={() => {
                            if (pathname !== '/pdf-tools') router.push('/pdf-tools');
                            if (onCloseMobile) onCloseMobile();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm, 6px)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <FileText size={13} color="#EF4444" style={{ flexShrink: 0 }} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', fontWeight: 500 }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '6px' }}>
                              <span>{item.action}</span>
                              <span>•</span>
                              <span>{item.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                      const folderSessions = sessions.filter(
                        (s) => s.projectId === proj.id &&
                          s.title.toLowerCase().includes(searchQuery.toLowerCase())
                      );

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
          {/* Floating Profile Popover Menu (Above the button) */}
          {isProfileMenuOpen && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '8px',
                right: '8px',
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
              {/* User Email Header */}
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

              {/* Logout / Login Action */}

              {/* 2. Logout */}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setIsProfileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--accent-danger)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} />
                  <span>{language === 'id' ? 'Keluar' : 'Log Out'}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsProfileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md, 6px)',
                    textDecoration: 'none',
                    color: 'var(--accent-danger)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} />
                  <span>{language === 'id' ? 'Keluar' : 'Log Out'}</span>
                </Link>
              )}
            </div>
          )}

          {/* Storage Quota Progress Bar (Sleek Compact View) */}
          <div style={{ marginBottom: '8px' }}>
            <StorageMeter compact onManageClick={() => setSettingsOpen(true)} />
          </div>

          {/* Profile Trigger Button (Avatar + Name) */}
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
              <div
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
              </div>
            </div>

            <MoreHorizontal size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          </button>
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
