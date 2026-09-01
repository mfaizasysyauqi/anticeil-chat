'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Trash2,
  Pin,
  Sparkles,
  Download,
  Eye,
  Code2,
  Columns,
  Search,
  Bold,
  Italic,
  Heading,
  Sigma,
  Table as TableIcon,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Printer,
  ChevronDown,
  ArrowLeft,
  Layers,
  Presentation,
  Check,
  X,
  Star,
  FilePlus,
  Edit2,
  Info,
  Folder,
  FolderOpen,
  ChevronRight,
  FolderPlus,
  ListTree,
  Replace,
  CornerDownLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Play,
  RefreshCw,
  ChevronUp,
  Upload,
  Image as ImageIcon,
  FileCode,
  File as FileIcon,
  Tag,
  Bookmark,
  BookMarked,
  Quote,
  UserPlus,
  Users,
  Copy,
  ExternalLink,
  Lock,
  Globe,
  Share2,
  User,
  Minus,
  Contrast,
  History,
  Pencil,
  Maximize2,
  Minimize2,
  Keyboard,
  MessageSquarePlus,
  MessageSquare,
  CheckSquare,
  MessageCircle,
} from 'lucide-react';
import { useDocsStore, DocsViewMode, DocFormat, DocCollaborator, DocComment, DocCommentReply } from '../store/useDocsStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { getBundledDocContent } from '../utils/docResolver';
import { lintDocumentContent, DocDiagnostic } from '../utils/docLinter';
import { DocsCopilotSidebar } from './DocsCopilotSidebar';
import { DocsTemplateModal } from './DocsTemplateModal';
import { DocsLandingView } from './DocsLandingView';
import { DocsGeneratingView } from './DocsGeneratingView';
import { DocsSpreadsheetView } from './DocsSpreadsheetView';
import { DocsSlideView } from './DocsSlideView';
import { streamBYOKChat } from '../../chat/data/byokApi';
import { ChatMessage, LLMProviderId } from '@anticeil/core';

export interface DocsViewProps {
  initialDocId?: string;
}

export function DocsView({ initialDocId }: DocsViewProps = {}) {
  const router = useRouter();
  const documents = useDocsStore((s) => s.documents);
  const activeDocId = useDocsStore((s) => s.activeDocId);
  const studioPhase = useDocsStore((s) => s.studioPhase);
  const viewMode = useDocsStore((s) => s.viewMode);
  const isCopilotOpen = useDocsStore((s) => s.isCopilotOpen);
  const isSidebarOpen = useDocsStore((s) => s.isSidebarOpen);

  const setStudioPhase = useDocsStore((s) => s.setStudioPhase);
  const setActiveDocId = useDocsStore((s) => s.setActiveDocId);
  const createDocument = useDocsStore((s) => s.createDocument);
  const createFromTemplate = useDocsStore((s) => s.createFromTemplate);
  const updateDocumentContent = useDocsStore((s) => s.updateDocumentContent);
  const updateDocumentTitle = useDocsStore((s) => s.updateDocumentTitle);
  const deleteDocument = useDocsStore((s) => s.deleteDocument);
  const togglePin = useDocsStore((s) => s.togglePin);
  const setViewMode = useDocsStore((s) => s.setViewMode);
  const toggleCopilot = useDocsStore((s) => s.toggleCopilot);
  const toggleSidebar = useDocsStore((s) => s.toggleSidebar);

  // Overleaf-style Sub-file Store Actions
  const createSubFile = useDocsStore((s) => s.createSubFile);
  const updateSubFileContent = useDocsStore((s) => s.updateSubFileContent);
  const updateSubFileName = useDocsStore((s) => s.updateSubFileName);
  const deleteSubFile = useDocsStore((s) => s.deleteSubFile);
  const setMainSubFile = useDocsStore((s) => s.setMainSubFile);
  const setActiveFileId = useDocsStore((s) => s.setActiveFileId);

  // Overleaf-style Sharing Actions
  const updateDocSharing = useDocsStore((s) => s.updateDocSharing);
  const addDocCollaborator = useDocsStore((s) => s.addDocCollaborator);
  const removeDocCollaborator = useDocsStore((s) => s.removeDocCollaborator);
  const updateDocCollaboratorRole = useDocsStore((s) => s.updateDocCollaboratorRole);

  // Overleaf-style Comment Store Actions
  const addComment = useDocsStore((s) => s.addComment);
  const updateComment = useDocsStore((s) => s.updateComment);
  const deleteComment = useDocsStore((s) => s.deleteComment);
  const resolveComment = useDocsStore((s) => s.resolveComment);
  const addCommentReply = useDocsStore((s) => s.addCommentReply);
  const deleteCommentReply = useDocsStore((s) => s.deleteCommentReply);
  const user = useAuthStore((s) => s.user);

  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);

  // Mini Sidebar & Active Drawer Tab ('files' | 'search' | 'review' | 'ai')
  const [activeDrawerTab, setActiveDrawerTab] = useState<'files' | 'search' | 'review' | 'ai'>('files');

  // Overleaf-style Review & Comments State
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [draftCommentText, setDraftCommentText] = useState('');
  const [draftSelectedText, setDraftSelectedText] = useState('');
  const [draftFromLine, setDraftFromLine] = useState(1);
  const [draftToLine, setDraftToLine] = useState(1);
  const [activeHighlightedCommentId, setActiveHighlightedCommentId] = useState<string | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyDraftText, setReplyDraftText] = useState('');
  const [commentFilter, setCommentFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  // Outline panel height inside Files tab (px) — draggable like Overleaf
  const [outlinePanelHeight, setOutlinePanelHeight] = useState(180);
  const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(false);

  // Overleaf Compilation Log Bar & Drawer State
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<'all' | 'errors' | 'warnings' | 'info'>('all');
  const [isRecompiling, setIsRecompiling] = useState(false);
  const [previewScale, setPreviewScale] = useState(100);

  // Overleaf Preview Bar: Page Navigation & Zoom
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isAutoCompile, setIsAutoCompile] = useState(false);
  const [isRecompileDropdownOpen, setIsRecompileDropdownOpen] = useState(false);
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  const recompileDropdownRef = useRef<HTMLDivElement>(null);
  const zoomDropdownRef = useRef<HTMLDivElement>(null);
  const recompileButtonRef = useRef<HTMLButtonElement>(null);
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const [isPreviewInverted, setIsPreviewInverted] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('1');

  useEffect(() => {
    if (typeof document !== 'undefined' && theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'DOCS_PREVIEW_SCALE') {
        if (typeof e.data.scale === 'number') setPreviewScale(e.data.scale);
        if (typeof e.data.totalPages === 'number') setTotalPages(e.data.totalPages);
      }
      if (e.data?.type === 'DOCS_PAGE_SCROLLED' && typeof e.data.currentPage === 'number') {
        setCurrentPage(e.data.currentPage);
        setPageInputValue(String(e.data.currentPage));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Search in Document state
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docReplaceQuery, setDocReplaceQuery] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [exportMenuPos, setExportMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Paragraph Style Popover State (Overleaf TT)
  const [isParagraphStyleMenuOpen, setIsParagraphStyleMenuOpen] = useState(false);
  const [paragraphMenuPos, setParagraphMenuPos] = useState<{ top: number; left: number } | null>(null);
  const paragraphStyleButtonRef = useRef<HTMLButtonElement>(null);
  const paragraphStyleMenuRef = useRef<HTMLDivElement>(null);

  // List Popover State (Overleaf List Modal)
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [listMenuPos, setListMenuPos] = useState<{ top: number; left: number } | null>(null);
  const listButtonRef = useRef<HTMLButtonElement>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);

  // Overleaf Layout Options Popover State
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [layoutMenuPos, setLayoutMenuPos] = useState<{ top: number; left: number } | null>(null);
  const layoutButtonRef = useRef<HTMLButtonElement>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isHotkeysModalOpen, setIsHotkeysModalOpen] = useState(false);

  // Symbol Popover State (Overleaf Omega)
  const [isSymbolMenuOpen, setIsSymbolMenuOpen] = useState(false);
  const [symbolMenuPos, setSymbolMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [symbolSearchQuery, setSymbolSearchQuery] = useState('');
  const symbolButtonRef = useRef<HTMLButtonElement>(null);
  const symbolMenuRef = useRef<HTMLDivElement>(null);

  const handleTriggerAddComment = () => {
    const el = textareaRef.current;
    if (!el || !activeDoc) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end).trim();

    // Calculate line numbers
    const linesBeforeStart = text.substring(0, start).split('\n').length;
    const linesBeforeEnd = text.substring(0, end).split('\n').length;

    setDraftSelectedText(selected || (text.split('\n')[linesBeforeStart - 1]?.trim() || ''));
    setDraftFromLine(linesBeforeStart);
    setDraftToLine(Math.max(linesBeforeStart, linesBeforeEnd));
    setDraftCommentText('');
    setIsAddingComment(true);

    if (!isSidebarOpen) toggleSidebar();
    setActiveDrawerTab('review');
  };

  // Global Keyboard Shortcuts (Focus Mode, Hotkeys Modal, Review Panel, Add Comment, Recompile)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Focus mode: Ctrl+Shift+M / Cmd+Shift+M
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      }
      // Review Panel: Ctrl+J / Cmd+J
      if ((e.ctrlKey || e.metaKey) && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        if (!isSidebarOpen) {
          toggleSidebar();
          setActiveDrawerTab('review');
        } else if (activeDrawerTab === 'review') {
          toggleSidebar();
        } else {
          setActiveDrawerTab('review');
        }
      }
      // Add Comment: Ctrl+Shift+C / Cmd+Shift+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        handleTriggerAddComment();
      }
      // Hotkeys Modal: F1 or Ctrl+Shift+? or Ctrl+?
      if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && (e.key === '?' || (e.shiftKey && (e.key === '?' || e.key === '/'))))) {
        e.preventDefault();
        setIsHotkeysModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSidebarOpen, activeDrawerTab]);

  const toggleParagraphStyleMenu = () => {
    if (!isParagraphStyleMenuOpen && paragraphStyleButtonRef.current) {
      const rect = paragraphStyleButtonRef.current.getBoundingClientRect();
      setParagraphMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
      setIsParagraphStyleMenuOpen(true);
    } else {
      setIsParagraphStyleMenuOpen(false);
    }
  };

  const toggleListMenu = () => {
    if (!isListMenuOpen && listButtonRef.current) {
      const rect = listButtonRef.current.getBoundingClientRect();
      setListMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
      setIsListMenuOpen(true);
    } else {
      setIsListMenuOpen(false);
    }
  };

  const toggleSymbolMenu = () => {
    if (!isSymbolMenuOpen && symbolButtonRef.current) {
      const rect = symbolButtonRef.current.getBoundingClientRect();
      setSymbolMenuPos({
        top: rect.bottom + 4,
        left: Math.max(10, rect.left - 40),
      });
      setSymbolSearchQuery('');
      setIsSymbolMenuOpen(true);
    } else {
      setIsSymbolMenuOpen(false);
    }
  };

  // Recompile & Zoom Popover Positions
  const [recompileDropdownPos, setRecompileDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [zoomDropdownPos, setZoomDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const toggleRecompileDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRecompileDropdownOpen) {
      setIsRecompileDropdownOpen(false);
    } else if (recompileButtonRef.current) {
      const rect = recompileButtonRef.current.getBoundingClientRect();
      setRecompileDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
      setIsRecompileDropdownOpen(true);
    }
  };

  const toggleZoomDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isZoomDropdownOpen) {
      setIsZoomDropdownOpen(false);
    } else if (zoomButtonRef.current) {
      const rect = zoomButtonRef.current.getBoundingClientRect();
      setZoomDropdownPos({
        top: rect.bottom + 4,
        left: Math.max(10, rect.right - 125),
      });
      setIsZoomDropdownOpen(true);
    }
  };

  const toggleLayoutMenu = () => {
    if (!isLayoutMenuOpen && layoutButtonRef.current) {
      const rect = layoutButtonRef.current.getBoundingClientRect();
      setLayoutMenuPos({
        top: rect.bottom + 6,
        left: Math.max(10, rect.right - 220),
      });
      setIsLayoutMenuOpen(true);
    } else {
      setIsLayoutMenuOpen(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        exportButtonRef.current && !exportButtonRef.current.contains(target) &&
        exportMenuRef.current && !exportMenuRef.current.contains(target)
      ) {
        setIsExportMenuOpen(false);
      }
      if (
        paragraphStyleButtonRef.current && !paragraphStyleButtonRef.current.contains(target) &&
        paragraphStyleMenuRef.current && !paragraphStyleMenuRef.current.contains(target)
      ) {
        setIsParagraphStyleMenuOpen(false);
      }
      if (
        listButtonRef.current && !listButtonRef.current.contains(target) &&
        listMenuRef.current && !listMenuRef.current.contains(target)
      ) {
        setIsListMenuOpen(false);
      }
      if (
        symbolButtonRef.current && !symbolButtonRef.current.contains(target) &&
        symbolMenuRef.current && !symbolMenuRef.current.contains(target)
      ) {
        setIsSymbolMenuOpen(false);
      }
      if (
        layoutButtonRef.current && !layoutButtonRef.current.contains(target) &&
        layoutMenuRef.current && !layoutMenuRef.current.contains(target)
      ) {
        setIsLayoutMenuOpen(false);
      }
      if (
        recompileButtonRef.current && !recompileButtonRef.current.contains(target) &&
        recompileDropdownRef.current && !recompileDropdownRef.current.contains(target)
      ) {
        setIsRecompileDropdownOpen(false);
      }
      if (
        zoomButtonRef.current && !zoomButtonRef.current.contains(target) &&
        zoomDropdownRef.current && !zoomDropdownRef.current.contains(target)
      ) {
        setIsZoomDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Overleaf Preview Controls Handlers
  const handleGoToPage = (pageNum: number) => {
    const clamped = Math.max(1, Math.min(totalPages, pageNum));
    setCurrentPage(clamped);
    setPageInputValue(String(clamped));
    previewIframeRef.current?.contentWindow?.postMessage(
      { type: 'DOCS_GO_TO_PAGE', page: clamped },
      '*'
    );
  };

  const handleZoom = (delta: number) => {
    const next = Math.max(30, Math.min(300, zoomLevel + delta));
    setZoomLevel(next);
    previewIframeRef.current?.contentWindow?.postMessage(
      { type: 'DOCS_SET_ZOOM', zoom: next },
      '*'
    );
  };

  const handleSetExactZoom = (val: number | 'auto') => {
    if (val === 'auto') {
      setZoomLevel(100);
      previewIframeRef.current?.contentWindow?.postMessage(
        { type: 'DOCS_SET_ZOOM', zoom: 'auto' },
        '*'
      );
    } else {
      setZoomLevel(val);
      previewIframeRef.current?.contentWindow?.postMessage(
        { type: 'DOCS_SET_ZOOM', zoom: val },
        '*'
      );
    }
    setIsZoomDropdownOpen(false);
  };

  const handleTogglePreviewInvert = () => {
    const next = !isPreviewInverted;
    setIsPreviewInverted(next);
    previewIframeRef.current?.contentWindow?.postMessage(
      { type: 'DOCS_SET_INVERTED', inverted: next },
      '*'
    );
  };

  const handleDownloadPdf = () => {
    previewIframeRef.current?.contentWindow?.postMessage(
      { type: 'DOCS_TRIGGER_PRINT' },
      '*'
    );
  };

  // Share Modal State (Overleaf Project Sharing)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [copiedLinkType, setCopiedLinkType] = useState<'edit' | 'view' | null>(null);

  const handleCopyShareLink = async (type: 'edit' | 'view') => {
    if (!activeDoc) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const token = type === 'edit' ? (activeDoc.editToken || `e_${activeDoc.id}`) : (activeDoc.viewToken || `v_${activeDoc.id}`);
    const url = `${origin}/docs/${activeDoc.id}?token=${token}&mode=${type}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkType(type);
      setTimeout(() => setCopiedLinkType(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc || !inviteEmails.trim()) return;
    setIsInviting(true);
    const emails = inviteEmails
      .split(',')
      .map((em) => em.trim().toLowerCase())
      .filter((em) => em && em.includes('@'));

    for (const em of emails) {
      addDocCollaborator(activeDoc.id, em, inviteRole);
    }
    setInviteEmails('');
    setIsInviting(false);
  };

  // Subfile & Folder UI state
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newSubFileName, setNewSubFileName] = useState('');
  const [newSubFileExt, setNewSubFileExt] = useState('.md');
  const [isAddingSubFolder, setIsAddingSubFolder] = useState(false);
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [addingInFolder, setAddingInFolder] = useState<string | null>(null);
  const [newFileInFolderName, setNewFileInFolderName] = useState('');
  const [editingSubFileId, setEditingSubFileId] = useState<string | null>(null);
  const [editingSubFileName, setEditingSubFileName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; status: 'done' | 'error' }>>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!activeDocId) return;
    const arr = Array.from(files);
    for (const file of arr) {
      try {
        const isText = file.type.startsWith('text/') ||
          /\.(tex|bib|md|txt|csv|json|js|ts|py|html|css|xml|yaml|yml)$/i.test(file.name);
        if (isText) {
          const content = await file.text();
          createSubFile(activeDocId, file.name, content);
        } else {
          // For binary (images etc), store as a placeholder reference comment
          const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
          const placeholder = `% [Uploaded file: ${file.name}]\n% Binary files (${ext}) are referenced here.\n% Use \\includegraphics{${file.name}} to embed images in LaTeX.`;
          createSubFile(activeDocId, file.name, placeholder);
        }
        setUploadedFiles(prev => [...prev, { name: file.name, status: 'done' }]);
      } catch {
        setUploadedFiles(prev => [...prev, { name: file.name, status: 'error' }]);
      }
    }
  }, [activeDocId, createSubFile]);

  const toggleFolderCollapse = (folderName: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderName)) next.delete(folderName);
      else next.add(folderName);
      return next;
    });
  };

  // Jump to specific line in the editor textarea
  const jumpToLine = (lineNumber: number) => {
    const el = textareaRef.current;
    if (!el || !activeDoc) return;
    const lines = (activeSubFile?.content || activeDoc.content).split('\n');
    let charIndex = 0;
    for (let i = 0; i < lineNumber && i < lines.length; i++) {
      charIndex += lines[i].length + 1;
    }
    el.focus();
    el.setSelectionRange(charIndex, charIndex + (lines[lineNumber]?.length || 0));
    el.scrollTop = Math.max(0, lineNumber * 21 - 100);
  };

  // Scroll the preview iframe to a matching heading
  const scrollPreviewToHeading = (headingText: string) => {
    previewIframeRef.current?.contentWindow?.postMessage(
      { type: 'DOCS_SCROLL_TO_HEADING', text: headingText },
      '*'
    );
  };

  // Generation state
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [isGenerationFinished, setIsGenerationFinished] = useState(false);

  // Panel resize state (widths in px; 0 = flex auto)
  const [leftWidth, setLeftWidth] = useState(252);
  const [editorWidth, setEditorWidth] = useState(0); // 0 = flex:1
  const [copilotWidth, setCopilotWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Drag Left Drawer (1:1 Mouse Follow)
  const handleLeftDrawerDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const newWidth = Math.max(160, Math.min(500, startWidth + (ev.clientX - startX)));
      setLeftWidth(newWidth);
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
  }, [leftWidth]);

  // 2. Drag Editor Width (1:1 Mouse Follow)
  const handleEditorDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const currentWidth = editorContainerRef.current?.offsetWidth || editorWidth || 450;

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const newWidth = Math.max(200, Math.min(window.innerWidth - 300, currentWidth + (ev.clientX - startX)));
      setEditorWidth(newWidth);
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
  }, [editorWidth]);

  // 3. Drag Copilot Width (1:1 Mouse Follow)
  const handleCopilotDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = copilotWidth;

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const newWidth = Math.max(220, Math.min(650, startWidth - (ev.clientX - startX)));
      setCopilotWidth(newWidth);
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
  }, [copilotWidth]);

  const effectiveDocId = initialDocId || activeDocId;
  const activeDoc = documents.find((d) => d.id === effectiveDocId) || documents[0];

  // Active sub-file in the Overleaf multi-file tree
  const docFiles = activeDoc?.files || [];
  const activeSubFile =
    docFiles.find((f) => f.id === activeDoc?.activeFileId) ||
    docFiles.find((f) => f.isMain) ||
    docFiles[0] ||
    null;

  // Bundled content for live preview & compilation
  const bundledContent = useMemo(() => {
    if (!activeDoc) return '';
    return getBundledDocContent(activeDoc);
  }, [activeDoc]);

  // Start Agentic Generation
  const handleStartGenerate = async (promptText: string, format: DocFormat) => {
    setCurrentPrompt(promptText);
    setStreamedText('');
    setIsGenerationFinished(false);
    setStudioPhase('generating');

    let systemInstruction = '';
    if (format === 'sheet') {
      systemInstruction =
        'You are an expert financial and data spreadsheet modeler. Output a comprehensive Markdown table representing a complete spreadsheet with numerical columns, headers, and calculation formulas.';
    } else if (format === 'slide') {
      systemInstruction =
        'You are an elite presentation designer. Create a 5 to 7 slide widescreen (16:9) presentation deck in Markdown. Separate each slide strictly using "---" on a new line. Include title slide, agenda, problem-solution, key metrics, technical architecture or diagrams, and conclusion.';
    } else {
      systemInstruction =
        'You are an elite Academic and Technical Paper author. Output a complete, publication-ready research paper or technical document in Markdown with rich LaTeX mathematical formulas (using $inline$ and $$block$$), section headings, data tables, and BibTeX references.';
    }

    const messages: ChatMessage[] = [
      {
        id: 'msg_' + Date.now(),
        sessionId: 'docs_gen',
        role: 'user',
        content: `Create a complete document based on this prompt: "${promptText}". Format strictly as clean Markdown with LaTeX math and tables where appropriate.`,
        timestamp: Date.now(),
        status: 'done',
      },
    ];

    let accumulated = '';
    try {
      await streamBYOKChat({
        providerId: 'groq' as LLMProviderId,
        modelId: 'llama-3.3-70b-versatile',
        systemPrompt: systemInstruction,
        messages,
        apiKeyConfig: { apiKey: '', isEnabled: true },
        temperature: 0.6,
        onChunk: (chunk) => {
          if (chunk.delta) {
            accumulated += chunk.delta;
            setStreamedText(accumulated);
          }
        },
      });
    } catch (err) {
      console.warn('[DocsView] Generation streaming error:', err);
    } finally {
      setIsGenerationFinished(true);

      // Create or update document
      const docTitle = promptText.slice(0, 40) + (promptText.length > 40 ? '...' : '');
      const newId = createDocument(docTitle, accumulated || promptText, format);
      setActiveDocId(newId);
    }
  };

  // Filtered sub-files for the Overleaf project file tree
  const filteredSubFiles = useMemo(() => {
    return docFiles.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [docFiles, searchQuery]);

  // Grouped sub-files into root files and subfolders
  const { rootFiles, folderMap } = useMemo(() => {
    const roots: typeof docFiles = [];
    const folders: Record<string, typeof docFiles> = {};

    for (const f of filteredSubFiles) {
      const clean = f.name.replace(/\\/g, '/');
      const slashIndex = clean.indexOf('/');
      if (slashIndex > 0) {
        const folderName = clean.substring(0, slashIndex);
        if (!folders[folderName]) folders[folderName] = [];
        folders[folderName].push(f);
      } else {
        roots.push(f);
      }
    }

    return { rootFiles: roots, folderMap: folders };
  }, [filteredSubFiles, docFiles]);

  // Document Headings & Section Outline for Outline Tab
  const documentHeadings = useMemo(() => {
    const text = activeSubFile?.content || activeDoc?.content || '';
    if (!text) return [];

    const headings: Array<{ line: number; text: string; level: number }> = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Markdown: #, ##, ###, ####
      const mdMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (mdMatch) {
        headings.push({
          line: i,
          level: mdMatch[1].length,
          text: mdMatch[2].trim(),
        });
        continue;
      }
      // LaTeX: \section{}, \subsection{}, \subsubsection{}
      const secMatch = line.match(/\\(section|subsection|subsubsection)\*?\{([^}]+)\}/);
      if (secMatch) {
        const type = secMatch[1];
        const level = type === 'section' ? 1 : type === 'subsection' ? 2 : 3;
        headings.push({
          line: i,
          level,
          text: secMatch[2].trim(),
        });
      }
    }
    return headings;
  }, [activeSubFile?.content, activeDoc?.content]);

  // Document Find & Replace matches
  const searchMatches = useMemo(() => {
    if (!docSearchQuery.trim()) return [];
    const text = activeSubFile?.content || activeDoc?.content || '';
    const matches: Array<{ line: number; match: string; index: number; lineText: string }> = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const target = isCaseSensitive ? line : line.toLowerCase();
      const q = isCaseSensitive ? docSearchQuery : docSearchQuery.toLowerCase();
      let startIdx = 0;
      while ((startIdx = target.indexOf(q, startIdx)) !== -1) {
        matches.push({
          line: i,
          match: line.substring(startIdx, startIdx + q.length),
          index: startIdx,
          lineText: line.trim(),
        });
        startIdx += q.length;
      }
    }
    return matches;
  }, [activeSubFile?.content, activeDoc?.content, docSearchQuery, isCaseSensitive]);

  const handleReplaceAll = () => {
    if (!docSearchQuery || !activeDoc) return;
    const currentText = activeSubFile?.content ?? activeDoc.content;
    const flags = isCaseSensitive ? 'g' : 'gi';
    const escaped = docSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const updated = currentText.replace(new RegExp(escaped, flags), docReplaceQuery);
    if (activeSubFile) {
      updateSubFileContent(activeDoc.id, activeSubFile.id, updated);
    } else {
      updateDocumentContent(activeDoc.id, updated);
    }
  };

  // Word & Line stats based on bundled document
  const stats = useMemo(() => {
    const text = bundledContent || activeDoc?.content || '';
    if (!text) return { words: 0, chars: 0, lines: 0 };
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text.split('\n').length;
    return { words, chars, lines };
  }, [bundledContent, activeDoc?.content]);

  // Compilation & Linter diagnostics (Errors, Warnings, Info)
  const lintResults = useMemo(() => {
    const text = activeSubFile?.content ?? activeDoc?.content ?? '';
    return lintDocumentContent(text, docFiles, activeSubFile?.name || 'main.tex');
  }, [activeSubFile?.content, activeDoc?.content, docFiles, activeSubFile?.name]);

  const handleRecompile = () => {
    setIsRecompiling(true);
    setTimeout(() => {
      setIsRecompiling(false);
    }, 350);
  };

  // Markdown + KaTeX + Mermaid Sandboxed Compilation HTML using bundled content
  const previewHtml = useMemo(() => {
    const raw = bundledContent || activeDoc?.content || '';
    if (!raw) return '';
    const isLight = theme === 'light';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${activeDoc.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- KaTeX CSS & JS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"><\/script>
  
  <!-- Marked Markdown Parser -->
  <script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"><\/script>
  
  <!-- Mermaid Diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"><\/script>

  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      background-color: ${isLight ? '#cbd5e1' : '#070a10'};
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      overflow-x: auto;
      overflow-y: auto;
    }
    #page-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 12px;
      min-width: 100%;
      width: max-content;
      min-height: 100%;
      box-sizing: border-box;
    }
    #scaler-wrapper {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      margin: 0 auto;
      flex-shrink: 0;
    }
    .paper-sheet {
      position: absolute;
      top: 0;
      left: 0;
      width: 794px; /* Fixed Standard A4 Paper Width (210mm) */
      min-height: 1123px; /* Fixed Standard A4 Paper Height (297mm) */
      background: #ffffff;
      padding: 64px 72px; /* Standard 1-inch Academic Paper Margins */
      border-radius: 2px;
      box-shadow: ${
        isLight
          ? '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)'
          : '0 6px 20px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      };
      line-height: 1.7;
      font-size: 14.5px;
      color: #1a202c;
      transform-origin: 0 0;
      box-sizing: border-box;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Inter', system-ui, sans-serif;
      color: #0f172a;
      font-weight: 700;
      line-height: 1.3;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    h1 { font-size: 26px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    h2 { font-size: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    h3 { font-size: 16px; }
    p { margin-top: 0; margin-bottom: 1em; }
    a { color: #0073ea; text-decoration: none; }
    a:hover { text-decoration: underline; }
    blockquote {
      margin: 1.2em 0;
      padding: 8px 16px;
      border-left: 4px solid #0073ea;
      background: #f8fafc;
      color: #475569;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      font-size: 13.5px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
    tr:nth-child(even) { background-color: #f8fafc; }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      color: #0f172a;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    .katex-display {
      margin: 1.2em 0 !important;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 6px 0;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      margin: 24px 0;
    }
    /* Slim and elegant preview scrollbar */
    html {
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
    }
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.45);
      border-radius: 6px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(148, 163, 184, 0.75);
    }
    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
      }
      .paper-sheet {
        position: static !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        min-height: auto !important;
        transform: none !important;
      }
    }
  </style>
</head>
<body>
  <div id="page-container">
    <div id="scaler-wrapper">
      <div class="paper-sheet" id="rendered-content"></div>
    </div>
  </div>

  <script>
    const rawMarkdown = ${JSON.stringify(raw)};
    
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    const parsedHtml = marked.parse(rawMarkdown);
    const container = document.getElementById('rendered-content');
    container.innerHTML = parsedHtml;

    // Render KaTeX formulas
    renderMathInElement(container, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\\\(', right: '\\\\)', display: false},
        {left: '\\\\[', right: '\\\\]', display: true}
      ],
      throwOnError: false
    });

    // Render Mermaid diagrams
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      fontFamily: 'Inter, system-ui, sans-serif',
    });

    // Overleaf Interactive Scaling, Zoom & Page Tracking
    var currentScale = 1.0;
    var userScaleMode = 'auto'; // 'auto' or fixed number
    var totalPagesCount = 1;

    function updateScaleAndPages() {
      var paper = document.getElementById('rendered-content');
      var wrapper = document.getElementById('scaler-wrapper');
      if (!paper || !wrapper) return;

      var clientWidth = document.documentElement.clientWidth || (window.innerWidth - 12);
      var paperBaseWidth = 794;
      var safePadding = 24; // 12px safe margin on both sides
      var availableWidth = Math.max(16, clientWidth - safePadding);

      var scale = userScaleMode === 'auto'
        ? Math.min(1.0, availableWidth / paperBaseWidth)
        : (Number(userScaleMode) / 100);

      currentScale = scale;
      paper.style.transform = 'scale(' + scale + ')';

      var paperHeight = paper.offsetHeight || 1123;
      var scaledWidth = paperBaseWidth * scale;
      var scaledHeight = paperHeight * scale;

      wrapper.style.width = scaledWidth + 'px';
      wrapper.style.height = (scaledHeight + 32) + 'px';

      totalPagesCount = Math.max(1, Math.ceil(paperHeight / 1123));

      // Post scale percentage and total pages to parent
      try {
        window.parent.postMessage({
          type: 'DOCS_PREVIEW_SCALE',
          scale: Math.round(scale * 100),
          totalPages: totalPagesCount
        }, '*');
      } catch (e) {}
    }

    // Scroll tracking for current page in Overleaf page counter
    window.addEventListener('scroll', function() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      var pageHeightScaled = 1123 * currentScale;
      var cur = Math.min(totalPagesCount, Math.max(1, Math.floor((scrollTop + 60) / pageHeightScaled) + 1));
      try {
        window.parent.postMessage({ type: 'DOCS_PAGE_SCROLLED', currentPage: cur }, '*');
      } catch (e) {}
    }, { passive: true });

    // Attach ResizeObserver to documentElement for auto scaling
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function() {
        if (userScaleMode === 'auto') updateScaleAndPages();
      });
      ro.observe(document.documentElement);
    }
    window.addEventListener('resize', function() {
      if (userScaleMode === 'auto') updateScaleAndPages();
    });
    window.addEventListener('load', updateScaleAndPages);
    setTimeout(updateScaleAndPages, 30);
    setTimeout(updateScaleAndPages, 150);

    // Listen for messages from parent (Overleaf preview actions)
    window.addEventListener('message', function(e) {
      if (!e.data) return;

      // 1. Scroll to heading
      if (e.data.type === 'DOCS_SCROLL_TO_HEADING') {
        var text = (e.data.text || '').toLowerCase().trim();
        var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (var i = 0; i < headings.length; i++) {
          var hText = (headings[i].textContent || '').toLowerCase().trim();
          if (hText === text || hText.includes(text) || text.includes(hText)) {
            headings[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
          }
        }
      }

      // 2. Go to specific page
      if (e.data.type === 'DOCS_GO_TO_PAGE') {
        var p = Math.max(1, Math.min(totalPagesCount, e.data.page || 1));
        var targetTop = (p - 1) * (1123 * currentScale);
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }

      // 3. Set Zoom Level
      if (e.data.type === 'DOCS_SET_ZOOM') {
        userScaleMode = e.data.zoom;
        updateScaleAndPages();
      }

      // 4. Invert Preview Colors
      if (e.data.type === 'DOCS_SET_INVERTED') {
        var paperEl = document.getElementById('rendered-content');
        if (paperEl) {
          if (e.data.inverted) {
            paperEl.style.filter = 'invert(0.92) hue-rotate(180deg) contrast(1.1)';
            document.body.style.backgroundColor = '#0f172a';
          } else {
            paperEl.style.filter = 'none';
            document.body.style.backgroundColor = '${isLight ? '#cbd5e1' : '#070a10'}';
          }
        }
      }

      // 5. Trigger Print / Export
      if (e.data.type === 'DOCS_TRIGGER_PRINT') {
        window.print();
      }
    });
  </script>
</body>
</html>
    `;
  }, [activeDoc?.content, activeDoc?.title, theme]);

  // Insert markdown shortcut helpers
  const insertShortcut = (before: string, after: string = '', defaultText: string = '') => {
    const el = textareaRef.current;
    if (!el || !activeDoc) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end) || defaultText;

    const updated = text.substring(0, start) + before + selected + after + text.substring(end);
    if (activeSubFile) {
      updateSubFileContent(activeDoc.id, activeSubFile.id, updated);
    } else {
      updateDocumentContent(activeDoc.id, updated);
    }

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  // Overleaf Paragraph Style handler
  const handleApplyParagraphStyle = (styleType: string) => {
    const isLatex = activeDoc?.format === 'latex';
    const map: Record<string, [string, string, string]> = isLatex
      ? {
          normal: ['', '', ''],
          section: ['\\section{', '}\n', 'Judul Bagian'],
          subsection: ['\\subsection{', '}\n', 'Sub Bagian'],
          subsubsection: ['\\subsubsection{', '}\n', 'Sub Sub Bagian'],
          paragraph: ['\\paragraph{', '}\n', 'Paragraf'],
          subparagraph: ['\\subparagraph{', '}\n', 'Sub Paragraf'],
        }
      : {
          normal: ['', '', ''],
          section: ['# ', '\n', 'Judul Bagian'],
          subsection: ['## ', '\n', 'Sub Bagian'],
          subsubsection: ['### ', '\n', 'Sub Sub Bagian'],
          paragraph: ['#### ', '\n', 'Paragraf'],
          subparagraph: ['##### ', '\n', 'Sub Paragraf'],
        };
    const [before, after, defaultText] = map[styleType] ?? ['', '', ''];
    if (before) {
      insertShortcut(before, after, defaultText);
    }
    setIsParagraphStyleMenuOpen(false);
  };

  // Export handlers
  const handleExportPDF = () => {
    if (previewIframeRef.current?.contentWindow) {
      previewIframeRef.current.contentWindow.print();
    }
  };

  const handleExportMarkdown = () => {
    if (!activeDoc) return;
    const exportText = bundledContent || activeDoc.content || '';
    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (activeDoc.title || 'document').replace(/\s+/g, '_') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLatex = () => {
    if (!activeDoc) return;
    const exportText = bundledContent || activeDoc.content || '';
    const latexHeader = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{${activeDoc.title}}
\\author{Anticeil Agentic Studio}
\\date{\\today}

\\begin{document}
\\maketitle

${exportText}

\\end{document}`;

    const blob = new Blob([latexHeader], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (activeDoc.title || 'document').replace(/\s+/g, '_') + '.tex';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── PHASE 1: LANDING VIEW ──
  if (!initialDocId && studioPhase === 'landing') {
    return <DocsLandingView onStartGenerate={handleStartGenerate} />;
  }

  // ── PHASE 2: GENERATING VIEW ──
  if (studioPhase === 'generating') {
    return (
      <DocsGeneratingView
        promptText={currentPrompt}
        generatedContent={streamedText}
        isFinished={isGenerationFinished}
        onViewResult={() => setStudioPhase('editor')}
      />
    );
  }

  // ── PHASE 3: DEDICATED FULL-SCREEN EDITOR VIEW ──
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-main)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Mobile & Tablet Backdrop Overlay (< 1024px) */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
      />

      {/* 0. Far-Left Mini Sidebar (Exact 48px width matching main Sidebar.tsx) */}
      <div
        className="sidebar-icon-rail"
        style={{
          width: '48px',
          height: '100%',
          backgroundColor: 'var(--bg-main)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0 12px 0',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
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
              href="/docs"
              title="Anticeil Docs"
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

          {/* Quick App Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingTop: '4px', width: '100%' }}>
            {/* Expand button (when sidebar is collapsed) */}
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={toggleSidebar}
                style={{
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className="hover-subtle"
                title={language === 'id' ? 'Buka Sidebar / Drawer' : 'Expand Sidebar'}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}

            {/* Tab: Files */}
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) {
                  toggleSidebar();
                  setActiveDrawerTab('files');
                } else if (activeDrawerTab === 'files') {
                  toggleSidebar();
                } else {
                  setActiveDrawerTab('files');
                }
              }}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: isSidebarOpen && activeDrawerTab === 'files' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                border: 'none',
                color: isSidebarOpen && activeDrawerTab === 'files' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Struktur File (Files)' : 'Project Files'}
            >
              {isSidebarOpen && activeDrawerTab === 'files' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '7px',
                    bottom: '7px',
                    width: '3px',
                    backgroundColor: 'var(--brand-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <FileText size={16} />
            </button>

            {/* Tab: Search */}
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) {
                  toggleSidebar();
                  setActiveDrawerTab('search');
                } else if (activeDrawerTab === 'search') {
                  toggleSidebar();
                } else {
                  setActiveDrawerTab('search');
                }
              }}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: isSidebarOpen && activeDrawerTab === 'search' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                border: 'none',
                color: isSidebarOpen && activeDrawerTab === 'search' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Pencarian & Ganti (Search)' : 'Search & Replace'}
            >
              {isSidebarOpen && activeDrawerTab === 'search' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '7px',
                    bottom: '7px',
                    width: '3px',
                    backgroundColor: 'var(--brand-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <Search size={16} />
            </button>

            {/* Tab: Review Panel (Overleaf Style) */}
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) {
                  toggleSidebar();
                  setActiveDrawerTab('review');
                } else if (activeDrawerTab === 'review') {
                  toggleSidebar();
                } else {
                  setActiveDrawerTab('review');
                }
              }}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: isSidebarOpen && activeDrawerTab === 'review' ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                border: 'none',
                color: isSidebarOpen && activeDrawerTab === 'review' ? 'var(--brand-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Panel Review & Komentar (Ctrl+J)' : 'Review panel (Ctrl+J)'}
            >
              {isSidebarOpen && activeDrawerTab === 'review' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '7px',
                    bottom: '7px',
                    width: '3px',
                    backgroundColor: 'var(--brand-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <MessageSquarePlus size={16} />
              {(activeDoc?.comments?.filter(c => !c.resolved)?.length ?? 0) > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    minWidth: '13px',
                    height: '13px',
                    padding: '0 3px',
                    borderRadius: '999px',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#ffffff',
                    fontSize: '8.5px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {activeDoc?.comments?.filter(c => !c.resolved)?.length}
                </span>
              )}
            </button>

            {/* Tab: AI Assist */}
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) {
                  toggleSidebar();
                  setActiveDrawerTab('ai');
                } else if (activeDrawerTab === 'ai') {
                  toggleSidebar();
                } else {
                  setActiveDrawerTab('ai');
                }
              }}
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: isSidebarOpen && activeDrawerTab === 'ai' ? 'rgba(0, 115, 234, 0.15)' : 'transparent',
                border: 'none',
                color: isSidebarOpen && activeDrawerTab === 'ai' ? 'var(--brand-primary)' : 'var(--brand-primary)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'AI Co-Author Assistant' : 'AI Co-Author Assistant'}
            >
              {isSidebarOpen && activeDrawerTab === 'ai' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '7px',
                    bottom: '7px',
                    width: '3px',
                    backgroundColor: 'var(--brand-primary)',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
              )}
              <Sparkles size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 1. Main Workspace Area to the right of Mini Sidebar */}
      <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* ── Top Header Toolbar (Exact 48px Height spanning across drawer + editor) ── */}
        <header
          className="hide-scrollbar"
          style={{
            height: '48px',
            boxSizing: 'border-box',
            padding: '0 var(--page-pad-x, 16px) 0 12px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            zIndex: 20,
          }}
        >
          {/* Left: Drawer toggle (mobile), Brand name "Anticeil", and active Document title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 'max-content', flexShrink: 0 }}>
            {/* Mobile burger */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="show-on-drawer hover-subtle"
              title="Buka Navigasi"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Toggle navigation drawer"
            >
              <Menu size={18} />
            </button>

            {/* Brand Title */}
            <span
              style={{
                fontSize: '13px',
                fontWeight: 750,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Anticeil
            </span>

            <span style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 3px', opacity: 0.7 }}>/</span>

            {/* Overleaf-Style Document Title Pill */}
            {activeDoc ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '2px 8px 2px 7px',
                  transition: 'all 0.15s ease',
                }}
              >
                {activeDoc.format === 'sheet' ? (
                  <TableIcon size={13.5} color="#10B981" style={{ flexShrink: 0 }} />
                ) : activeDoc.format === 'slide' ? (
                  <Layers size={13.5} color="#8B5CF6" style={{ flexShrink: 0 }} />
                ) : (
                  <FileText size={13.5} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                )}

                <input
                  type="text"
                  size={Math.max(1, (activeDoc.title || '').length)}
                  value={activeDoc.title}
                  onChange={(e) => updateDocumentTitle(activeDoc.id, e.target.value)}
                  placeholder="Judul dokumen..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    maxWidth: '360px',
                    minWidth: '32px',
                    width: 'auto',
                    // @ts-ignore
                    fieldSizing: 'content',
                    padding: 0,
                    margin: 0,
                    cursor: 'text',
                  }}
                  onFocus={(e) => {
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.style.borderColor = 'var(--brand-primary)';
                      e.currentTarget.parentElement.style.boxShadow = '0 0 0 1px var(--brand-primary)';
                    }
                  }}
                  onBlur={(e) => {
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.parentElement.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>
            ) : (
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Docs Studio</span>
            )}
          </div>

          {/* Right: Hotkeys + History + Overleaf Layout Options + Share (Far Right) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Hotkeys / Keyboard Shortcuts Button (Overleaf Style) */}
            <button
              type="button"
              onClick={() => setIsHotkeysModalOpen(true)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isHotkeysModalOpen ? 'var(--bg-subtle)' : 'transparent',
                border: isHotkeysModalOpen ? '1px solid var(--border-subtle)' : '1px solid transparent',
                color: isHotkeysModalOpen ? 'var(--brand-primary)' : 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Pintasan Tombol (Hotkeys / F1)' : 'Keyboard Shortcuts (Hotkeys / F1)'}
            >
              <Keyboard size={16} />
            </button>

            {/* History / Revisions Icon Button (Overleaf Style) */}
            <button
              type="button"
              onClick={() => {
                setActiveDrawerTab('files');
                if (!isSidebarOpen) toggleSidebar();
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              className="hover-subtle"
              title={language === 'id' ? 'Riwayat Revisi (History)' : 'History / Revisions'}
            >
              <History size={16} />
            </button>

            {/* Overleaf-Style Layout Options Button */}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                ref={layoutButtonRef}
                type="button"
                onClick={toggleLayoutMenu}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isLayoutMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                  border: isLayoutMenuOpen ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  color: isLayoutMenuOpen ? 'var(--brand-primary)' : 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className="hover-subtle"
                title="Layout options"
              >
                {viewMode === 'split' ? (
                  <Columns size={16} />
                ) : viewMode === 'code' ? (
                  <Pencil size={15} />
                ) : (
                  <Eye size={16} />
                )}
              </button>

              {/* Overleaf-Style Layout Options Popover */}
              {isLayoutMenuOpen && layoutMenuPos && typeof document !== 'undefined' && createPortal(
                <div
                  ref={layoutMenuRef}
                  onClick={(e) => e.stopPropagation()}
                  className="animate-fade-in"
                  style={{
                    position: 'fixed',
                    top: `${layoutMenuPos.top}px`,
                    left: `${layoutMenuPos.left}px`,
                    width: '235px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong)',
                    boxShadow: 'var(--shadow-xl, 0 16px 36px rgba(0,0,0,0.35))',
                    padding: '6px',
                    zIndex: 999999999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div style={{ padding: '4px 8px 6px', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Layout options
                  </div>

                  {/* 1. Split view */}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('split');
                      setIsLayoutMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: viewMode === 'split' ? '#15803d' : 'transparent',
                      color: viewMode === 'split' ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: viewMode === 'split' ? 600 : 500,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== 'split') e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== 'split') e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {viewMode === 'split' ? (
                      <Check size={14} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                    ) : (
                      <Columns size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                    )}
                    <span>Split view</span>
                  </button>

                  {/* 2. Editor only */}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('code');
                      setIsLayoutMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: viewMode === 'code' ? '#15803d' : 'transparent',
                      color: viewMode === 'code' ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: viewMode === 'code' ? 600 : 500,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== 'code') e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== 'code') e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {viewMode === 'code' ? (
                      <Check size={14} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                    ) : (
                      <Pencil size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                    )}
                    <span>Editor only</span>
                  </button>

                  {/* 3. PDF only */}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('preview');
                      setIsLayoutMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: viewMode === 'preview' ? '#15803d' : 'transparent',
                      color: viewMode === 'preview' ? '#ffffff' : 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: viewMode === 'preview' ? 600 : 500,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== 'preview') e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== 'preview') e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {viewMode === 'preview' ? (
                      <Check size={14} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                    ) : (
                      <FileText size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                    )}
                    <span>PDF only</span>
                  </button>

                  {/* 4. Open PDF in separate tab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (activeDoc) {
                        const newWin = window.open('', '_blank');
                        if (newWin) {
                          newWin.document.write(previewHtml);
                          newWin.document.close();
                        }
                      }
                      setIsLayoutMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <ExternalLink size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                    <span>Open PDF in separate tab</span>
                  </button>

                  <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

                  {/* 5. Focus mode */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsFocusMode(!isFocusMode);
                      if (!isFocusMode) {
                        if (isSidebarOpen) toggleSidebar();
                        if (isCopilotOpen) toggleCopilot();
                      }
                      setIsLayoutMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: isFocusMode ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                      color: isFocusMode ? 'var(--brand-primary)' : 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isFocusMode) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isFocusMode) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      {isFocusMode ? (
                        <Minimize2 size={14} style={{ flexShrink: 0 }} />
                      ) : (
                        <Maximize2 size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                      )}
                      <span>Focus mode</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 500 }}>
                      Ctrl Shift M
                    </span>
                  </button>
                </div>,
                document.body
              )}
            </div>

            {/* Overleaf-Style Green Share Button (Positioned at Far Right) */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                height: '30px',
                padding: '0 12px',
                borderRadius: '20px',
                backgroundColor: '#16a34a',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 650,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
              title={language === 'id' ? 'Bagikan Proyek (Share)' : 'Share Project'}
            >
              <UserPlus size={13} strokeWidth={2.4} />
              <span>Share</span>
            </button>
          </div>
        </header>

        {/* ── Lower Workspace Body below App Bar (Drawer + Editor Area) ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {/* Responsive Left Sidebar Drawer */}
          {isSidebarOpen && (
            <>
              <aside
                className={`docs-sidebar-wrapper ${isSidebarOpen ? 'drawer-open' : ''}`}
                style={{
                  width: `${leftWidth}px`,
                  height: '100%',
                  borderRight: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-sidebar)',
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Mobile-only Drawer Top Bar: Brand Logo, Title & Close X button */}
                <div
                  className="show-on-drawer"
                  style={{
                    height: '48px',
                    boxSizing: 'border-box',
                    padding: '0 10px',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src="/anticeil-logo.png"
                      alt="Anticeil Logo"
                      style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0, marginLeft: '1px' }}
                    />
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Anticeil
                    </span>
                  </div>

                  <button
                    onClick={toggleSidebar}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Close drawer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* TAB 1: FILES TREE */}
                {activeDrawerTab === 'files' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    {/* Drawer Header: Title + New File, New Folder & Collapse Buttons (Exact 48px height) */}
                    <div
                      style={{
                        height: '48px',
                        boxSizing: 'border-box',
                        padding: '0 12px',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {language === 'id' ? 'Struktur File' : 'Project Files'}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '999px',
                            padding: '0 5px',
                            lineHeight: '15px',
                          }}
                        >
                          {docFiles.length}
                        </span>
                      </div>

                      {/* New File, New Folder, Upload & Collapse Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSubFileName('');
                            setNewSubFileExt('.md');
                            setIsAddingSubFolder(false);
                            setAddingInFolder(null);
                            setIsNewFileModalOpen(true);
                          }}
                          style={{
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            backgroundColor: isNewFileModalOpen ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                            border: isNewFileModalOpen ? '1px solid rgba(0, 115, 234, 0.3)' : '1px solid transparent',
                            color: isNewFileModalOpen ? 'var(--brand-primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          className="hover-subtle"
                          title={language === 'id' ? 'Tambah File Baru' : 'New File'}
                        >
                          <FilePlus size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingSubFolder(!isAddingSubFolder);
                            setAddingInFolder(null);
                          }}
                          style={{
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            backgroundColor: isAddingSubFolder ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                            border: isAddingSubFolder ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                            color: isAddingSubFolder ? '#F59E0B' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          className="hover-subtle"
                          title={language === 'id' ? 'Tambah Folder Baru' : 'New Folder'}
                        >
                          <FolderPlus size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFiles([]);
                            setIsUploadModalOpen(true);
                          }}
                          style={{
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            backgroundColor: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          className="hover-subtle"
                          title={language === 'id' ? 'Unggah File' : 'Upload Files'}
                        >
                          <Upload size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={toggleSidebar}
                          style={{
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            backgroundColor: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          className="hide-on-drawer hover-subtle"
                          title={language === 'id' ? 'Tutup Panel' : 'Collapse Panel'}
                        >
                          <PanelLeftClose size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Sub-header: Folder Add Input */}
                    <div style={{ padding: '0 10px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
                      {/* Add New Folder Inline Input */}
                      {isAddingSubFolder && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600 }}>📁</span>
                          <input
                            type="text"
                            placeholder="e.g. chapters, tables, sections"
                            value={newSubFolderName}
                            onChange={(e) => setNewSubFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const trimmed = newSubFolderName.trim().replace(/\/+$/, '');
                                if (trimmed && activeDoc) {
                                  const initialFileName = `${trimmed}/01-intro.tex`;
                                  const newId = createSubFile(activeDoc.id, initialFileName);
                                  setActiveFileId(activeDoc.id, newId);
                                  setNewSubFolderName('');
                                  setIsAddingSubFolder(false);
                                }
                              }
                              if (e.key === 'Escape') setIsAddingSubFolder(false);
                            }}
                            autoFocus
                            style={{
                              flex: 1,
                              background: 'var(--bg-surface)',
                              border: '1px solid #F59E0B',
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
                              const trimmed = newSubFolderName.trim().replace(/\/+$/, '');
                              if (trimmed && activeDoc) {
                                const initialFileName = `${trimmed}/01-intro.tex`;
                                const newId = createSubFile(activeDoc.id, initialFileName);
                                setActiveFileId(activeDoc.id, newId);
                                setNewSubFolderName('');
                                setIsAddingSubFolder(false);
                              }
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingSubFolder(false)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      {/* Sub-file Filter Search */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          height: '30px',
                          boxSizing: 'border-box',
                        }}
                      >
                        <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <input
                          type="text"
                          placeholder={language === 'id' ? 'Cari file di proyek ini...' : 'Search project files...'}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '11.5px',
                            color: 'var(--text-primary)',
                          }}
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Overleaf Folder & File Tree */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                      {filteredSubFiles.length === 0 ? (
                        <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {language === 'id' ? 'Tidak ada file yang cocok' : 'No matching files'}
                        </div>
                      ) : (
                        <>
                          {/* 1. Folders Section */}
                          {Object.keys(folderMap)
                            .sort()
                            .map((folderName) => {
                              const isCollapsed = collapsedFolders.has(folderName);
                              const filesInFolder = folderMap[folderName];

                              return (
                                <div key={folderName} style={{ marginBottom: '4px' }}>
                                  {/* Folder Header Row */}
                                  <div
                                    onClick={() => toggleFolderCollapse(folderName)}
                                    className="clickable-pill"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '5px 6px',
                                      borderRadius: '5px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: 650,
                                      color: 'var(--text-primary)',
                                      userSelect: 'none',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                                      <ChevronRight
                                        size={12}
                                        color="var(--text-muted)"
                                        style={{
                                          transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                                          transition: 'transform 0.15s ease',
                                          flexShrink: 0,
                                        }}
                                      />
                                      {isCollapsed ? (
                                        <Folder size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
                                      ) : (
                                        <FolderOpen size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
                                      )}
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {folderName}/
                                      </span>
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                                        ({filesInFolder.length})
                                      </span>
                                    </div>

                                    {/* Add File directly to this folder */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddingInFolder(addingInFolder === folderName ? null : folderName);
                                        if (isCollapsed) toggleFolderCollapse(folderName);
                                      }}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                      }}
                                      title={language === 'id' ? `Tambah file ke folder ${folderName}` : `Add file to ${folderName}`}
                                    >
                                      <Plus size={11} />
                                    </button>
                                  </div>

                                  {/* Inline input for adding file into this folder */}
                                  {addingInFolder === folderName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 6px 3px 22px', marginTop: '2px' }}>
                                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{folderName}/</span>
                                      <input
                                        type="text"
                                        placeholder="nama_file.tex"
                                        value={newFileInFolderName}
                                        onChange={(e) => setNewFileInFolderName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const trimmed = newFileInFolderName.trim();
                                            if (trimmed && activeDoc) {
                                              const fullPath = `${folderName}/${trimmed}`;
                                              const newId = createSubFile(activeDoc.id, fullPath);
                                              setActiveFileId(activeDoc.id, newId);
                                              setNewFileInFolderName('');
                                              setAddingInFolder(null);
                                            }
                                          }
                                          if (e.key === 'Escape') setAddingInFolder(null);
                                        }}
                                        autoFocus
                                        style={{
                                          flex: 1,
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
                                        onClick={() => {
                                          const trimmed = newFileInFolderName.trim();
                                          if (trimmed && activeDoc) {
                                            const fullPath = `${folderName}/${trimmed}`;
                                            const newId = createSubFile(activeDoc.id, fullPath);
                                            setActiveFileId(activeDoc.id, newId);
                                            setNewFileInFolderName('');
                                            setAddingInFolder(null);
                                          }
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
                                      >
                                        <Check size={11} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setAddingInFolder(null)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                      >
                                        <X size={11} />
                                      </button>
                                    </div>
                                  )}

                                  {/* Folder Files List */}
                                  {!isCollapsed && (
                                    <div style={{ paddingLeft: '14px', borderLeft: '1px solid var(--border-subtle)', marginLeft: '10px', marginTop: '2px' }}>
                                      {filesInFolder.map((file) => {
                                        const isActive = activeSubFile?.id === file.id;
                                        const isEditingThis = editingSubFileId === file.id;
                                        const baseFileName = file.name.substring(folderName.length + 1);

                                        const getSubFileIcon = () => {
                                          const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                                          if (ext === '.tex') return <Sigma size={12} color="#8B5CF6" style={{ flexShrink: 0 }} />;
                                          if (ext === '.bib') return <BookOpen size={12} color="#F59E0B" style={{ flexShrink: 0 }} />;
                                          if (ext === '.csv') return <TableIcon size={12} color="#10B981" style={{ flexShrink: 0 }} />;
                                          if (ext === '.slide') return <Presentation size={12} color="#8B5CF6" style={{ flexShrink: 0 }} />;
                                          return <FileText size={12} color="#0073EA" style={{ flexShrink: 0 }} />;
                                        };

                                        if (isEditingThis) {
                                          return (
                                            <div
                                              key={file.id}
                                              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 4px', marginBottom: '2px' }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <input
                                                type="text"
                                                value={editingSubFileName}
                                                onChange={(e) => setEditingSubFileName(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    const trimmed = editingSubFileName.trim();
                                                    if (trimmed && activeDoc) updateSubFileName(activeDoc.id, file.id, trimmed);
                                                    setEditingSubFileId(null);
                                                  }
                                                  if (e.key === 'Escape') setEditingSubFileId(null);
                                                }}
                                                autoFocus
                                                style={{
                                                  flex: 1,
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
                                                onClick={() => {
                                                  const trimmed = editingSubFileName.trim();
                                                  if (trimmed && activeDoc) updateSubFileName(activeDoc.id, file.id, trimmed);
                                                  setEditingSubFileId(null);
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
                                              >
                                                <Check size={11} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingSubFileId(null)}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                              >
                                                <X size={11} />
                                              </button>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div
                                            key={file.id}
                                            onClick={() => activeDoc && setActiveFileId(activeDoc.id, file.id)}
                                            className="clickable-pill"
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              padding: '4px 6px',
                                              borderRadius: '5px',
                                              backgroundColor: isActive ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                                              color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                              cursor: 'pointer',
                                              fontSize: '11.5px',
                                              fontWeight: isActive || file.isMain ? 600 : 400,
                                              marginBottom: '1px',
                                              gap: '4px',
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
                                              {getSubFileIcon()}
                                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {baseFileName}
                                              </span>
                                              {file.isMain && (
                                                <span
                                                  style={{
                                                    fontSize: '8.5px',
                                                    fontWeight: 700,
                                                    color: '#10B981',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                                    borderRadius: '3px',
                                                    padding: '0 3px',
                                                    lineHeight: '13px',
                                                    flexShrink: 0,
                                                  }}
                                                >
                                                  MAIN
                                                </span>
                                              )}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                                              {!file.isMain && (
                                                <button
                                                  type="button"
                                                  onClick={() => activeDoc && setMainSubFile(activeDoc.id, file.id)}
                                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                                  title={language === 'id' ? 'Jadikan File Utama' : 'Set as Main'}
                                                >
                                                  <Star size={10} />
                                                </button>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingSubFileId(file.id);
                                                  setEditingSubFileName(file.name);
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                                title={language === 'id' ? 'Ganti Nama' : 'Rename'}
                                              >
                                                <Edit2 size={10} />
                                              </button>
                                              {docFiles.length > 1 && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (confirm(`Hapus file "${file.name}"?`)) {
                                                      if (activeDoc) deleteSubFile(activeDoc.id, file.id);
                                                    }
                                                  }}
                                                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                                  title={language === 'id' ? 'Hapus' : 'Delete'}
                                                >
                                                  <Trash2 size={10} />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                          {/* 2. Root Files Section */}
                          {rootFiles.map((file) => {
                            const isActive = activeSubFile?.id === file.id;
                            const isEditingThis = editingSubFileId === file.id;

                            const getSubFileIcon = () => {
                              const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                              if (ext === '.tex') return <Sigma size={12} color="#8B5CF6" style={{ flexShrink: 0 }} />;
                              if (ext === '.bib') return <BookOpen size={12} color="#F59E0B" style={{ flexShrink: 0 }} />;
                              if (ext === '.csv') return <TableIcon size={12} color="#10B981" style={{ flexShrink: 0 }} />;
                              if (ext === '.slide') return <Presentation size={12} color="#8B5CF6" style={{ flexShrink: 0 }} />;
                              return <FileText size={12} color="#0073EA" style={{ flexShrink: 0 }} />;
                            };

                            if (isEditingThis) {
                              return (
                                <div
                                  key={file.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 4px', marginBottom: '2px' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="text"
                                    value={editingSubFileName}
                                    onChange={(e) => setEditingSubFileName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const trimmed = editingSubFileName.trim();
                                        if (trimmed && activeDoc) updateSubFileName(activeDoc.id, file.id, trimmed);
                                        setEditingSubFileId(null);
                                      }
                                      if (e.key === 'Escape') setEditingSubFileId(null);
                                    }}
                                    autoFocus
                                    style={{
                                      flex: 1,
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
                                    onClick={() => {
                                      const trimmed = editingSubFileName.trim();
                                      if (trimmed && activeDoc) updateSubFileName(activeDoc.id, file.id, trimmed);
                                      setEditingSubFileId(null);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', padding: '1px' }}
                                  >
                                    <Check size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSubFileId(null)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={file.id}
                                onClick={() => activeDoc && setActiveFileId(activeDoc.id, file.id)}
                                className="clickable-pill"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: isActive ? 'rgba(0, 115, 234, 0.12)' : 'transparent',
                                  color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: isActive || file.isMain ? 600 : 400,
                                  marginBottom: '2px',
                                  gap: '6px',
                                  position: 'relative',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                                  {getSubFileIcon()}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.name}
                                  </span>
                                  {file.isMain && (
                                    <span
                                      style={{
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        color: '#10B981',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '4px',
                                        padding: '0 4px',
                                        lineHeight: '14px',
                                        flexShrink: 0,
                                      }}
                                    >
                                      MAIN
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                                  {!file.isMain && (
                                    <button
                                      type="button"
                                      onClick={() => activeDoc && setMainSubFile(activeDoc.id, file.id)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '2px',
                                      }}
                                      title={language === 'id' ? 'Jadikan File Utama (Entrypoint)' : 'Set as Main File'}
                                    >
                                      <Star size={11} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSubFileId(file.id);
                                      setEditingSubFileName(file.name);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      padding: '2px',
                                    }}
                                    title={language === 'id' ? 'Ganti Nama File' : 'Rename File'}
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                  {docFiles.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Hapus file "${file.name}"?`)) {
                                          if (activeDoc) deleteSubFile(activeDoc.id, file.id);
                                        }
                                      }}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '2px',
                                      }}
                                      title={language === 'id' ? 'Hapus File' : 'Delete File'}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    {/* ── Overleaf-style Outline Panel (draggable from top) ── */}
                    {/* Drag Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (isOutlineCollapsed) return;
                        const startY = e.clientY;
                        const startH = outlinePanelHeight;
                        const onMove = (ev: MouseEvent) => {
                          const delta = startY - ev.clientY;
                          setOutlinePanelHeight(Math.max(80, Math.min(480, startH + delta)));
                        };
                        const onUp = () => {
                          document.body.style.cursor = '';
                          document.body.style.userSelect = '';
                          window.removeEventListener('mousemove', onMove);
                          window.removeEventListener('mouseup', onUp);
                        };
                        document.body.style.cursor = 'row-resize';
                        document.body.style.userSelect = 'none';
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                      }}
                      style={{
                        height: '5px',
                        cursor: isOutlineCollapsed ? 'default' : 'row-resize',
                        flexShrink: 0,
                        backgroundColor: 'var(--border-subtle)',
                        transition: 'background 0.15s',
                      }}
                      className="resize-divider"
                    />

                    {/* Outline Section */}
                    <div
                      style={{
                        height: isOutlineCollapsed ? '32px' : `${outlinePanelHeight}px`,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Outline Header */}
                      <div
                        style={{
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 10px',
                          borderBottom: isOutlineCollapsed ? 'none' : '1px solid var(--border-subtle)',
                          flexShrink: 0,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                        onClick={() => setIsOutlineCollapsed((c) => !c)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <ChevronRight
                            size={12}
                            color="var(--text-muted)"
                            style={{
                              transform: isOutlineCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                              transition: 'transform 0.15s ease',
                              flexShrink: 0,
                            }}
                          />
                          <ListTree size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {language === 'id' ? 'Outline' : 'Outline'}
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {documentHeadings.length > 0 ? documentHeadings.length : ''}
                        </span>
                      </div>

                      {/* Outline Body */}
                      {!isOutlineCollapsed && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
                          {documentHeadings.length === 0 ? (
                            <div style={{ padding: '12px 6px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              {language === 'id'
                                ? 'Gunakan # atau \\section{} untuk membuat struktur.'
                                : 'Use # or \\section{} headings to build structure.'}
                            </div>
                          ) : (
                            documentHeadings.map((h, idx) => (
                              <div
                                key={idx}
                                onClick={() => { jumpToLine(h.line); scrollPreviewToHeading(h.text); }}
                                className="clickable-pill"
                                style={{
                                  padding: '4px 6px',
                                  paddingLeft: `${6 + (h.level - 1) * 10}px`,
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: h.level === 1 ? '11.5px' : '11px',
                                  fontWeight: h.level === 1 ? 650 : h.level === 2 ? 550 : 400,
                                  color: h.level === 1 ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                  marginBottom: '1px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '8.5px',
                                    padding: '1px 3px',
                                    borderRadius: '3px',
                                    backgroundColor: 'var(--bg-subtle)',
                                    color: 'var(--text-muted)',
                                    fontFamily: 'monospace',
                                    flexShrink: 0,
                                  }}
                                >
                                  H{h.level}
                                </span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {h.text}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* TAB 2: SEARCH & REPLACE */}
                {activeDrawerTab === 'search' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div
                      style={{
                        height: '48px',
                        boxSizing: 'border-box',
                        padding: '0 12px',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {language === 'id' ? 'Pencarian Dokumen' : 'Search & Replace'}
                      </span>
                      <button
                        type="button"
                        onClick={toggleSidebar}
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '5px',
                          backgroundColor: 'transparent',
                          border: '1px solid transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        className="hide-on-drawer hover-subtle"
                        title={language === 'id' ? 'Tutup Panel' : 'Collapse Panel'}
                      >
                        <PanelLeftClose size={13} />
                      </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                      {/* Find Input */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          height: '30px',
                          boxSizing: 'border-box',
                          marginBottom: '6px',
                        }}
                      >
                        <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <input
                          type="text"
                          placeholder={language === 'id' ? 'Cari kata atau rumus...' : 'Find text or math...'}
                          value={docSearchQuery}
                          onChange={(e) => setDocSearchQuery(e.target.value)}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '11.5px',
                            color: 'var(--text-primary)',
                          }}
                        />
                        {docSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDocSearchQuery('')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Replace Input */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          height: '30px',
                          boxSizing: 'border-box',
                          marginBottom: '8px',
                        }}
                      >
                        <Replace size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <input
                          type="text"
                          placeholder={language === 'id' ? 'Ganti dengan...' : 'Replace with...'}
                          value={docReplaceQuery}
                          onChange={(e) => setDocReplaceQuery(e.target.value)}
                          style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '11.5px',
                            color: 'var(--text-primary)',
                          }}
                        />
                        {docReplaceQuery && (
                          <button
                            type="button"
                            onClick={() => setDocReplaceQuery('')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Search Options & Action */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isCaseSensitive}
                            onChange={(e) => setIsCaseSensitive(e.target.checked)}
                          />
                          <span>Case Sensitive</span>
                        </label>

                        {searchMatches.length > 0 && (
                          <button
                            type="button"
                            onClick={handleReplaceAll}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--brand-primary)',
                              border: 'none',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {language === 'id' ? 'Ganti Semua' : 'Replace All'}
                          </button>
                        )}
                      </div>

                      {/* Matches Stats */}
                      {docSearchQuery && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                          {searchMatches.length > 0
                            ? `${searchMatches.length} ${language === 'id' ? 'hasil ditemukan' : 'matches found'}`
                            : (language === 'id' ? 'Tidak ada hasil ditemukan' : 'No matches found')}
                        </div>
                      )}

                      {/* Match List */}
                      <div style={{ flex: 1, overflowY: 'auto' }}>
                        {searchMatches.map((m, idx) => (
                          <div
                            key={idx}
                            onClick={() => jumpToLine(m.line)}
                            className="clickable-pill"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-subtle)',
                              marginBottom: '4px',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '10px', marginBottom: '2px' }}>
                              <span>Baris {m.line + 1}</span>
                              <CornerDownLeft size={10} />
                            </div>
                            <div style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.lineText}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: REVIEW PANEL (Overleaf-style) */}
                {activeDrawerTab === 'review' && (() => {
                  const allComments = activeDoc?.comments ?? [];
                  const filteredComments = allComments.filter(c =>
                    commentFilter === 'all' ? true :
                    commentFilter === 'resolved' ? c.resolved :
                    !c.resolved
                  );

                  const handleSubmitComment = () => {
                    if (!draftCommentText.trim() || !activeDoc) return;
                    addComment(activeDoc.id, {
                      docId: activeDoc.id,
                      subFileId: activeDoc.activeFileId || null,
                      selectedText: draftSelectedText,
                      fromLine: draftFromLine,
                      toLine: draftToLine,
                      authorName: user?.user_metadata?.full_name || user?.email || 'You',
                      authorEmail: user?.email,
                      content: draftCommentText.trim(),
                    });
                    setDraftCommentText('');
                    setIsAddingComment(false);
                  };

                  const handleSubmitReply = (commentId: string) => {
                    if (!replyDraftText.trim() || !activeDoc) return;
                    addCommentReply(activeDoc.id, commentId, {
                      authorName: user?.user_metadata?.full_name || user?.email || 'You',
                      authorEmail: user?.email,
                      content: replyDraftText.trim(),
                    });
                    setReplyDraftText('');
                    setReplyingCommentId(null);
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}>
                      {/* Review Panel Header */}
                      <div style={{
                        padding: '10px 12px 8px',
                        borderBottom: '1px solid var(--border-subtle)',
                        flexShrink: 0,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                            {language === 'id' ? 'Review & Komentar' : 'Review & Comments'}
                          </span>
                          <button
                            type="button"
                            onClick={handleTriggerAddComment}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--brand-primary)',
                              color: '#fff',
                              border: 'none',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'opacity 0.15s',
                            }}
                            title={language === 'id' ? 'Tambah Komentar (Ctrl+Shift+C)' : 'Add Comment (Ctrl+Shift+C)'}
                          >
                            <MessageSquarePlus size={11} />
                            {language === 'id' ? 'Komentar' : 'Comment'}
                          </button>
                        </div>
                        {/* Filter tabs */}
                        <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', padding: '2px' }}>
                          {(['unresolved', 'resolved', 'all'] as const).map(f => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setCommentFilter(f)}
                              style={{
                                flex: 1,
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '10px',
                                fontWeight: commentFilter === f ? 700 : 400,
                                backgroundColor: commentFilter === f ? 'var(--bg-surface)' : 'transparent',
                                color: commentFilter === f ? 'var(--text-primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.1s',
                                boxShadow: commentFilter === f ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                              }}
                            >
                              {f === 'unresolved' ? (language === 'id' ? 'Aktif' : 'Open') :
                               f === 'resolved'   ? (language === 'id' ? 'Selesai' : 'Resolved') :
                               (language === 'id' ? 'Semua' : 'All')}
                              {f !== 'all' && (
                                <span style={{ marginLeft: '3px', opacity: 0.7 }}>
                                  ({allComments.filter(c => f === 'resolved' ? c.resolved : !c.resolved).length})
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* New Comment Draft Form */}
                      {isAddingComment && (
                        <div style={{
                          margin: '10px 10px 0',
                          border: '1.5px solid var(--brand-primary)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface)',
                          padding: '10px',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,115,234,0.1)',
                        }}>
                          {draftSelectedText && (
                            <div style={{
                              fontSize: '10.5px',
                              color: 'var(--text-muted)',
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              borderLeft: '3px solid #F59E0B',
                              borderRadius: '4px',
                              padding: '4px 6px',
                              marginBottom: '8px',
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              "{draftSelectedText.substring(0, 60)}{draftSelectedText.length > 60 ? '…' : ''}"
                            </div>
                          )}
                          {!draftSelectedText && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                              {language === 'id' ? `Baris ${draftFromLine}` : `Line ${draftFromLine}`}
                            </div>
                          )}
                          <textarea
                            autoFocus
                            value={draftCommentText}
                            onChange={e => setDraftCommentText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmitComment(); }
                              if (e.key === 'Escape') { setIsAddingComment(false); setDraftCommentText(''); }
                            }}
                            placeholder={language === 'id' ? 'Tambah komentar atau @ mention...' : 'Add comment or @ mention...'}
                            style={{
                              width: '100%',
                              minHeight: '60px',
                              resize: 'vertical',
                              backgroundColor: 'var(--bg-main)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              fontSize: '11.5px',
                              fontFamily: 'inherit',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '7px' }}>
                            <button
                              type="button"
                              onClick={() => { setIsAddingComment(false); setDraftCommentText(''); }}
                              style={{ padding: '4px 10px', borderRadius: '5px', border: '1px solid var(--border-subtle)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
                            >
                              {language === 'id' ? 'Batal' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={handleSubmitComment}
                              disabled={!draftCommentText.trim()}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '5px',
                                border: 'none',
                                backgroundColor: draftCommentText.trim() ? 'var(--brand-primary)' : 'var(--border-subtle)',
                                color: draftCommentText.trim() ? '#fff' : 'var(--text-muted)',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: draftCommentText.trim() ? 'pointer' : 'default',
                                transition: 'all 0.15s',
                              }}
                            >
                              {language === 'id' ? 'Kirim' : 'Comment'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Comment List */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 16px' }}>
                        {filteredComments.length === 0 ? (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingTop: '40px',
                            gap: '10px',
                            color: 'var(--text-muted)',
                          }}>
                            <MessageSquare size={28} style={{ opacity: 0.3 }} />
                            <span style={{ fontSize: '11.5px', textAlign: 'center', opacity: 0.6 }}>
                              {commentFilter === 'resolved'
                                ? (language === 'id' ? 'Belum ada komentar selesai' : 'No resolved comments')
                                : (language === 'id' ? 'Belum ada komentar\nKlik teks di editor lalu tekan Ctrl+Shift+C' : 'No comments yet\nSelect text in editor and press Ctrl+Shift+C')}
                            </span>
                          </div>
                        ) : (
                          filteredComments.map((comment) => {
                            const isHighlighted = activeHighlightedCommentId === comment.id;
                            const isReplying = replyingCommentId === comment.id;
                            const timeAgo = (() => {
                              const diff = Date.now() - comment.createdAt;
                              if (diff < 60000) return language === 'id' ? 'Baru saja' : 'Just now';
                              if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
                              if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
                              return new Date(comment.createdAt).toLocaleDateString();
                            })();

                            return (
                              <div
                                key={comment.id}
                                onClick={() => {
                                  setActiveHighlightedCommentId(isHighlighted ? null : comment.id);
                                  if (!isHighlighted && textareaRef.current) {
                                    jumpToLine(comment.fromLine ? comment.fromLine - 1 : 0);
                                  }
                                }}
                                style={{
                                  marginBottom: '8px',
                                  borderRadius: '8px',
                                  border: `1.5px solid ${isHighlighted ? 'rgba(245, 158, 11, 0.6)' : (comment.resolved ? 'var(--border-subtle)' : 'var(--border-strong)')}`,
                                  backgroundColor: isHighlighted ? 'rgba(245, 158, 11, 0.06)' : (comment.resolved ? 'var(--bg-subtle)' : 'var(--bg-surface)'),
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  opacity: comment.resolved ? 0.65 : 1,
                                }}
                              >
                                <div style={{ padding: '8px 10px' }}>
                                  {/* Comment header */}
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '5px', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                                      <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        backgroundColor: 'var(--brand-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0,
                                      }}>
                                        {(comment.authorName || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {comment.authorName}
                                        </div>
                                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{timeAgo}{comment.fromLine ? ` · L${comment.fromLine}` : ''}</div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                      {/* Resolve/Unresolve */}
                                      <button
                                        type="button"
                                        onClick={() => activeDoc && resolveComment(activeDoc.id, comment.id, !comment.resolved)}
                                        title={comment.resolved ? (language === 'id' ? 'Buka kembali' : 'Unresolve') : (language === 'id' ? 'Tandai selesai' : 'Resolve')}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: comment.resolved ? 'var(--accent-success)' : 'var(--text-muted)', borderRadius: '4px' }}
                                      >
                                        <CheckSquare size={12} />
                                      </button>
                                      {/* Delete */}
                                      <button
                                        type="button"
                                        onClick={() => { if (activeDoc && confirm('Delete comment?')) deleteComment(activeDoc.id, comment.id); }}
                                        title={language === 'id' ? 'Hapus' : 'Delete'}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)', borderRadius: '4px' }}
                                      >
                                        <X size={11} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Selected text preview */}
                                  {comment.selectedText && (
                                    <div style={{
                                      fontSize: '10.5px',
                                      fontFamily: 'monospace',
                                      color: 'var(--text-muted)',
                                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                      borderLeft: '2px solid #F59E0B',
                                      padding: '3px 6px',
                                      borderRadius: '3px',
                                      marginBottom: '5px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}>
                                      "{comment.selectedText.substring(0, 50)}{comment.selectedText.length > 50 ? '…' : ''}"
                                    </div>
                                  )}

                                  {/* Comment body */}
                                  <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: '1.5', wordBreak: 'break-word' }}>
                                    {comment.content}
                                  </div>
                                </div>

                                {/* Replies */}
                                {(comment.replies || []).length > 0 && (
                                  <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {(comment.replies || []).map(reply => (
                                      <div key={reply.id} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                        <div style={{
                                          width: '16px', height: '16px', borderRadius: '50%',
                                          backgroundColor: '#10B981',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: '8px', fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: '1px',
                                        }}>
                                          {(reply.authorName || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{reply.authorName}</div>
                                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{reply.content}</div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); if (activeDoc) deleteCommentReply(activeDoc.id, comment.id, reply.id); }}
                                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px', color: 'var(--text-muted)', flexShrink: 0 }}
                                        >
                                          <X size={9} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Reply area */}
                                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '6px 10px' }} onClick={e => e.stopPropagation()}>
                                  {isReplying ? (
                                    <div>
                                      <textarea
                                        autoFocus
                                        value={replyDraftText}
                                        onChange={e => setReplyDraftText(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmitReply(comment.id); }
                                          if (e.key === 'Escape') { setReplyingCommentId(null); setReplyDraftText(''); }
                                        }}
                                        placeholder={language === 'id' ? 'Balas...' : 'Reply...'}
                                        style={{
                                          width: '100%', minHeight: '44px', resize: 'vertical',
                                          backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
                                          border: '1px solid var(--border-subtle)', borderRadius: '5px',
                                          padding: '5px 7px', fontSize: '11px', fontFamily: 'inherit',
                                          outline: 'none', boxSizing: 'border-box', marginBottom: '5px',
                                        }}
                                      />
                                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                                        <button
                                          type="button"
                                          onClick={() => { setReplyingCommentId(null); setReplyDraftText(''); }}
                                          style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer' }}
                                        >
                                          {language === 'id' ? 'Batal' : 'Cancel'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSubmitReply(comment.id)}
                                          disabled={!replyDraftText.trim()}
                                          style={{
                                            padding: '3px 10px', borderRadius: '4px', border: 'none',
                                            backgroundColor: replyDraftText.trim() ? 'var(--brand-primary)' : 'var(--border-subtle)',
                                            color: replyDraftText.trim() ? '#fff' : 'var(--text-muted)',
                                            fontSize: '10px', fontWeight: 600,
                                            cursor: replyDraftText.trim() ? 'pointer' : 'default',
                                          }}
                                        >
                                          {language === 'id' ? 'Balas' : 'Reply'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => { setReplyingCommentId(comment.id); setReplyDraftText(''); }}
                                      style={{
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', fontSize: '10px',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '1px 0',
                                      }}
                                    >
                                      <MessageCircle size={10} />
                                      {language === 'id' ? 'Balas' : 'Reply'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 5: AI ASSISTANT / CO-AUTHOR */}
                {activeDrawerTab === 'ai' && (
                  <DocsCopilotSidebar
                    isEmbedded
                    onInsertText={(text) => insertShortcut(text, '', '')}
                    onClose={() => toggleSidebar()}
                  />
                )}
              </aside>

              {/* Resize handle: Left Drawer ↔ Editor */}
              <div
                onMouseDown={handleLeftDrawerDragStart}
                style={{
                  width: '5px',
                  cursor: 'col-resize',
                  flexShrink: 0,
                  backgroundColor: 'var(--border-subtle)',
                  transition: 'background 0.15s',
                }}
                className="resize-divider hide-on-drawer"
              />
            </>
          )}

          {/* 2. Right Main Workspace Area (Editor Area) */}
          <div style={{ flex: 1, height: '100%', display: 'flex', overflow: 'hidden', minWidth: 0 }}>
          {/* 2. Main Editor Content: Spreadsheet vs Slide Deck vs Markdown/LaTeX Split */}
          {activeDoc?.format === 'sheet' ? (
            <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
              <DocsSpreadsheetView />
            </div>
          ) : activeDoc?.format === 'slide' ? (
            <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
              <DocsSlideView />
            </div>
          ) : (
            <>
              {/* Center: Source Code Editor */}
              {(viewMode === 'split' || viewMode === 'code') && (
                <div
                  ref={editorContainerRef}
                  style={{
                    flex: editorWidth > 0 ? `0 0 ${editorWidth}px` : 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--bg-main)',
                    borderRight: 'none',
                    minWidth: 0,
                  }}
                >
                  {/* Overleaf-Style File Tabs */}
                <div
                  style={{
                    height: '34px',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    flexShrink: 0,
                    scrollbarWidth: 'none',
                  }}
                  className="hide-scrollbar"
                >
                  {docFiles.length > 0 ? docFiles.map((file) => {
                    const isActive = file.id === activeSubFile?.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => setActiveFileId(activeDoc!.id, file.id)}
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
                        <FileText size={11} color={isActive ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {file.name}
                        </span>
                        {file.isMain && (
                          <span style={{
                            display: 'inline-block',
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            flexShrink: 0,
                          }} title="Entrypoint" />
                        )}
                      </button>
                    );
                  }) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 12px', height: '33px', borderTop: '2px solid var(--brand-primary)', backgroundColor: 'var(--bg-main)', borderRight: '1px solid var(--border-subtle)', fontSize: '11.5px', color: 'var(--text-primary)', fontWeight: 650, flexShrink: 0 }}>
                      <FileText size={11} color="var(--brand-primary)" />
                      <span>{activeDoc?.title || 'main.md'}</span>
                    </div>
                  )}
                </div>

                {/* Editor Toolbar (Overleaf-style) */}
                <div
                  style={{
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
                  }}
                >
                  {/* Undo / Redo */}
                  <button type="button" onClick={() => { textareaRef.current?.focus(); document.execCommand('undo'); }} style={toolbarBtnStyle} title="Undo (Ctrl+Z)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M3 13C5.5 6.5 12 5 17 8s6 9 2 13"/></svg>
                  </button>
                  <button type="button" onClick={() => { textareaRef.current?.focus(); document.execCommand('redo'); }} style={toolbarBtnStyle} title="Redo (Ctrl+Y)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M21 13C18.5 6.5 12 5 7 8S1 17 5 21"/></svg>
                  </button>

                  <div style={separatorStyle} />

                  {/* Overleaf TT Paragraph Style Popover */}
                  <div style={{ position: 'relative', display: 'inline-flex' }}>
                    <button
                      ref={paragraphStyleButtonRef}
                      type="button"
                      onClick={toggleParagraphStyleMenu}
                      style={{
                        ...toolbarBtnStyle,
                        padding: '1px 4px',
                        gap: '2px',
                        backgroundColor: isParagraphStyleMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                        borderColor: isParagraphStyleMenuOpen ? 'var(--border-subtle)' : 'transparent',
                      }}
                      title="Gaya Paragraf (Section / Heading)"
                    >
                      <span style={{ fontFamily: 'serif', fontWeight: 800, fontSize: '12px', lineHeight: 1, letterSpacing: '-0.5px' }}>
                        T<span style={{ fontSize: '9.5px' }}>T</span>
                      </span>
                      <ChevronDown size={10} style={{ opacity: 0.7, transform: isParagraphStyleMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                    </button>

                    {isParagraphStyleMenuOpen && paragraphMenuPos && typeof document !== 'undefined' && createPortal(
                      <div
                        ref={paragraphStyleMenuRef}
                        className="animate-fade-in"
                        style={{
                          position: 'fixed',
                          top: `${paragraphMenuPos.top}px`,
                          left: `${paragraphMenuPos.left}px`,
                          zIndex: 99999999,
                          minWidth: '150px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
                          padding: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleApplyParagraphStyle('normal')}
                          style={{
                            display: 'flex', alignItems: 'center', width: '100%',
                            padding: '6px 10px', borderRadius: '5px', border: 'none',
                            backgroundColor: 'transparent', color: 'var(--text-primary)',
                            fontSize: '12.5px', fontWeight: 400, cursor: 'pointer', textAlign: 'left',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Normal text
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyParagraphStyle('section')}
                          style={{
                            display: 'flex', alignItems: 'center', width: '100%',
                            padding: '6px 10px', borderRadius: '5px', border: 'none',
                            backgroundColor: 'transparent', color: 'var(--text-primary)',
                            fontSize: '15px', fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Section
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyParagraphStyle('subsection')}
                          style={{
                            display: 'flex', alignItems: 'center', width: '100%',
                            padding: '5px 10px', borderRadius: '5px', border: 'none',
                            backgroundColor: 'transparent', color: 'var(--text-primary)',
                            fontSize: '14px', fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Subsection
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyParagraphStyle('subsubsection')}
                          style={{
                            display: 'flex', alignItems: 'center', width: '100%',
                            padding: '5px 10px', borderRadius: '5px', border: 'none',
                            backgroundColor: 'transparent', color: 'var(--text-primary)',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Subsubsection
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyParagraphStyle('paragraph')}
                          style={{
                            display: 'flex', alignItems: 'center', width: '100%',
                            padding: '5px 10px', borderRadius: '5px', border: 'none',
                            backgroundColor: 'transparent', color: 'var(--text-primary)',
                            fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Paragraph
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyParagraphStyle('subparagraph')}
                          style={{
                            display: 'flex', alignItems: 'center', width: '100%',
                            padding: '4px 10px', borderRadius: '5px', border: 'none',
                            backgroundColor: 'transparent', color: 'var(--text-primary)',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Subparagraph
                        </button>
                      </div>,
                      document.body
                    )}
                  </div>

                  <div style={separatorStyle} />

                  {/* Bold */}
                  <button type="button" onClick={() => insertShortcut('**', '**', 'teks tebal')} style={toolbarBtnStyle} title="Tebal (Ctrl+B)">
                    <Bold size={12} />
                  </button>
                  {/* Italic */}
                  <button type="button" onClick={() => insertShortcut('*', '*', 'teks miring')} style={toolbarBtnStyle} title="Miring (Ctrl+I)">
                    <Italic size={12} />
                  </button>
                  {/* Strikethrough */}
                  <button type="button" onClick={() => insertShortcut('~~', '~~', 'teks coret')} style={toolbarBtnStyle} title="Coret (Strikethrough)">
                    <span style={{ fontSize: '11px', fontWeight: 700, textDecoration: 'line-through' }}>S</span>
                  </button>
                  {/* Underline */}
                  <button type="button" onClick={() => insertShortcut('<u>', '</u>', 'teks garis bawah')} style={toolbarBtnStyle} title="Garis Bawah (Underline)">
                    <span style={{ fontSize: '11px', fontWeight: 700, textDecoration: 'underline' }}>U</span>
                  </button>
                  {/* Inline Code */}
                  <button type="button" onClick={() => insertShortcut('`', '`', 'kode')} style={toolbarBtnStyle} title="Kode Inline">
                    <Code2 size={12} />
                  </button>

                  <div style={separatorStyle} />

                  {/* Math inline */}
                  <button type="button" onClick={() => insertShortcut('$', '$', 'E = mc^2')} style={toolbarBtnStyle} title="Rumus Matematika Inline ($...$)">
                    <span style={{ fontSize: '10.5px', fontWeight: 700 }}>$x$</span>
                  </button>
                  {/* Math block */}
                  <button type="button" onClick={() => insertShortcut('\n$$\n', '\n$$\n', '\\int_{0}^{\\infty} f(x) dx = 1')} style={toolbarBtnStyle} title="Persamaan Matematika Block ($$...$$)">
                    <Sigma size={12} color="#8B5CF6" />
                  </button>
                  {/* Greek & LaTeX Symbols Popover (Overleaf Omega) */}
                  <div style={{ position: 'relative', display: 'inline-flex' }}>
                    <button
                      ref={symbolButtonRef}
                      type="button"
                      onClick={toggleSymbolMenu}
                      style={{
                        ...toolbarBtnStyle,
                        padding: '1px 3px',
                        gap: '2px',
                        backgroundColor: isSymbolMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                        borderColor: isSymbolMenuOpen ? 'var(--border-subtle)' : 'transparent',
                      }}
                      title="Simbol Yunani & Matematika (\alpha, \beta, \Omega...)"
                    >
                      <span style={{ fontFamily: 'serif', fontWeight: 700, fontSize: '12px', lineHeight: 1 }}>Ω</span>
                      <ChevronDown size={10} style={{ opacity: 0.7, transform: isSymbolMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                    </button>

                    {isSymbolMenuOpen && symbolMenuPos && typeof document !== 'undefined' && createPortal(
                      <div
                        ref={symbolMenuRef}
                        className="animate-fade-in"
                        style={{
                          position: 'fixed',
                          top: `${symbolMenuPos.top}px`,
                          left: `${symbolMenuPos.left}px`,
                          zIndex: 99999999,
                          width: '210px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
                          padding: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {/* Search Input */}
                        <div style={{ padding: '0 2px 4px' }}>
                          <input
                            type="text"
                            value={symbolSearchQuery}
                            onChange={e => setSymbolSearchQuery(e.target.value)}
                            placeholder={language === 'id' ? 'Cari simbol...' : 'Search symbols...'}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              fontSize: '11.5px',
                              backgroundColor: 'var(--bg-subtle)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '5px',
                              color: 'var(--text-primary)',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* Symbols Scrollable List */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          {[
                            { symbol: 'α', name: 'alpha', cmd: '\\alpha' },
                            { symbol: 'β', name: 'beta', cmd: '\\beta' },
                            { symbol: 'γ', name: 'gamma', cmd: '\\gamma' },
                            { symbol: 'δ', name: 'delta', cmd: '\\delta' },
                            { symbol: 'ε', name: 'epsilon', cmd: '\\varepsilon' },
                            { symbol: 'θ', name: 'theta', cmd: '\\theta' },
                            { symbol: 'λ', name: 'lambda', cmd: '\\lambda' },
                            { symbol: 'μ', name: 'mu', cmd: '\\mu' },
                            { symbol: 'π', name: 'pi', cmd: '\\pi' },
                            { symbol: 'σ', name: 'sigma', cmd: '\\sigma' },
                            { symbol: 'ω', name: 'omega', cmd: '\\omega' },
                            { symbol: 'Δ', name: 'Delta', cmd: '\\Delta' },
                            { symbol: 'Ω', name: 'Omega', cmd: '\\Omega' },
                            { symbol: '∞', name: 'infty', cmd: '\\infty' },
                            { symbol: '≈', name: 'approx', cmd: '\\approx' },
                            { symbol: '≠', name: 'neq', cmd: '\\neq' },
                            { symbol: '≤', name: 'leq', cmd: '\\leq' },
                            { symbol: '≥', name: 'geq', cmd: '\\geq' },
                            { symbol: '±', name: 'pm', cmd: '\\pm' },
                            { symbol: '×', name: 'times', cmd: '\\times' },
                            { symbol: '∑', name: 'sum', cmd: '\\sum_{i=1}^{n}' },
                            { symbol: '∫', name: 'integral', cmd: '\\int_{a}^{b}' },
                            { symbol: '∂', name: 'partial', cmd: '\\partial' },
                            { symbol: '∇', name: 'nabla', cmd: '\\nabla' },
                            { symbol: '∈', name: 'in', cmd: '\\in' },
                            { symbol: '⊂', name: 'subset', cmd: '\\subset' },
                            { symbol: '∀', name: 'forall', cmd: '\\forall' },
                            { symbol: '∃', name: 'exists', cmd: '\\exists' },
                          ]
                            .filter(s =>
                              s.name.toLowerCase().includes(symbolSearchQuery.toLowerCase()) ||
                              s.symbol.includes(symbolSearchQuery) ||
                              s.cmd.toLowerCase().includes(symbolSearchQuery.toLowerCase())
                            )
                            .map((s, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  insertShortcut(s.cmd, '', '');
                                  setIsSymbolMenuOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  padding: '5px 8px',
                                  borderRadius: '5px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  transition: 'background 0.12s ease',
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <span style={{ fontFamily: 'serif', fontSize: '13px', fontWeight: 600, width: '24px', textAlign: 'center' }}>
                                  {s.symbol}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  {s.cmd}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>,
                      document.body
                    )}
                  </div>

                  <div style={separatorStyle} />

                  {/* Link */}
                  <button type="button" onClick={() => insertShortcut('[', '](https://)', 'teks link')} style={toolbarBtnStyle} title={language === 'id' ? 'Sisipkan Tautan' : 'Insert Link'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </button>
                  {/* Comment */}
                  <button type="button"
                    onClick={() => {
                      const isLatex = activeDoc?.format === 'latex';
                      insertShortcut(isLatex ? '% ' : '<!-- ', isLatex ? '' : ' -->', 'komentar');
                    }}
                    style={toolbarBtnStyle}
                    title={language === 'id' ? 'Tambah Komentar' : 'Add Comment'}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="12" y1="7" x2="12" y2="13"/></svg>
                  </button>
                  {/* Label / Tag Cross-Reference */}
                  <button type="button"
                    onClick={() => {
                      const isLatex = activeDoc?.format === 'latex';
                      insertShortcut(isLatex ? '\\label{' : '<a id="', isLatex ? '}' : '"></a>', 'sec:intro');
                    }}
                    style={toolbarBtnStyle}
                    title={language === 'id' ? 'Sisipkan Label / Referensi Silang' : 'Insert Label / Cross-Ref'}
                  >
                    <Tag size={12} />
                  </button>
                  {/* Citation / Bibliography */}
                  <button type="button"
                    onClick={() => {
                      const isLatex = activeDoc?.format === 'latex';
                      insertShortcut(isLatex ? '\\cite{' : '[@', isLatex ? '}' : ']', 'author2024');
                    }}
                    style={toolbarBtnStyle}
                    title={language === 'id' ? 'Sisipkan Sitasi / Referensi' : 'Insert Citation (\\cite)'}
                  >
                    <BookMarked size={12} color="#F59E0B" />
                  </button>
                  {/* Image */}
                  <button type="button"
                    onClick={() => {
                      const isLatex = activeDoc?.format === 'latex';
                      if (isLatex) {
                        insertShortcut('\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.8\\linewidth]{', '}\n  \\caption{Deskripsi gambar}\n  \\label{fig:contoh}\n\\end{figure}\n', 'gambar.png');
                      } else {
                        insertShortcut('![', '](url-gambar)', 'alt text');
                      }
                    }}
                    style={toolbarBtnStyle}
                    title={language === 'id' ? 'Sisipkan Gambar / Figure' : 'Insert Image / Figure'}
                  >
                    <ImageIcon size={12} />
                  </button>
                  {/* Table */}
                  <button type="button"
                    onClick={() => {
                      const isLatex = activeDoc?.format === 'latex';
                      if (isLatex) {
                        insertShortcut('\\begin{table}[htbp]\n  \\centering\n  \\begin{tabular}{|c|c|c|}\n    \\hline\n    Kolom 1 & Kolom 2 & Kolom 3 \\\\\n    \\hline\n    Data 1 & Data 2 & Data 3 \\\\\n    \\hline\n  \\end{tabular}\n  \\caption{Tabel contoh}\n  \\label{tab:contoh}\n\\end{table}\n');
                      } else {
                        insertShortcut('\n| Kolom 1 | Kolom 2 | Kolom 3 |\n| :--- | :--- | :--- |\n| Baris 1 | Data A | Data B |\n');
                      }
                    }}
                    style={toolbarBtnStyle}
                    title={language === 'id' ? 'Sisipkan Tabel' : 'Insert Table'}
                  >
                    <TableIcon size={12} color="#10B981" />
                  </button>
                  {/* Mermaid */}
                  <button type="button"
                    onClick={() => insertShortcut('\n```mermaid\ngraph TD\n    A[Mulai] --> B[Proses]\n    B --> C{Keputusan?}\n```\n')}
                    style={toolbarBtnStyle} title="Diagram Mermaid">
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0073ea' }}>~</span>
                  </button>

                  <div style={separatorStyle} />

                  {/* Overleaf List Selector Button with Horizontal Popover */}
                  <div style={{ position: 'relative', display: 'inline-flex' }}>
                    <button
                      ref={listButtonRef}
                      type="button"
                      onClick={toggleListMenu}
                      style={{
                        ...toolbarBtnStyle,
                        backgroundColor: isListMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                        borderColor: isListMenuOpen ? 'var(--border-subtle)' : 'transparent',
                      }}
                      title={language === 'id' ? 'Daftar Poin & Bernomor' : 'Bullet & Numbered Lists'}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
                    </button>

                    {isListMenuOpen && listMenuPos && typeof document !== 'undefined' && createPortal(
                      <div
                        ref={listMenuRef}
                        className="animate-fade-in"
                        style={{
                          position: 'fixed',
                          top: `${listMenuPos.top}px`,
                          left: `${listMenuPos.left - 20}px`,
                          zIndex: 99999999,
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {/* Bullet List Option */}
                        <button
                          type="button"
                          onClick={() => {
                            const isLatex = activeDoc?.format === 'latex';
                            if (isLatex) {
                              insertShortcut('\\begin{itemize}\n  \\item ', '\n\\end{itemize}\n', 'item poin');
                            } else {
                              insertShortcut('\n- ', '', 'item poin');
                            }
                            setIsListMenuOpen(false);
                          }}
                          style={{
                            width: '32px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'background 0.12s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          title={language === 'id' ? 'Daftar Poin (Bullet)' : 'Bullet List'}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.2" fill="currentColor"/><circle cx="4" cy="12" r="1.2" fill="currentColor"/><circle cx="4" cy="18" r="1.2" fill="currentColor"/></svg>
                        </button>

                        {/* Numbered List Option */}
                        <button
                          type="button"
                          onClick={() => {
                            const isLatex = activeDoc?.format === 'latex';
                            if (isLatex) {
                              insertShortcut('\\begin{enumerate}\n  \\item ', '\n\\end{enumerate}\n', 'item pertama');
                            } else {
                              insertShortcut('\n1. ', '', 'item pertama');
                            }
                            setIsListMenuOpen(false);
                          }}
                          style={{
                            width: '32px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'background 0.12s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          title={language === 'id' ? 'Daftar Bernomor (Numbered)' : 'Numbered List'}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
                        </button>
                      </div>,
                      document.body
                    )}
                  </div>
                  {/* Blockquote */}
                  <button type="button" onClick={() => insertShortcut('\n> ', '', 'kutipan')} style={toolbarBtnStyle} title="Blockquote / Kutipan">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                  </button>
                  {/* Horizontal Rule */}
                  <button type="button" onClick={() => insertShortcut('\n---\n')} style={toolbarBtnStyle} title={language === 'id' ? 'Garis Horizontal' : 'Horizontal Rule'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="2" y1="12" x2="22" y2="12"/></svg>
                  </button>
                  {/* Code Block */}
                  <button type="button" onClick={() => insertShortcut('\n```\n', '\n```\n', 'kode di sini')} style={toolbarBtnStyle} title={language === 'id' ? 'Blok Kode' : 'Code Block'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  </button>

                  <div style={separatorStyle} />

                  {/* Add Review Comment Button (Overleaf-style) */}
                  <button
                    type="button"
                    onClick={handleTriggerAddComment}
                    style={{
                      ...toolbarBtnStyle,
                      color: '#F59E0B',
                      gap: '3px',
                    }}
                    title={language === 'id' ? 'Tambah Komentar Review (Ctrl+Shift+C)' : 'Add Review Comment (Ctrl+Shift+C)'}
                  >
                    <MessageSquarePlus size={12} />
                  </button>
                </div>

                {/* Code Textarea for Active Subfile with line wrapping */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  {/* Overleaf-style comment highlight overlay: highlights commented lines in amber */}
                  {(activeDoc?.comments ?? []).filter(c => !c.resolved && c.fromLine).map(comment => {
                    const lineHeight = 20.8; // 13px * 1.6 lineHeight
                    const topPx = ((comment.fromLine ?? 1) - 1) * lineHeight + 16; // 16px top padding
                    const heightPx = Math.max(1, ((comment.toLine ?? comment.fromLine ?? 1) - (comment.fromLine ?? 1) + 1)) * lineHeight;
                    return (
                      <div
                        key={comment.id}
                        onClick={() => {
                          setActiveHighlightedCommentId(comment.id);
                          if (!isSidebarOpen) toggleSidebar();
                          setActiveDrawerTab('review');
                        }}
                        title={comment.content}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                          backgroundColor: activeHighlightedCommentId === comment.id
                            ? 'rgba(245, 158, 11, 0.22)'
                            : 'rgba(245, 158, 11, 0.10)',
                          borderLeft: `3px solid ${activeHighlightedCommentId === comment.id ? '#F59E0B' : 'rgba(245,158,11,0.5)'}`,
                          pointerEvents: 'auto',
                          cursor: 'pointer',
                          zIndex: 1,
                          transition: 'background 0.15s',
                        }}
                      />
                    );
                  })}
                  <textarea
                    ref={textareaRef}
                    value={activeSubFile?.content ?? activeDoc?.content ?? ''}
                    onChange={(e) => {
                      if (activeDoc && activeSubFile) {
                        updateSubFileContent(activeDoc.id, activeSubFile.id, e.target.value);
                      } else if (activeDoc) {
                        updateDocumentContent(activeDoc.id, e.target.value);
                      }
                    }}
                    placeholder={`Ketik isi file ${activeSubFile?.name || 'main.tex'} di sini...`}
                    style={{
                      width: '100%',
                      height: '100%',
                      padding: '16px 20px',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: '13px',
                      lineHeight: '1.6',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Resize handle: Editor ↔ Preview */}
            {viewMode === 'split' && (
              <div
                onMouseDown={handleEditorDragStart}
                style={{
                  width: '5px',
                  cursor: 'col-resize',
                  flexShrink: 0,
                  backgroundColor: 'var(--border-subtle)',
                  transition: 'background 0.15s',
                }}
                className="resize-divider"
              />
            )}

            {/* Right: Live Overleaf-Style Preview */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div
                style={{
                  flex: viewMode === 'split' ? 1.15 : 1,
                  height: '100%',
                  backgroundColor: theme === 'light' ? '#e2e8f0' : '#090d16',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  position: 'relative',
                }}
              >
                {/* Overleaf-Style Compilation & Diagnostics Bar */}
                <div
                  style={{
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
                  }}
                  className="custom-scrollbar"
                >
                  {/* Left: Recompile Split Button + Logs Icon + Download PDF */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                    {/* Recompile Split Button */}
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'stretch' }}>
                      <button
                        type="button"
                        onClick={handleRecompile}
                        style={{
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
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007033')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00843D')}
                        title={language === 'id' ? 'Kompilasi Ulang Dokumen (Ctrl+Enter)' : 'Recompile Document (Ctrl+Enter)'}
                      >
                        <RefreshCw size={11} style={{ animation: isRecompiling ? 'spin 0.5s linear infinite' : 'none' }} />
                        <span>Recompile</span>
                      </button>

                      <button
                        ref={recompileButtonRef}
                        type="button"
                        onClick={toggleRecompileDropdown}
                        style={{
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
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007033')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00843D')}
                        title={language === 'id' ? 'Opsi Kompilasi' : 'Compilation Options'}
                      >
                        <ChevronDown size={12} style={{ transform: isRecompileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                      </button>

                      {/* Recompile Dropdown Popover (Portal to prevent clipping) */}
                      {isRecompileDropdownOpen && recompileDropdownPos && typeof document !== 'undefined' && createPortal(
                        <div
                          ref={recompileDropdownRef}
                          onClick={(e) => e.stopPropagation()}
                          className="animate-fade-in"
                          style={{
                            position: 'fixed',
                            top: `${recompileDropdownPos.top}px`,
                            left: `${recompileDropdownPos.left}px`,
                            zIndex: 999999999,
                            minWidth: '220px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
                            padding: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}
                        >
                          <div
                            onClick={() => setIsAutoCompile(!isAutoCompile)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              color: 'var(--text-primary)',
                            }}
                            className="hover-subtle"
                          >
                            <span style={{ fontWeight: 600 }}>Auto Compile</span>
                            <span style={{
                              fontSize: '10.5px',
                              padding: '1px 6px',
                              borderRadius: '999px',
                              fontWeight: 700,
                              backgroundColor: isAutoCompile ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-subtle)',
                              color: isAutoCompile ? '#10B981' : 'var(--text-muted)',
                            }}>
                              {isAutoCompile ? 'ON' : 'OFF'}
                            </span>
                          </div>

                          <div
                            onClick={() => {
                              handleRecompile();
                              setIsRecompileDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              color: 'var(--text-primary)',
                            }}
                            className="hover-subtle"
                          >
                            <Sparkles size={12} color="var(--brand-primary)" />
                            <span>Fast [draft] compile</span>
                          </div>

                          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

                          <div
                            onClick={() => {
                              handleRecompile();
                              setIsRecompileDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              color: 'var(--text-muted)',
                            }}
                            className="hover-subtle"
                          >
                            <Trash2 size={12} />
                            <span>Clear cached files</span>
                          </div>
                        </div>,
                        document.body
                      )}
                    </div>

                    {/* Logs & Diagnostics Icon Button */}
                    <button
                      type="button"
                      onClick={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
                      style={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '5px',
                        backgroundColor: isLogDrawerOpen ? 'var(--bg-subtle)' : 'transparent',
                        border: '1px solid transparent',
                        color:
                          lintResults.errors.length > 0
                            ? '#EF4444'
                            : lintResults.warnings.length > 0
                            ? '#F59E0B'
                            : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className="hover-subtle"
                      title={
                        lintResults.errors.length > 0
                          ? `${lintResults.errors.length} Error(s) found`
                          : lintResults.warnings.length > 0
                          ? `${lintResults.warnings.length} Warning(s) found`
                          : 'Logs and output files'
                      }
                    >
                      <FileText size={14} />
                      {lintResults.errors.length > 0 ? (
                        <span style={{
                          position: 'absolute',
                          top: '3px',
                          right: '3px',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#EF4444',
                        }} />
                      ) : lintResults.warnings.length > 0 ? (
                        <span style={{
                          position: 'absolute',
                          top: '3px',
                          right: '3px',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#F59E0B',
                        }} />
                      ) : null}
                    </button>

                    {/* Download / Export Options Button & Popover */}
                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                      <button
                        ref={exportButtonRef}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isExportMenuOpen) {
                            setIsExportMenuOpen(false);
                          } else {
                            if (exportButtonRef.current) {
                              const rect = exportButtonRef.current.getBoundingClientRect();
                              let left = rect.left;
                              let top = rect.bottom + 4;
                              setExportMenuPos({ top, left });
                            }
                            setIsExportMenuOpen(true);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '5px',
                          backgroundColor: isExportMenuOpen ? 'var(--bg-subtle)' : 'transparent',
                          border: isExportMenuOpen ? '1px solid var(--border-subtle)' : '1px solid transparent',
                          color: isExportMenuOpen ? 'var(--brand-primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        className="hover-subtle"
                        title={language === 'id' ? 'Unduh / Ekspor Dokumen' : 'Download / Export Document'}
                      >
                        <Download size={14} />
                      </button>

                      {/* Export Dropdown Popover */}
                      {isExportMenuOpen && exportMenuPos && typeof document !== 'undefined' && createPortal(
                        <div
                          ref={exportMenuRef}
                          onClick={(e) => e.stopPropagation()}
                          className="animate-fade-in"
                          style={{
                            position: 'fixed',
                            top: `${exportMenuPos.top}px`,
                            left: `${exportMenuPos.left}px`,
                            width: '200px',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-strong)',
                            boxShadow: 'var(--shadow-xl, 0 12px 30px rgba(0,0,0,0.25))',
                            padding: '4px',
                            zIndex: 999999999,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}
                        >
                          <div style={{ padding: '4px 8px 3px', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {language === 'id' ? 'Opsi Unduh / Ekspor' : 'Download Options'}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleExportPDF();
                              setIsExportMenuOpen(false);
                            }}
                            className="clickable-pill"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              width: '100%',
                              textAlign: 'left',
                            }}
                          >
                            <Printer size={13} color="var(--brand-primary)" />
                            <span>Cetak / Unduh PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleExportMarkdown();
                              setIsExportMenuOpen(false);
                            }}
                            className="clickable-pill"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              width: '100%',
                              textAlign: 'left',
                            }}
                          >
                            <FileText size={13} color="#10B981" />
                            <span>File Markdown (.md)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleExportLatex();
                              setIsExportMenuOpen(false);
                            }}
                            className="clickable-pill"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              width: '100%',
                              textAlign: 'left',
                            }}
                          >
                            <Sigma size={13} color="#8B5CF6" />
                            <span>File LaTeX (.tex)</span>
                          </button>
                        </div>,
                        document.body
                      )}
                    </div>
                  </div>

                  {/* Right: Invert / Dark theme toggle + Page Navigation + Zoom Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                    {/* Contrast / Invert Preview Button */}
                    <button
                      type="button"
                      onClick={handleTogglePreviewInvert}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '4px',
                        backgroundColor: isPreviewInverted ? 'var(--bg-subtle)' : 'transparent',
                        border: '1px solid transparent',
                        color: isPreviewInverted ? 'var(--brand-primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className="hover-subtle"
                      title={language === 'id' ? 'Ubah Kontras/Tema Preview' : 'Toggle Preview Theme'}
                    >
                      <Contrast size={13} />
                    </button>

                    {/* Prev Page Button */}
                    <button
                      type="button"
                      onClick={() => handleGoToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                        color: currentPage <= 1 ? 'var(--border-strong)' : 'var(--text-muted)',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className={currentPage > 1 ? 'hover-subtle' : ''}
                      title="Previous Page"
                    >
                      <ChevronUp size={14} />
                    </button>

                    {/* Next Page Button */}
                    <button
                      type="button"
                      onClick={() => handleGoToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                        color: currentPage >= totalPages ? 'var(--border-strong)' : 'var(--text-muted)',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className={currentPage < totalPages ? 'hover-subtle' : ''}
                      title="Next Page"
                    >
                      <ChevronDown size={14} />
                    </button>

                    {/* Page Input / Total Pages */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <input
                        type="text"
                        value={pageInputValue}
                        onChange={(e) => setPageInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(pageInputValue, 10);
                            if (!isNaN(val)) handleGoToPage(val);
                          }
                        }}
                        onBlur={() => {
                          const val = parseInt(pageInputValue, 10);
                          if (!isNaN(val)) handleGoToPage(val);
                          else setPageInputValue(String(currentPage));
                        }}
                        style={{
                          width: '28px',
                          height: '22px',
                          textAlign: 'center',
                          fontSize: '11.5px',
                          fontWeight: 650,
                          backgroundColor: 'var(--bg-main)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          padding: '0 2px',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        / {totalPages}
                      </span>
                    </div>

                    <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />

                    {/* Zoom Minus Button */}
                    <button
                      type="button"
                      onClick={() => handleZoom(-10)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                      className="hover-subtle"
                      title="Zoom Out"
                    >
                      <Minus size={13} />
                    </button>

                    {/* Zoom Plus Button */}
                    <button
                      type="button"
                      onClick={() => handleZoom(10)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                      className="hover-subtle"
                      title="Zoom In"
                    >
                      <Plus size={13} />
                    </button>

                    {/* Zoom Dropdown Button */}
                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                      <button
                        ref={zoomButtonRef}
                        type="button"
                        onClick={toggleZoomDropdown}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isZoomDropdownOpen ? 'var(--bg-subtle)' : 'transparent',
                          border: '1px solid transparent',
                          color: 'var(--text-primary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'monospace',
                        }}
                        className="hover-subtle"
                        title="Zoom Level"
                      >
                        <span>{previewScale}%</span>
                        <ChevronDown size={10} style={{ opacity: 0.7 }} />
                      </button>

                      {/* Zoom Dropdown Popover (Portal to prevent clipping) */}
                      {isZoomDropdownOpen && zoomDropdownPos && typeof document !== 'undefined' && createPortal(
                        <div
                          ref={zoomDropdownRef}
                          onClick={(e) => e.stopPropagation()}
                          className="animate-fade-in"
                          style={{
                            position: 'fixed',
                            top: `${zoomDropdownPos.top}px`,
                            left: `${zoomDropdownPos.left}px`,
                            zIndex: 999999999,
                            minWidth: '120px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '7px',
                            boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleSetExactZoom('auto');
                              setIsZoomDropdownOpen(false);
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: 'var(--text-primary)',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                            className="hover-subtle"
                          >
                            Auto Fit
                          </button>
                          {[50, 75, 100, 125, 150, 200].map((z) => (
                            <button
                              key={z}
                              type="button"
                              onClick={() => {
                                handleSetExactZoom(z);
                                setIsZoomDropdownOpen(false);
                              }}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: previewScale === z ? 'var(--bg-subtle)' : 'transparent',
                                color: previewScale === z ? 'var(--brand-primary)' : 'var(--text-primary)',
                                fontSize: '11.5px',
                                fontWeight: previewScale === z ? 700 : 500,
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                              className="hover-subtle"
                            >
                              {z}%
                            </button>
                          ))}
                        </div>,
                        document.body
                      )}
                    </div>
                  </div>
                </div>

                {/* Collapsible Log Panel / Drawer */}
                {isLogDrawerOpen && (
                  <div
                    style={{
                      maxHeight: '220px',
                      backgroundColor: 'var(--bg-surface)',
                      borderBottom: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflowY: 'auto',
                      padding: '10px 14px',
                      zIndex: 20,
                    }}
                  >
                    {(() => {
                      const displayed =
                        activeLogTab === 'errors'
                          ? lintResults.errors
                          : activeLogTab === 'warnings'
                          ? lintResults.warnings
                          : activeLogTab === 'info'
                          ? lintResults.infos
                          : [...lintResults.errors, ...lintResults.warnings, ...lintResults.infos];

                      if (displayed.length === 0) {
                        return (
                          <div style={{ padding: '16px', textAlign: 'center', color: '#10B981', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <CheckCircle2 size={15} color="#10B981" />
                            <span>{language === 'id' ? 'Tidak ada masalah ditemukan. Dokumen bersih!' : 'No issues found. Document is clean!'}</span>
                          </div>
                        );
                      }

                      return displayed.map((d) => (
                        <div
                          key={d.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor:
                              d.type === 'error'
                                ? 'rgba(239, 68, 68, 0.08)'
                                : d.type === 'warning'
                                ? 'rgba(245, 158, 11, 0.08)'
                                : 'var(--bg-subtle)',
                            borderLeft: `3px solid ${
                              d.type === 'error' ? '#EF4444' : d.type === 'warning' ? '#F59E0B' : 'var(--brand-primary)'
                            }`,
                            marginBottom: '6px',
                            gap: '8px',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  color: d.type === 'error' ? '#EF4444' : d.type === 'warning' ? '#F59E0B' : 'var(--brand-primary)',
                                }}
                              >
                                {d.type}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Baris {d.line} ({d.fileName || 'main.tex'})
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                              {d.message}
                            </div>
                            {d.suggestion && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                💡 {d.suggestion}
                              </div>
                            )}
                          </div>

                          {/* Quick Actions: Jump to Line & Fix with AI */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => {
                                jumpToLine(d.line - 1);
                              }}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                              className="hover-subtle"
                            >
                              Lompat ke Baris
                            </button>
                            {d.type === 'error' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDrawerTab('ai');
                                  if (!isSidebarOpen) toggleSidebar();
                                }}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(0, 115, 234, 0.12)',
                                  border: '1px solid rgba(0, 115, 234, 0.3)',
                                  color: 'var(--brand-primary)',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Sparkles size={11} />
                                <span>Perbaiki AI</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                <iframe
                  ref={previewIframeRef}
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    pointerEvents: isDragging ? 'none' : 'auto',
                  }}
                  title="Live Document Preview"
                />
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>

      {/* Template Modal */}
      <DocsTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={(tplId) => {
          const newId = createFromTemplate(tplId);
          router.push('/docs/' + newId);
        }}
      />

      {/* Upload Files Modal */}
      {isUploadModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              width: '100%',
              maxWidth: '640px',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Unggah File' : 'Upload Files'}
              </span>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px', borderRadius: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px' }}>
              {/* Drag & Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files.length > 0) handleUploadFiles(e.dataTransfer.files);
                }}
                onClick={() => uploadInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  borderRadius: '10px',
                  backgroundColor: isDragOver ? 'rgba(0, 115, 234, 0.05)' : 'var(--bg-subtle)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: uploadedFiles.length > 0 ? '16px' : '0',
                }}
              >
                <Upload size={32} style={{ margin: '0 auto 12px', color: isDragOver ? 'var(--brand-primary)' : 'var(--text-muted)', display: 'block' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px' }}>
                  {language === 'id' ? 'Jatuhkan file di sini, atau ' : 'Drop files here, or '}
                  <span style={{ color: 'var(--brand-primary)', textDecoration: 'underline' }}>
                    {language === 'id' ? 'pilih file' : 'select files'}
                  </span>
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  {language === 'id'
                    ? 'Mendukung .tex, .bib, .md, .txt, .csv, gambar, dan lainnya'
                    : 'Supports .tex, .bib, .md, .txt, .csv, images, and more'}
                </p>
                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  accept=".tex,.bib,.md,.txt,.csv,.json,.js,.ts,.py,.html,.css,.xml,.yaml,.yml,.png,.jpg,.jpeg,.gif,.svg,.pdf"
                  style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUploadFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                    {language === 'id' ? 'File Diunggah' : 'Uploaded Files'}
                  </p>
                  {uploadedFiles.map((f, i) => {
                    const isImg = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f.name);
                    const isCode = /\.(tex|bib|js|ts|py|html|css|json|yaml|yml|xml)$/i.test(f.name);
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px',
                        backgroundColor: f.status === 'done' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                        border: `1px solid ${f.status === 'done' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        borderRadius: '8px',
                      }}>
                        {isImg ? <ImageIcon size={14} color="#a78bfa" /> : isCode ? <FileCode size={14} color="var(--brand-primary)" /> : <FileIcon size={14} color="var(--text-muted)" />}
                        <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        {f.status === 'done'
                          ? <CheckCircle2 size={14} color="#10b981" />
                          : <AlertCircle size={14} color="#ef4444" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '8px',
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                style={{
                  padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                }}
              >
                {language === 'id' ? (uploadedFiles.length > 0 ? 'Selesai' : 'Batal') : (uploadedFiles.length > 0 ? 'Done' : 'Cancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Overleaf-Style Share Project Modal */}
      {isShareModalOpen && activeDoc && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsShareModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          className="animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-2xl, 0 20px 40px rgba(0,0,0,0.35))',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxHeight: '90vh',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Share Project
              </h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                className="hover-subtle"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Upgrade Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px 16px',
                backgroundColor: 'rgba(0, 115, 234, 0.05)',
                border: '1px solid rgba(0, 115, 234, 0.15)',
                borderRadius: '10px',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 115, 234, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-primary)',
                  flexShrink: 0,
                }}>
                  <Users size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                    Add more collaborators
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    Upgrade to add more collaborators and access higher AI allowance, track changes, and full project history.
                  </p>
                  <Link
                    href="/settings"
                    onClick={() => setIsShareModalOpen(false)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '5px 14px',
                      borderRadius: '20px',
                      backgroundColor: 'var(--brand-primary)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 1px 3px rgba(0, 115, 234, 0.3)',
                    }}
                  >
                    Upgrade
                  </Link>
                </div>
              </div>

              {/* Add Email Form */}
              <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 650, color: 'var(--text-primary)' }}>
                  Add email address
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="name@example.com, colleague@example.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Separate multiple email addresses using the comma (,) character.
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
                        style={{
                          height: '32px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        type="submit"
                        disabled={!inviteEmails.trim() || isInviting}
                        style={{
                          height: '32px',
                          padding: '0 18px',
                          borderRadius: '20px',
                          backgroundColor: '#16a34a',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: inviteEmails.trim() && !isInviting ? 'pointer' : 'not-allowed',
                          opacity: inviteEmails.trim() && !isInviting ? 1 : 0.6,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (inviteEmails.trim()) e.currentTarget.style.backgroundColor = '#15803d';
                        }}
                        onMouseLeave={(e) => {
                          if (inviteEmails.trim()) e.currentTarget.style.backgroundColor = '#16a34a';
                        }}
                      >
                        {isInviting ? 'Inviting...' : 'Invite'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Link Sharing Toggle & URLs */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Link sharing is {activeDoc.isLinkSharingOn !== false ? 'on' : 'off'}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateDocSharing(activeDoc.id, !(activeDoc.isLinkSharingOn !== false))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand-primary)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    {activeDoc.isLinkSharingOn !== false ? 'Turn off link sharing' : 'Turn on link sharing'}
                  </button>
                  <span title="Controls whether anyone with the link can view or edit this project." style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Info size={13} color="var(--text-muted)" />
                  </span>
                </div>

                {activeDoc.isLinkSharingOn !== false && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Edit Link */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Anyone with this link can edit this project
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          readOnly
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/docs/${activeDoc.id}?token=${activeDoc.editToken || 'e_' + activeDoc.id}&mode=edit`}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyShareLink('edit')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: '32px',
                            padding: '0 12px',
                            borderRadius: '6px',
                            backgroundColor: copiedLinkType === 'edit' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-subtle)',
                            border: `1px solid ${copiedLinkType === 'edit' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                            color: copiedLinkType === 'edit' ? '#10b981' : 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          {copiedLinkType === 'edit' ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedLinkType === 'edit' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* View Link */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Anyone with this link can view this project
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          readOnly
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/docs/${activeDoc.id}?token=${activeDoc.viewToken || 'v_' + activeDoc.id}&mode=view`}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            backgroundColor: 'var(--bg-main)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyShareLink('view')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: '32px',
                            padding: '0 12px',
                            borderRadius: '6px',
                            backgroundColor: copiedLinkType === 'view' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-subtle)',
                            border: `1px solid ${copiedLinkType === 'view' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                            color: copiedLinkType === 'view' ? '#10b981' : 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          {copiedLinkType === 'view' ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedLinkType === 'view' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Collaborators List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                {/* Owner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                    }}>
                      <User size={13} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {activeDoc.ownerEmail || 'm.faizasysyauqi@gmail.com'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Owner
                  </span>
                </div>

                {/* Invited Collaborators */}
                {(activeDoc.collaborators || []).map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                      }}>
                        <User size={13} />
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {c.email}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select
                        value={c.role}
                        onChange={(e) => updateDocCollaboratorRole(activeDoc.id, c.email, e.target.value as 'viewer' | 'editor')}
                        style={{
                          height: '28px',
                          padding: '0 6px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeDocCollaborator(activeDoc.id, c.email)}
                        style={{
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '5px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                        className="hover-subtle"
                        title={language === 'id' ? 'Hapus Akses' : 'Remove Access'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
            }}>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  padding: '6px 20px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* ── New File Modal ── */}
      {isNewFileModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsNewFileModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          className="animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-2xl, 0 20px 40px rgba(0,0,0,0.35))',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FilePlus size={16} style={{ color: 'var(--brand-primary)' }} />
                New File
              </h3>
              <button
                type="button"
                onClick={() => setIsNewFileModalOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                className="hover-subtle"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px' }}>
              {/* Format sections */}
              {([
                {
                  label: 'Markdown',
                  formats: [
                    { ext: '.md', desc: 'Markdown document', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                    { ext: '.txt', desc: 'Plain text / notes', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
                    { ext: '.yaml', desc: 'Metadata / front-matter', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
                    { ext: '.csv', desc: 'Data table', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
                  ],
                },
                {
                  label: 'LaTeX',
                  formats: [
                    { ext: '.tex', desc: 'LaTeX document', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
                    { ext: '.bib', desc: 'BibTeX bibliography', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
                    { ext: '.cls', desc: 'Document class (e.g. IEEEtran)', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
                    { ext: '.sty', desc: 'Style / package file', color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
                    { ext: '.bst', desc: 'Bibliography style', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
                    { ext: '.tikz', desc: 'TikZ diagram', color: '#14B8A6', bg: 'rgba(20,184,166,0.1)' },
                  ],
                },
              ] as const).map((group) => (
                <div key={group.label} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    {group.label}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {group.formats.map((f) => (
                      <button
                        key={f.ext}
                        type="button"
                        onClick={() => setNewSubFileExt(f.ext)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1.5px solid ${newSubFileExt === f.ext ? f.color : 'transparent'}`,
                          backgroundColor: newSubFileExt === f.ext ? f.bg : 'var(--bg-subtle)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={(e) => { if (newSubFileExt !== f.ext) e.currentTarget.style.backgroundColor = 'var(--bg-main)'; }}
                        onMouseLeave={(e) => { if (newSubFileExt !== f.ext) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
                      >
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: f.color, flexShrink: 0 }}>{f.ext}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* File name input */}
              <div style={{ marginTop: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  File name
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid var(--border-strong)', borderRadius: '6px', overflow: 'hidden' }}>
                  <input
                    type="text"
                    value={newSubFileName}
                    onChange={(e) => setNewSubFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const trimmed = newSubFileName.trim();
                        if (trimmed && activeDoc) {
                          const hasExt = /\.[a-zA-Z0-9]+$/.test(trimmed);
                          const finalName = hasExt ? trimmed : `${trimmed}${newSubFileExt}`;
                          const newId = createSubFile(activeDoc.id, finalName);
                          setActiveFileId(activeDoc.id, newId);
                          setNewSubFileName('');
                          setIsNewFileModalOpen(false);
                        }
                      }
                      if (e.key === 'Escape') setIsNewFileModalOpen(false);
                    }}
                    autoFocus
                    placeholder="filename (without extension)"
                    style={{
                      flex: 1,
                      background: 'var(--bg-main)',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 10px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span style={{
                    padding: '0 10px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-subtle)',
                    borderLeft: '1px solid var(--border-subtle)',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {newSubFileExt}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setIsNewFileModalOpen(false)}
                style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = newSubFileName.trim();
                  if (trimmed && activeDoc) {
                    const hasExt = /\.[a-zA-Z0-9]+$/.test(trimmed);
                    const finalName = hasExt ? trimmed : `${trimmed}${newSubFileExt}`;
                    const newId = createSubFile(activeDoc.id, finalName);
                    setActiveFileId(activeDoc.id, newId);
                    setNewSubFileName('');
                    setIsNewFileModalOpen(false);
                  }
                }}
                style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--brand-primary)', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                Create File
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Overleaf Hotkeys Modal ── */}
      {isHotkeysModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsHotkeysModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          className="animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '760px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-2xl, 0 20px 40px rgba(0,0,0,0.35))',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxHeight: '90vh',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Hotkeys
              </h3>
              <button
                type="button"
                onClick={() => setIsHotkeysModalOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}
                className="hover-subtle"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                {
                  category: 'Common',
                  items: [
                    { keys: 'Ctrl + F', label: 'Find (and replace)' },
                    { keys: 'Ctrl + Z', label: 'Undo' },
                    { keys: 'Ctrl + Y', label: 'Redo' },
                    { keys: 'Ctrl + Enter', label: 'Compile' },
                  ],
                },
                {
                  category: 'Navigation',
                  items: [
                    { keys: 'Ctrl + Home', label: 'Beginning of document' },
                    { keys: 'Ctrl + End', label: 'End of document' },
                    { keys: 'Ctrl + Shift + L', label: 'Go To Line' },
                  ],
                },
                {
                  category: 'Editing',
                  items: [
                    { keys: 'Ctrl + /', label: 'Toggle Comment' },
                    { keys: 'Ctrl + U', label: 'To Uppercase' },
                    { keys: 'Ctrl + B', label: 'Bold text' },
                    { keys: 'Ctrl + D', label: 'Delete Current Line' },
                    { keys: 'Ctrl + Shift + U', label: 'To Lowercase' },
                    { keys: 'Ctrl + I', label: 'Italic Text' },
                    { keys: 'Ctrl + A', label: 'Select All' },
                    { keys: 'Tab', label: 'Indent Selection' },
                  ],
                },
                {
                  category: 'Autocomplete',
                  items: [
                    { keys: 'Ctrl + Space', label: 'Autocomplete Menu' },
                    { keys: 'Up / Down', label: 'Select Candidate' },
                    { keys: 'Enter / Tab', label: 'Insert Candidate' },
                  ],
                },
                {
                  category: 'Reference Autocomplete (inside a \\cite{} block)',
                  items: [
                    { keys: 'Ctrl + Space', label: 'Search References' },
                  ],
                },
                {
                  category: 'Review',
                  items: [
                    { keys: 'Ctrl + J', label: 'Toggle review panel' },
                    { keys: 'Ctrl + Shift + M', label: 'Toggle Focus mode' },
                    { keys: 'Ctrl + Shift + A', label: 'Toggle track changes' },
                    { keys: 'Ctrl + Shift + C', label: 'Add a comment' },
                  ],
                },
              ].map((section) => (
                <div key={section.category}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    {section.category}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px 16px' }}>
                    {section.items.map((item) => (
                      <div key={item.keys + item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            backgroundColor: '#334155',
                            color: '#ffffff',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            flexShrink: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          }}
                        >
                          {item.keys}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Bottom Notice Alert */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                <Info size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                <span>
                  {language === 'id'
                    ? 'Pintasan keyboard disesuaikan dengan sistem operasi Anda (Ctrl di Windows/Linux, Cmd ⌘ di macOS).'
                    : 'Keyboard shortcuts are mapped to your operating system (Ctrl on Windows/Linux, Cmd ⌘ on macOS).'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setIsHotkeysModalOpen(false)}
                style={{
                  padding: '6px 24px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                className="hover-subtle"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
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

const separatorStyle: React.CSSProperties = {
  width: '1px',
  height: '14px',
  backgroundColor: 'var(--border-subtle)',
  margin: '0 2px',
  flexShrink: 0,
};
