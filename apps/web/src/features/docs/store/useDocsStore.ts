import { create } from 'zustand';
import { DOC_TEMPLATES } from '../data/docTemplates';

export type DocFormat = 'markdown' | 'latex' | 'sheet' | 'slide' | 'typst';
export type StudioPhase = 'landing' | 'generating' | 'editor';
export type DocsViewMode = 'split' | 'code' | 'preview';

export interface DocFolder {
  id: string;
  name: string;
  createdAt: number;
}

export interface DocSubFile {
  id: string;
  name: string; // e.g. 'main.tex', 'abstract.tex', 'chapter1.tex', 'references.bib'
  content: string;
  isMain?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DocCollaborator {
  email: string;
  role: 'viewer' | 'editor';
  invitedAt: number;
}

export interface DocSuggestion {
  id: string;
  docId: string;
  subFileId?: string | null;
  authorName: string;
  authorEmail?: string;
  /** 'add' = pure insertion, 'delete' = pure deletion, 'replace' = substitution */
  type: 'add' | 'delete' | 'replace';
  fromLine: number;
  toLine: number;
  originalText: string;
  suggestedText: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface DocCommentReply {
  id: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: number;
}

export interface DocComment {
  id: string;
  docId: string;
  subFileId?: string | null;
  selectedText: string;
  fromLine?: number;
  toLine?: number;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: number;
  resolved?: boolean;
  replies?: DocCommentReply[];
}

export interface DocHistorySnapshot {
  id: string;
  docId: string;
  timestamp: number;
  description: string;
  doc: DocItem;
  label?: string;
  isNamed?: boolean;
  authorEmail?: string;
  authorName?: string;
  totalWords?: number;
  totalChars?: number;
}

export interface DocItem {
  id: string;
  title: string;
  content: string;
  format: DocFormat;
  updatedAt: number;
  isPinned?: boolean;
  tags?: string[];
  projectId?: string | null; // folder_id in docs database
  files?: DocSubFile[];
  activeFileId?: string | null;
  openFileIds?: string[];
  // Overleaf-style Sharing & Collaboration
  isLinkSharingOn?: boolean;
  viewToken?: string;
  editToken?: string;
  collaborators?: DocCollaborator[];
  ownerEmail?: string;
  // Overleaf-style Comments & Review
  comments?: DocComment[];
  // Overleaf-style Track Changes / Suggestions
  suggestions?: DocSuggestion[];
}

interface DocsState {
  documents: DocItem[];
  folders: DocFolder[];
  activeDocId: string | null;
  activeProjectId: string | null; // active folder id
  studioPhase: StudioPhase;
  selectedFormat: DocFormat;
  viewMode: DocsViewMode;
  editorFontSize: number;
  isCopilotOpen: boolean;
  isSidebarOpen: boolean;
  generatingProgress: number;
  generatingStep: string;

  // Folder Actions (Isolated from Chat)
  createFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  // Overleaf-style Sub-File Actions
  createSubFile: (docId: string, name: string, content?: string) => string;
  updateSubFileContent: (docId: string, fileId: string, content: string) => void;
  updateSubFileName: (docId: string, fileId: string, name: string) => void;
  deleteSubFile: (docId: string, fileId: string) => void;
  closeSubFileTab: (docId: string, fileId: string) => void;
  setMainSubFile: (docId: string, fileId: string) => void;
  setActiveFileId: (docId: string, fileId: string | null) => void;

  // Overleaf-style Sharing & Collaboration Actions
  updateDocSharing: (docId: string, isLinkSharingOn: boolean) => void;
  addDocCollaborator: (docId: string, email: string, role: 'viewer' | 'editor') => void;
  removeDocCollaborator: (docId: string, email: string) => void;
  updateDocCollaboratorRole: (docId: string, email: string, role: 'viewer' | 'editor') => void;

  // Overleaf-style Comments & Review Panel Actions
  addComment: (docId: string, comment: Omit<DocComment, 'id' | 'createdAt'>) => string;
  updateComment: (docId: string, commentId: string, content: string) => void;
  deleteComment: (docId: string, commentId: string) => void;
  resolveComment: (docId: string, commentId: string, resolved?: boolean) => void;
  addCommentReply: (docId: string, commentId: string, reply: Omit<DocCommentReply, 'id' | 'createdAt'>) => void;
  deleteCommentReply: (docId: string, commentId: string, replyId: string) => void;

  // Active comment UI state (Shared across Docs, Slide, Spreadsheet views)
  activeHighlightedCommentId: string | null;
  isAddingComment: boolean;
  draftSelectedText: string;
  draftFromLine: number;
  draftToLine: number;
  draftCharStart: number | null;
  draftCharEnd: number | null;
  commentFilter: 'all' | 'unresolved' | 'resolved';
  commentDomPositions: Record<string, number>;

  // Active sidebar drawer tab state ('files' | 'search' | 'review' | 'ai')
  activeDrawerTab: 'files' | 'search' | 'review' | 'ai';
  setActiveDrawerTab: (tab: 'files' | 'search' | 'review' | 'ai') => void;

  // Overleaf Editing / Reviewing mode
  reviewMode: 'editing' | 'reviewing';
  setReviewMode: (mode: 'editing' | 'reviewing') => void;

  // Track Changes / Suggestion Actions
  addSuggestion: (docId: string, suggestion: Omit<DocSuggestion, 'id' | 'createdAt' | 'status'>) => string;
  acceptSuggestion: (docId: string, suggestionId: string) => void;
  rejectSuggestion: (docId: string, suggestionId: string) => void;

  activeTextareaElement: HTMLTextAreaElement | null;
  registerActiveTextarea: (el: HTMLTextAreaElement | null) => void;
  setActiveHighlightedCommentId: (id: string | null) => void;
  setIsAddingComment: (isAdding: boolean) => void;
  setDraftCommentInfo: (info: { selectedText?: string; fromLine?: number; toLine?: number; charStart?: number | null; charEnd?: number | null }) => void;
  setCommentFilter: (filter: 'all' | 'unresolved' | 'resolved') => void;
  setCommentDomPositions: (positions: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  triggerAddCommentFromSelection: (textareaEl?: HTMLTextAreaElement | null, codeText?: string) => void;

  // Actions
  setStudioPhase: (phase: StudioPhase) => void;
  setSelectedFormat: (format: DocFormat) => void;
  setActiveDocId: (id: string | null) => void;
  setActiveProjectId: (projectId: string | null) => void;
  createDocument: (title?: string, content?: string, format?: DocFormat, projectId?: string | null) => string;
  createScaffoldedDocument: (
    title?: string,
    format?: DocFormat,
    projectId?: string | null,
    files?: Array<{ name: string; content: string; isMain?: boolean }>
  ) => string;
  createFromTemplate: (templateId: string, projectId?: string | null) => string;
  upsertDocument: (doc: DocItem) => void;
  updateDocumentContent: (id: string, content: string) => void;
  updateDocumentTitle: (id: string, title: string) => void;
  moveDocumentToProject: (id: string, projectId: string | null) => void;
  deleteDocument: (id: string) => void;
  togglePin: (id: string) => void;
  setViewMode: (mode: DocsViewMode) => void;
  setEditorFontSize: (size: number) => void;
  toggleCopilot: () => void;
  toggleSidebar: () => void;
  setGeneratingStatus: (progress: number, step: string) => void;
  copilotPendingPrompt: string | null;
  setCopilotPendingPrompt: (prompt: string | null) => void;
  docSnapshots: Record<string, DocHistorySnapshot[]>;
  createDocSnapshot: (
    docId: string,
    description?: string,
    label?: string,
    isNamed?: boolean,
    author?: { name?: string; email?: string }
  ) => string;
  updateDocSnapshotLabel: (docId: string, snapshotId: string, label: string) => void;
  deleteDocSnapshot: (docId: string, snapshotId: string) => void;
  restoreDocSnapshot: (docId: string, snapshotId: string) => boolean;
  syncSnapshotsToCloud: (docId: string, token: string) => Promise<void>;
  loadSnapshotsFromCloud: (docId: string, token: string) => Promise<void>;
}

const STORAGE_KEY = 'anticeil_docs_v2';
const FOLDERS_STORAGE_KEY = 'anticeil_doc_folders_v2';
const PHASE_STORAGE_KEY = 'anticeil_doc_phase_v2';
const ACTIVE_DOC_STORAGE_KEY = 'anticeil_doc_active_id_v2';
const SNAPSHOTS_STORAGE_KEY = 'anticeil_doc_snapshots_v2';

function getInitialSnapshots(): Record<string, DocHistorySnapshot[]> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('[DocsStore] Failed to load doc snapshots from localStorage:', err);
  }
  return {};
}

function getInitialPhase(): StudioPhase {
  if (typeof window === 'undefined') return 'landing';
  try {
    const saved = localStorage.getItem(PHASE_STORAGE_KEY);
    if (saved === 'editor' || saved === 'landing' || saved === 'generating') {
      return saved === 'generating' ? 'editor' : (saved as StudioPhase);
    }
  } catch (err) {
    console.warn('[DocsStore] Failed to load studio phase:', err);
  }
  return 'landing';
}

function getInitialActiveDocId(initialDocs: DocItem[]): string | null {
  if (typeof window === 'undefined') return initialDocs[0]?.id ?? null;
  try {
    const saved = localStorage.getItem(ACTIVE_DOC_STORAGE_KEY);
    if (saved && initialDocs.some((d) => d.id === saved)) {
      return saved;
    }
  } catch (err) {
    console.warn('[DocsStore] Failed to load active doc id:', err);
  }
  return initialDocs.length > 0 ? initialDocs[0].id : null;
}

function getDefaultMainFileName(format: DocFormat): string {
  if (format === 'slide') return 'main.slide';
  if (format === 'sheet') return 'sheet1.antsheet';
  if (format === 'latex') return 'main.tex';
  if (format === 'typst') return 'main.typ';
  return 'main.md';
}

function generateShareToken(prefix: 'v' | 'e'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
}

function ensureDocSharing(doc: DocItem): DocItem {
  return {
    ...doc,
    isLinkSharingOn: doc.isLinkSharingOn ?? true,
    viewToken: doc.viewToken || generateShareToken('v'),
    editToken: doc.editToken || generateShareToken('e'),
    collaborators: Array.isArray(doc.collaborators) ? doc.collaborators : [],
  };
}

function ensureDocFiles(doc: DocItem): DocItem {
  const withSharing = ensureDocSharing(doc);
  const rawFiles = withSharing.files;
  if (rawFiles && rawFiles.length > 0) {
    const hasMain = rawFiles.some((x) => x.isMain);
    const files = rawFiles.map((f, i) => {
      // Auto-migrate legacy .csv to .antsheet for spreadsheet documents
      if (withSharing.format === 'sheet' && f.name.endsWith('.csv')) {
        return {
          ...f,
          name: f.name.replace(/\.csv$/i, '.antsheet'),
          isMain: f.isMain || (!hasMain && i === 0),
        };
      }
      return !hasMain && i === 0 ? { ...f, isMain: true } : f;
    });
    const activeFileId = withSharing.activeFileId || (files.find((f) => f.isMain) || files[0]).id;
    const openFileIds = withSharing.openFileIds || files.map((f) => f.id);
    return { ...withSharing, files, activeFileId, openFileIds };
  }

  const defaultName = getDefaultMainFileName(withSharing.format);
  const mainSubFile: DocSubFile = {
    id: 'subfile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: defaultName,
    content: withSharing.content || '',
    isMain: true,
    createdAt: withSharing.updatedAt || Date.now(),
    updatedAt: withSharing.updatedAt || Date.now(),
  };

  return {
    ...withSharing,
    files: [mainSubFile],
    activeFileId: mainSubFile.id,
    openFileIds: [mainSubFile.id],
  };
}

function getInitialFolders(): DocFolder[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[DocsStore] Failed to load doc folders:', err);
  }
  return [];
}

function getInitialDocuments(): DocItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((d: DocItem) => ensureDocFiles(d));
      }
    }
  } catch (err) {
    console.warn('[DocsStore] Failed to load saved docs from localStorage:', err);
  }

  // Pre-seed with the academic paper template
  const defaultPaper = DOC_TEMPLATES[0];
  const initialMainFile: DocSubFile = {
    id: 'subfile_init_' + Date.now(),
    name: 'main.tex',
    content: defaultPaper.content,
    isMain: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const initial: DocItem = {
    id: 'doc_' + Date.now(),
    title: defaultPaper.title,
    content: defaultPaper.content,
    format: 'latex',
    updatedAt: Date.now(),
    isPinned: true,
    tags: ['Academic', 'LaTeX', 'Research'],
    projectId: null,
    files: [initialMainFile],
    activeFileId: initialMainFile.id,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([initial]));
  } catch {}

  return [initial];
}

export const useDocsStore = create<DocsState>((set, get) => {
  const initialDocs = getInitialDocuments();
  const initialFolders = getInitialFolders();
  const initialPhase = getInitialPhase();
  const initialActiveId = getInitialActiveDocId(initialDocs);
  const initialSnapshots = getInitialSnapshots();

  const saveToStorage = (docs: DocItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch (err) {
      console.warn('[DocsStore] Failed to write docs to localStorage:', err);
    }
  };

  const saveFoldersToStorage = (folders: DocFolder[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    } catch (err) {
      console.warn('[DocsStore] Failed to write doc folders to localStorage:', err);
    }
  };

  const saveSnapshotsToStorage = (snapshots: Record<string, DocHistorySnapshot[]>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
    } catch (err) {
      console.warn('[DocsStore] Failed to write snapshots to localStorage:', err);
    }
  };

  const savePhaseToStorage = (phase: StudioPhase) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PHASE_STORAGE_KEY, phase);
    } catch (err) {
      console.warn('[DocsStore] Failed to write studio phase to localStorage:', err);
    }
  };

  const saveActiveDocIdToStorage = (id: string | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (id) {
        localStorage.setItem(ACTIVE_DOC_STORAGE_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_DOC_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[DocsStore] Failed to write active doc id to localStorage:', err);
    }
  };

  return {
    documents: initialDocs,
    folders: initialFolders,
    activeDocId: initialActiveId,
    activeProjectId: null,
    studioPhase: initialPhase,
    selectedFormat: 'latex',
    viewMode: 'split',
    editorFontSize: 13,
    isCopilotOpen: true,
    isSidebarOpen: true,
    generatingProgress: 0,
    generatingStep: '',

    // Active comment UI state
    activeHighlightedCommentId: null,
    isAddingComment: false,
    draftSelectedText: '',
    draftFromLine: 1,
    draftToLine: 1,
    draftCharStart: null,
    draftCharEnd: null,
    commentFilter: 'unresolved',
    commentDomPositions: {},
    // Active sidebar drawer tab state
    activeDrawerTab: 'files',
    setActiveDrawerTab: (tab) => set({ activeDrawerTab: tab }),

    // Overleaf Editing / Reviewing mode
    reviewMode: 'editing',
    setReviewMode: (mode) => set({ reviewMode: mode }),

    addSuggestion: (docId, suggestionData) => {
      const suggestionId = 'sug_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newSuggestion: DocSuggestion = {
        ...suggestionData,
        id: suggestionId,
        status: 'pending',
        createdAt: Date.now(),
      };
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const existing = d.suggestions || [];
        return { ...d, suggestions: [newSuggestion, ...existing], updatedAt: Date.now() };
      });
      set({ documents: updated });
      saveToStorage(updated);
      return suggestionId;
    },

    acceptSuggestion: (docId, suggestionId) => {
      const doc = get().documents.find((d) => d.id === docId);
      if (!doc) return;
      const sug = (doc.suggestions || []).find((s) => s.id === suggestionId);
      if (!sug || sug.status !== 'pending') return;

      // Apply the text change to the relevant sub-file
      const fileId = sug.subFileId || doc.activeFileId;
      const targetFile = (doc.files || []).find((f) => f.id === fileId) ||
                         (doc.files || []).find((f) => f.isMain) ||
                         (doc.files || [])[0];
      if (targetFile) {
        const lines = targetFile.content.split('\n');
        const before = lines.slice(0, sug.fromLine - 1).join('\n');
        const after = lines.slice(sug.toLine).join('\n');
        const newContent = [before, sug.suggestedText, after].filter((_, i) => !(i === 0 && before === '') || true).join('\n').replace(/^\n/, '');
        const updatedFiles = (doc.files || []).map((f) =>
          f.id === targetFile.id ? { ...f, content: newContent, updatedAt: Date.now() } : f
        );
        const mainFile = updatedFiles.find((f) => f.isMain);
        const updatedDocs = get().documents.map((d) => {
          if (d.id !== docId) return d;
          return {
            ...d,
            files: updatedFiles,
            content: mainFile ? mainFile.content : d.content,
            suggestions: (d.suggestions || []).map((s) =>
              s.id === suggestionId ? { ...s, status: 'accepted' as const } : s
            ),
            updatedAt: Date.now(),
          };
        });
        set({ documents: updatedDocs });
        saveToStorage(updatedDocs);
      } else {
        const updated = get().documents.map((d) =>
          d.id !== docId ? d : {
            ...d,
            suggestions: (d.suggestions || []).map((s) =>
              s.id === suggestionId ? { ...s, status: 'accepted' as const } : s
            ),
            updatedAt: Date.now(),
          }
        );
        set({ documents: updated });
        saveToStorage(updated);
      }
    },

    rejectSuggestion: (docId, suggestionId) => {
      const updated = get().documents.map((d) =>
        d.id !== docId ? d : {
          ...d,
          suggestions: (d.suggestions || []).map((s) =>
            s.id === suggestionId ? { ...s, status: 'rejected' as const } : s
          ),
          updatedAt: Date.now(),
        }
      );
      set({ documents: updated });
      saveToStorage(updated);
    },

    activeTextareaElement: null,
    registerActiveTextarea: (el) => set({ activeTextareaElement: el }),
    setActiveHighlightedCommentId: (id) => set({ activeHighlightedCommentId: id }),
    setIsAddingComment: (isAdding) => set({ isAddingComment: isAdding }),
    setDraftCommentInfo: (info) =>
      set((s) => ({
        draftSelectedText: info.selectedText !== undefined ? info.selectedText : s.draftSelectedText,
        draftFromLine: info.fromLine !== undefined ? info.fromLine : s.draftFromLine,
        draftToLine: info.toLine !== undefined ? info.toLine : s.draftToLine,
        draftCharStart: info.charStart !== undefined ? info.charStart : s.draftCharStart,
        draftCharEnd: info.charEnd !== undefined ? info.charEnd : s.draftCharEnd,
      })),
    setCommentFilter: (filter) => set({ commentFilter: filter }),
    setCommentDomPositions: (positions) =>
      set((s) => ({
        commentDomPositions: typeof positions === 'function' ? positions(s.commentDomPositions) : positions,
      })),
    triggerAddCommentFromSelection: (textareaEl, codeText) => {
      const targetEl = textareaEl || get().activeTextareaElement;
      let selText = '';
      let fromLine = 1;
      let toLine = 1;
      let charStart: number | null = null;
      let charEnd: number | null = null;

      if (targetEl) {
        const rawVal = targetEl.value;
        const lines = rawVal.split('\n');

        let start = targetEl.selectionStart;
        let end = targetEl.selectionEnd;

        // Fallback to last recorded selection if selection collapsed to (0, 0) on blur
        const lastSel = (targetEl as any)._lastSelection;
        if (start === 0 && end === 0 && lastSel && (lastSel.start > 0 || lastSel.end > 0)) {
          start = lastSel.start;
          end = lastSel.end;
        }

        if (end > start) {
          selText = rawVal.substring(start, end);
          const textUpToStart = rawVal.substring(0, start);
          const textUpToEnd = rawVal.substring(0, end);
          fromLine = textUpToStart.split('\n').length;
          toLine = textUpToEnd.split('\n').length;
          charStart = start;
          charEnd = end;
        } else {
          // If no multi-character selection, comment on current cursor line
          const cursor = start ?? 0;
          const textUpToCursor = rawVal.substring(0, cursor);
          fromLine = Math.max(1, Math.min(lines.length, textUpToCursor.split('\n').length));
          toLine = fromLine;
          const lineText = lines[fromLine - 1] ?? '';
          selText = lineText.trim();

          let lineStart = 0;
          for (let i = 0; i < fromLine - 1 && i < lines.length; i++) {
            lineStart += lines[i].length + 1;
          }
          charStart = lineStart;
          charEnd = lineStart + lineText.length;
        }
      } else if (codeText) {
        const lines = codeText.split('\n');
        fromLine = 1;
        toLine = 1;
        selText = (lines[0] || '').trim();
        charStart = 0;
        charEnd = (lines[0] || '').length;
      }

      set({
        isAddingComment: true,
        draftSelectedText: selText,
        draftFromLine: fromLine,
        draftToLine: toLine,
        draftCharStart: charStart,
        draftCharEnd: charEnd,
        isSidebarOpen: true,
        activeDrawerTab: 'review',
      });
    },
    copilotPendingPrompt: null,
    docSnapshots: initialSnapshots,

    setCopilotPendingPrompt: (prompt) => set({ copilotPendingPrompt: prompt }),

    createDocSnapshot: (
      docId: string,
      description = 'Checkpoint',
      label?: string,
      isNamed = false,
      author?: { name?: string; email?: string }
    ) => {
      const doc = get().documents.find((d) => d.id === docId);
      if (!doc) return '';
      const snapshotId = 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      // Calculate total words and chars across all subfiles
      const allText =
        doc.files && doc.files.length > 0
          ? doc.files.map((f) => f.content || '').join('\n')
          : doc.content || '';
      const totalWords = allText.trim() ? allText.trim().split(/\s+/).length : 0;
      const totalChars = allText.length;

      const snapshot: DocHistorySnapshot = {
        id: snapshotId,
        docId,
        timestamp: Date.now(),
        description,
        label: label?.trim() || undefined,
        isNamed: Boolean(isNamed || label?.trim()),
        authorName: author?.name || 'You',
        authorEmail: author?.email || undefined,
        totalWords,
        totalChars,
        doc: JSON.parse(JSON.stringify(doc)),
      };
      const currentList = get().docSnapshots[docId] || [];
      const updatedSnapshots = {
        ...get().docSnapshots,
        [docId]: [snapshot, ...currentList.filter((s) => s.id !== snapshotId).slice(0, 49)],
      };
      set({ docSnapshots: updatedSnapshots });
      saveSnapshotsToStorage(updatedSnapshots);
      return snapshotId;
    },

    updateDocSnapshotLabel: (docId: string, snapshotId: string, label: string) => {
      const list = get().docSnapshots[docId] || [];
      const trimmed = label.trim();
      const updatedList = list.map((s) =>
        s.id === snapshotId
          ? {
              ...s,
              label: trimmed || undefined,
              isNamed: Boolean(trimmed),
            }
          : s
      );
      const updatedSnapshots = {
        ...get().docSnapshots,
        [docId]: updatedList,
      };
      set({ docSnapshots: updatedSnapshots });
      saveSnapshotsToStorage(updatedSnapshots);
    },

    deleteDocSnapshot: (docId: string, snapshotId: string) => {
      const list = get().docSnapshots[docId] || [];
      const updatedList = list.filter((s) => s.id !== snapshotId);
      const updatedSnapshots = {
        ...get().docSnapshots,
        [docId]: updatedList,
      };
      set({ docSnapshots: updatedSnapshots });
      saveSnapshotsToStorage(updatedSnapshots);
    },

    restoreDocSnapshot: (docId: string, snapshotId: string) => {
      const list = get().docSnapshots[docId] || [];
      const target = list.find((s) => s.id === snapshotId);
      if (!target) return false;

      // Auto-save a safety checkpoint of current state before restoring
      const currentDoc = get().documents.find((d) => d.id === docId);
      if (currentDoc) {
        const autoCheckpointId = 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const allText =
          currentDoc.files && currentDoc.files.length > 0
            ? currentDoc.files.map((f) => f.content || '').join('\n')
            : currentDoc.content || '';
        const autoSnap: DocHistorySnapshot = {
          id: autoCheckpointId,
          docId,
          timestamp: Date.now(),
          description: `Auto backup before restoring ${target.label || 'snapshot'}`,
          doc: JSON.parse(JSON.stringify(currentDoc)),
          totalWords: allText.trim() ? allText.trim().split(/\s+/).length : 0,
          totalChars: allText.length,
        };
        const updatedList = [autoSnap, ...list.slice(0, 48)];
        const updatedSnapshots = { ...get().docSnapshots, [docId]: updatedList };
        set({ docSnapshots: updatedSnapshots });
        saveSnapshotsToStorage(updatedSnapshots);
      }

      const restoredDoc = JSON.parse(JSON.stringify(target.doc));
      restoredDoc.updatedAt = Date.now();
      const updatedDocs = get().documents.map((d) => (d.id === docId ? restoredDoc : d));
      set({ documents: updatedDocs });
      saveToStorage(updatedDocs);
      return true;
    },

    syncSnapshotsToCloud: async (docId: string, token: string) => {
      try {
        const snapshots = get().docSnapshots[docId] || [];
        if (snapshots.length === 0) return;
        await fetch('/api/docs/versions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ docId, snapshots }),
        });
      } catch (err) {
        console.warn('[DocsStore] Cloud snapshot sync failed:', err);
      }
    },

    loadSnapshotsFromCloud: async (docId: string, token: string) => {
      try {
        const res = await fetch(`/api/docs/versions?docId=${encodeURIComponent(docId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data?.snapshots) && data.snapshots.length > 0) {
          const localList = get().docSnapshots[docId] || [];
          const map = new Map<string, DocHistorySnapshot>();
          [...data.snapshots, ...localList].forEach((s) => map.set(s.id, s));
          const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
          const updatedSnapshots = { ...get().docSnapshots, [docId]: merged };
          set({ docSnapshots: updatedSnapshots });
          saveSnapshotsToStorage(updatedSnapshots);
        }
      } catch (err) {
        console.warn('[DocsStore] Cloud snapshot load failed:', err);
      }
    },

    createFolder: (name: string) => {
      const trimmed = name.trim() || 'Folder Baru';
      const newFolder: DocFolder = {
        id: 'doc_folder_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: trimmed,
        createdAt: Date.now(),
      };
      const updated = [...get().folders, newFolder];
      set({ folders: updated, activeProjectId: newFolder.id });
      saveFoldersToStorage(updated);
      return newFolder.id;
    },

    renameFolder: (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const updated = get().folders.map((f) => (f.id === id ? { ...f, name: trimmed } : f));
      set({ folders: updated });
      saveFoldersToStorage(updated);
    },

    deleteFolder: (id: string) => {
      const remaining = get().folders.filter((f) => f.id !== id);
      // Unlink docs from deleted folder
      const updatedDocs = get().documents.map((d) => (d.projectId === id ? { ...d, projectId: null } : d));
      const nextActiveProject = get().activeProjectId === id ? null : get().activeProjectId;
      set({ folders: remaining, documents: updatedDocs, activeProjectId: nextActiveProject });
      saveFoldersToStorage(remaining);
      saveToStorage(updatedDocs);
    },

    // Overleaf-style Multi-File Actions
    createSubFile: (docId: string, name: string, content = '') => {
      const trimmed = name.trim() || 'untitled.tex';
      const newFileId = 'subfile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newSubFile: DocSubFile = {
        id: newFileId,
        name: trimmed,
        content,
        isMain: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const currentDoc = ensureDocFiles(d);
        const currentFiles = currentDoc.files || [];
        const currentOpen = currentDoc.openFileIds || currentFiles.map((f) => f.id);
        const nextOpen = currentOpen.includes(newFileId) ? currentOpen : [...currentOpen, newFileId];
        return {
          ...currentDoc,
          files: [...currentFiles, newSubFile],
          openFileIds: nextOpen,
          activeFileId: newFileId,
          updatedAt: Date.now(),
        };
      });

      set({ documents: updated });
      saveToStorage(updated);
      return newFileId;
    },

    updateSubFileContent: (docId: string, fileId: string, content: string) => {
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const currentDoc = ensureDocFiles(d);
        const files = (currentDoc.files || []).map((f) =>
          f.id === fileId ? { ...f, content, updatedAt: Date.now() } : f
        );
        const mainFile = files.find((f) => f.isMain);
        return {
          ...currentDoc,
          files,
          content: mainFile ? mainFile.content : currentDoc.content,
          updatedAt: Date.now(),
        };
      });
      set({ documents: updated });
      saveToStorage(updated);
    },

    updateSubFileName: (docId: string, fileId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const currentDoc = ensureDocFiles(d);
        const files = (currentDoc.files || []).map((f) =>
          f.id === fileId ? { ...f, name: trimmed, updatedAt: Date.now() } : f
        );
        return {
          ...currentDoc,
          files,
          updatedAt: Date.now(),
        };
      });
      set({ documents: updated });
      saveToStorage(updated);
    },

    deleteSubFile: (docId: string, fileId: string) => {
      const doc = get().documents.find((d) => d.id === docId);
      if (!doc || !doc.files || doc.files.length <= 1) return;

      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const currentDoc = ensureDocFiles(d);
        const target = currentDoc.files?.find((f) => f.id === fileId);
        const remaining = (currentDoc.files || []).filter((f) => f.id !== fileId);
        const currentOpen = currentDoc.openFileIds || (currentDoc.files || []).map((f) => f.id);
        const nextOpen = currentOpen.filter((id) => id !== fileId);

        let files = remaining;
        if (target?.isMain && remaining.length > 0) {
          files = remaining.map((f, i) => (i === 0 ? { ...f, isMain: true } : f));
        }

        const nextActiveId =
          currentDoc.activeFileId === fileId
            ? (files.find((f) => f.isMain) || files[0])?.id || null
            : currentDoc.activeFileId;

        const mainFile = files.find((f) => f.isMain);
        return {
          ...currentDoc,
          files,
          openFileIds: nextOpen,
          content: mainFile ? mainFile.content : currentDoc.content,
          activeFileId: nextActiveId,
          updatedAt: Date.now(),
        };
      });

      set({ documents: updated });
      saveToStorage(updated);
    },

    closeSubFileTab: (docId: string, fileId: string) => {
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const currentDoc = ensureDocFiles(d);
        const allFiles = currentDoc.files || [];
        const currentOpen = currentDoc.openFileIds || allFiles.map((f) => f.id);
        const nextOpen = currentOpen.filter((id) => id !== fileId);

        let nextActiveId = currentDoc.activeFileId;
        if (currentDoc.activeFileId === fileId) {
          const closedIdx = currentOpen.indexOf(fileId);
          const remainingOpenFiles = allFiles.filter((f) => nextOpen.includes(f.id));
          if (remainingOpenFiles.length > 0) {
            const nextIdx = Math.min(closedIdx, remainingOpenFiles.length - 1);
            nextActiveId = remainingOpenFiles[nextIdx].id;
          } else {
            nextActiveId = null;
          }
        }

        return {
          ...currentDoc,
          openFileIds: nextOpen,
          activeFileId: nextActiveId,
        };
      });

      set({ documents: updated });
      saveToStorage(updated);
    },

    setMainSubFile: (docId: string, fileId: string) => {
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const currentDoc = ensureDocFiles(d);
        const files = (currentDoc.files || []).map((f) => ({
          ...f,
          isMain: f.id === fileId,
        }));
        const mainFile = files.find((f) => f.isMain);
        return {
          ...currentDoc,
          files,
          content: mainFile ? mainFile.content : currentDoc.content,
          updatedAt: Date.now(),
        };
      });
      set({ documents: updated });
      saveToStorage(updated);
    },

    setActiveFileId: (docId: string, fileId: string | null) => {
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const currentDoc = ensureDocFiles(d);
        const allFiles = currentDoc.files || [];
        const currentOpen = currentDoc.openFileIds || allFiles.map((f) => f.id);
        const nextOpen = fileId && !currentOpen.includes(fileId) ? [...currentOpen, fileId] : currentOpen;
        return {
          ...currentDoc,
          activeFileId: fileId,
          openFileIds: nextOpen,
        };
      });
      set({ documents: updated });
      saveToStorage(updated);
    },

    setStudioPhase: (phase: StudioPhase) => {
      set({ studioPhase: phase });
      savePhaseToStorage(phase);
    },

    setSelectedFormat: (format: DocFormat) => set({ selectedFormat: format }),

    setActiveDocId: (id: string | null) => {
      const phase = id ? 'editor' : 'landing';
      set({ activeDocId: id, studioPhase: phase });
      saveActiveDocIdToStorage(id);
      savePhaseToStorage(phase);
    },

    setActiveProjectId: (projectId: string | null) => set({ activeProjectId: projectId }),

    createDocument: (
      title = 'Dokumen Baru',
      content = `\\documentclass[11pt,a4paper]{article}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{Dokumen Baru}
\\author{Penulis}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Tulis abstrak atau ringkasan dokumen Anda di sini...
\\end{abstract}

\\section{Pendahuluan}
Mulai menulis dokumen LaTeX Anda di sini. Gunakan formula matematika $E = mc^2$, gambar, tabel, dan sitasi dengan mudah.

\\end{document}
`,
      format: DocFormat = 'latex',
      projectId?: string | null
    ) => {
      const assignedProjectId = projectId !== undefined ? projectId : get().activeProjectId;
      const defaultName = getDefaultMainFileName(format);
      const mainSubFile: DocSubFile = {
        id: 'subfile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: defaultName,
        content,
        isMain: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newDoc: DocItem = {
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title,
        content,
        format,
        updatedAt: Date.now(),
        isPinned: false,
        tags: [format],
        projectId: assignedProjectId || null,
        files: [mainSubFile],
        activeFileId: mainSubFile.id,
      };

      const updated = [newDoc, ...get().documents];
      set({ documents: updated, activeDocId: newDoc.id, studioPhase: 'editor' });
      saveToStorage(updated);
      saveActiveDocIdToStorage(newDoc.id);
      savePhaseToStorage('editor');
      return newDoc.id;
    },

    createScaffoldedDocument: (
      title = 'Proyek Dokumen Baru',
      format: DocFormat = 'latex',
      projectId?: string | null,
      customFiles?: Array<{ name: string; content: string; isMain?: boolean }>
    ) => {
      const assignedProjectId = projectId !== undefined ? projectId : get().activeProjectId;
      const defaultMainName = getDefaultMainFileName(format);
      let subFiles: DocSubFile[] = [];

      if (customFiles && customFiles.length > 0) {
        const hasMain = customFiles.some((f) => f.isMain);
        subFiles = customFiles.map((cf, idx) => ({
          id: 'subfile_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
          name: cf.name,
          content: cf.content,
          isMain: cf.isMain !== undefined ? cf.isMain : (!hasMain && idx === 0),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
      } else {
        const mainSubFile: DocSubFile = {
          id: 'subfile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: defaultMainName,
          content: '',
          isMain: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        subFiles = [mainSubFile];
      }

      const mainFile = subFiles.find((f) => f.isMain) || subFiles[0];
      const newDoc: DocItem = {
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title,
        content: mainFile?.content || '',
        format,
        updatedAt: Date.now(),
        isPinned: false,
        tags: [format, 'Feature-First'],
        projectId: assignedProjectId || null,
        files: subFiles,
        activeFileId: mainFile?.id || subFiles[0]?.id || null,
      };

      const updated = [newDoc, ...get().documents];
      set({ documents: updated, activeDocId: newDoc.id, studioPhase: 'editor' });
      saveToStorage(updated);
      saveActiveDocIdToStorage(newDoc.id);
      savePhaseToStorage('editor');
      return newDoc.id;
    },

    createFromTemplate: (templateId: string, projectId?: string | null) => {
      const tpl = DOC_TEMPLATES.find((t) => t.id === templateId) || DOC_TEMPLATES[0];
      const assignedProjectId = projectId !== undefined ? projectId : get().activeProjectId;
      const format: DocFormat =
        tpl.format ||
        (tpl.id === 'academic-paper' || tpl.id === 'math-physics-notes' || tpl.id === 'technical-rfc'
          ? 'latex'
          : tpl.id === 'feature-first-slides'
          ? 'slide'
          : tpl.id === 'feature-first-sheet'
          ? 'sheet'
          : 'markdown');

      let subFiles: DocSubFile[] = [];
      if (tpl.files && tpl.files.length > 0) {
        const hasMain = tpl.files.some((f) => f.isMain);
        subFiles = tpl.files.map((tf, idx) => ({
          id: 'subfile_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 6),
          name: tf.name,
          content: tf.content,
          isMain: tf.isMain !== undefined ? tf.isMain : (!hasMain && idx === 0),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));
      } else {
        const defaultName = getDefaultMainFileName(format);
        const mainSubFile: DocSubFile = {
          id: 'subfile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: defaultName,
          content: tpl.content,
          isMain: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        subFiles = [mainSubFile];
      }

      const mainFile = subFiles.find((f) => f.isMain) || subFiles[0];
      const newDoc: DocItem = {
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: tpl.title,
        content: mainFile?.content || tpl.content,
        format,
        updatedAt: Date.now(),
        isPinned: false,
        tags: [tpl.category, format],
        projectId: assignedProjectId || null,
        files: subFiles,
        activeFileId: mainFile?.id || subFiles[0]?.id || null,
      };

      const updated = [newDoc, ...get().documents];
      set({ documents: updated, activeDocId: newDoc.id, studioPhase: 'editor' });
      saveToStorage(updated);
      saveActiveDocIdToStorage(newDoc.id);
      savePhaseToStorage('editor');
      return newDoc.id;
    },

    upsertDocument: (doc: DocItem) => {
      const completeDoc = ensureDocFiles(doc);
      const existingIdx = get().documents.findIndex((d) => d.id === completeDoc.id);
      let updated: DocItem[];
      if (existingIdx >= 0) {
        updated = get().documents.map((d, i) => (i === existingIdx ? { ...d, ...completeDoc } : d));
      } else {
        updated = [completeDoc, ...get().documents];
      }
      set({ documents: updated, activeDocId: completeDoc.id, studioPhase: 'editor' });
      saveToStorage(updated);
      saveActiveDocIdToStorage(completeDoc.id);
      savePhaseToStorage('editor');
    },

    updateDocumentContent: (id: string, content: string) => {
      const updated = get().documents.map((d) => {
        if (d.id !== id) return d;
        const currentDoc = ensureDocFiles(d);
        const activeFileId = currentDoc.activeFileId;
        const files = (currentDoc.files || []).map((f) => {
          if (activeFileId ? f.id === activeFileId : f.isMain) {
            return { ...f, content, updatedAt: Date.now() };
          }
          return f;
        });
        const mainFile = files.find((f) => f.isMain);
        return {
          ...currentDoc,
          content: mainFile ? mainFile.content : content,
          files,
          updatedAt: Date.now(),
        };
      });
      set({ documents: updated });
      saveToStorage(updated);
    },

    updateDocumentTitle: (id: string, title: string) => {
      const updated = get().documents.map((d) =>
        d.id === id ? { ...d, title: title.trim() || 'Untitled Doc', updatedAt: Date.now() } : d
      );
      set({ documents: updated });
      saveToStorage(updated);
    },

    moveDocumentToProject: (id: string, projectId: string | null) => {
      const updated = get().documents.map((d) =>
        d.id === id ? { ...d, projectId: projectId || null, updatedAt: Date.now() } : d
      );
      set({ documents: updated });
      saveToStorage(updated);
    },

    deleteDocument: (id: string) => {
      const remaining = get().documents.filter((d) => d.id !== id);
      const nextActiveId =
        get().activeDocId === id
          ? remaining.length > 0
            ? remaining[0].id
            : null
          : get().activeDocId;
      const nextPhase: StudioPhase = remaining.length === 0 ? 'landing' : get().studioPhase;

      set({ documents: remaining, activeDocId: nextActiveId, studioPhase: nextPhase });
      saveToStorage(remaining);
      saveActiveDocIdToStorage(nextActiveId);
      savePhaseToStorage(nextPhase);
    },

    togglePin: (id: string) => {
      const docs = get().documents;
      const doc = docs.find((d) => d.id === id);
      if (!doc) return;

      const pinnedDocsCount = docs.filter((d) => d.isPinned).length;
      if (!doc.isPinned && pinnedDocsCount >= 3) {
        alert('Maksimal 3 dokumen yang dapat disematkan / Maximum of 3 pinned documents allowed.');
        return;
      }

      const updated = docs.map((d) =>
        d.id === id ? { ...d, isPinned: !d.isPinned } : d
      );
      set({ documents: updated });
      saveToStorage(updated);
    },

    // Overleaf-style Sharing Actions Implementation
    updateDocSharing: (docId: string, isLinkSharingOn: boolean) => {
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        return {
          ...d,
          isLinkSharingOn,
          updatedAt: Date.now(),
        };
      });
      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Backend / Supabase
      const doc = updated.find((d) => d.id === docId);
      if (doc) {
        fetch(`/api/docs/${docId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isLinkSharingOn,
            collaborators: doc.collaborators || [],
            viewToken: doc.viewToken,
            editToken: doc.editToken,
          }),
        }).catch((err) => console.warn('[DocShare] API sync failed:', err));
      }
    },

    addDocCollaborator: (docId: string, email: string, role: 'viewer' | 'editor') => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) return;

      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const currentCollabs = d.collaborators || [];
        const existingIdx = currentCollabs.findIndex((c) => c.email.toLowerCase() === cleanEmail);
        let newCollabs: DocCollaborator[];
        if (existingIdx >= 0) {
          newCollabs = currentCollabs.map((c, i) =>
            i === existingIdx ? { ...c, role, invitedAt: Date.now() } : c
          );
        } else {
          newCollabs = [
            ...currentCollabs,
            { email: cleanEmail, role, invitedAt: Date.now() },
          ];
        }
        return {
          ...d,
          collaborators: newCollabs,
          updatedAt: Date.now(),
        };
      });
      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Backend / Supabase
      const doc = updated.find((d) => d.id === docId);
      if (doc) {
        fetch(`/api/docs/${docId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isLinkSharingOn: doc.isLinkSharingOn ?? true,
            collaborators: doc.collaborators,
            viewToken: doc.viewToken,
            editToken: doc.editToken,
          }),
        }).catch((err) => console.warn('[DocShare] API sync failed:', err));
      }
    },

    removeDocCollaborator: (docId: string, email: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const newCollabs = (d.collaborators || []).filter(
          (c) => c.email.toLowerCase() !== cleanEmail
        );
        return {
          ...d,
          collaborators: newCollabs,
          updatedAt: Date.now(),
        };
      });
      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Backend / Supabase
      const doc = updated.find((d) => d.id === docId);
      if (doc) {
        fetch(`/api/docs/${docId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isLinkSharingOn: doc.isLinkSharingOn ?? true,
            collaborators: doc.collaborators,
            viewToken: doc.viewToken,
            editToken: doc.editToken,
          }),
        }).catch((err) => console.warn('[DocShare] API sync failed:', err));
      }
    },

    updateDocCollaboratorRole: (docId: string, email: string, role: 'viewer' | 'editor') => {
      const cleanEmail = email.trim().toLowerCase();
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const newCollabs = (d.collaborators || []).map((c) =>
          c.email.toLowerCase() === cleanEmail ? { ...c, role } : c
        );
        return {
          ...d,
          collaborators: newCollabs,
          updatedAt: Date.now(),
        };
      });
      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Backend / Supabase
      const doc = updated.find((d) => d.id === docId);
      if (doc) {
        fetch(`/api/docs/${docId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isLinkSharingOn: doc.isLinkSharingOn ?? true,
            collaborators: doc.collaborators,
            viewToken: doc.viewToken,
            editToken: doc.editToken,
          }),
        }).catch((err) => console.warn('[DocShare] API sync failed:', err));
      }
    },

    // ── Overleaf Comments & Review Panel Implementations ────────────────────────
    addComment: (docId: string, commentData: Omit<DocComment, 'id' | 'createdAt'>) => {
      const commentId = 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const newComment: DocComment = {
        ...commentData,
        id: commentId,
        createdAt: Date.now(),
        resolved: false,
        replies: [],
      };

      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const currentComments = d.comments || [];
        return {
          ...d,
          comments: [newComment, ...currentComments],
          updatedAt: Date.now(),
        };
      });

      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Supabase
      (async () => {
        try {
          const { createClient } = await import('../../../shared/utils/supabase/client');
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('document_comments').upsert({
              id: newComment.id,
              document_id: docId,
              sub_file_id: newComment.subFileId || null,
              selected_text: newComment.selectedText || '',
              from_line: newComment.fromLine || 1,
              to_line: newComment.toLine || 1,
              author_name: newComment.authorName || 'Collaborator',
              author_email: newComment.authorEmail || session.user.email,
              content: newComment.content,
              resolved: false,
              replies: [],
              updated_at: new Date().toISOString(),
            });
            // Update document comments jsonb
            const doc = updated.find((d) => d.id === docId);
            if (doc) {
              await supabase.from('documents').update({ comments: doc.comments, updated_at: new Date().toISOString() }).eq('id', docId);
            }
          }
        } catch (e) {
          console.warn('[Comments] Supabase add comment sync failed:', e);
        }
      })();

      return commentId;
    },

    updateComment: (docId: string, commentId: string, content: string) => {
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const newComments = (d.comments || []).map((c) =>
          c.id === commentId ? { ...c, content, updatedAt: Date.now() } : c
        );
        return { ...d, comments: newComments, updatedAt: Date.now() };
      });

      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Supabase
      (async () => {
        try {
          const { createClient } = await import('../../../shared/utils/supabase/client');
          const supabase = createClient();
          await supabase.from('document_comments').update({ content, updated_at: new Date().toISOString() }).eq('id', commentId);
          const doc = updated.find((d) => d.id === docId);
          if (doc) {
            await supabase.from('documents').update({ comments: doc.comments, updated_at: new Date().toISOString() }).eq('id', docId);
          }
        } catch (e) {
          console.warn('[Comments] Supabase update comment sync failed:', e);
        }
      })();
    },

    deleteComment: (docId: string, commentId: string) => {
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const newComments = (d.comments || []).filter((c) => c.id !== commentId);
        return { ...d, comments: newComments, updatedAt: Date.now() };
      });

      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Supabase
      (async () => {
        try {
          const { createClient } = await import('../../../shared/utils/supabase/client');
          const supabase = createClient();
          await supabase.from('document_comments').delete().eq('id', commentId);
          const doc = updated.find((d) => d.id === docId);
          if (doc) {
            await supabase.from('documents').update({ comments: doc.comments, updated_at: new Date().toISOString() }).eq('id', docId);
          }
        } catch (e) {
          console.warn('[Comments] Supabase delete comment sync failed:', e);
        }
      })();
    },

    resolveComment: (docId: string, commentId: string, resolved: boolean = true) => {
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const newComments = (d.comments || []).map((c) =>
          c.id === commentId ? { ...c, resolved, updatedAt: Date.now() } : c
        );
        return { ...d, comments: newComments, updatedAt: Date.now() };
      });

      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Supabase
      (async () => {
        try {
          const { createClient } = await import('../../../shared/utils/supabase/client');
          const supabase = createClient();
          await supabase.from('document_comments').update({ resolved, updated_at: new Date().toISOString() }).eq('id', commentId);
          const doc = updated.find((d) => d.id === docId);
          if (doc) {
            await supabase.from('documents').update({ comments: doc.comments, updated_at: new Date().toISOString() }).eq('id', docId);
          }
        } catch (e) {
          console.warn('[Comments] Supabase resolve comment sync failed:', e);
        }
      })();
    },

    addCommentReply: (docId: string, commentId: string, replyData: Omit<DocCommentReply, 'id' | 'createdAt'>) => {
      const replyId = 'rpl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newReply: DocCommentReply = {
        ...replyData,
        id: replyId,
        createdAt: Date.now(),
      };

      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const newComments = (d.comments || []).map((c) => {
          if (c.id !== commentId) return c;
          const replies = [...(c.replies || []), newReply];
          return { ...c, replies };
        });
        return { ...d, comments: newComments, updatedAt: Date.now() };
      });

      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Supabase
      (async () => {
        try {
          const { createClient } = await import('../../../shared/utils/supabase/client');
          const supabase = createClient();
          const targetComment = updated.find((d) => d.id === docId)?.comments?.find((c) => c.id === commentId);
          if (targetComment) {
            await supabase.from('document_comments').update({ replies: targetComment.replies, updated_at: new Date().toISOString() }).eq('id', commentId);
          }
          const doc = updated.find((d) => d.id === docId);
          if (doc) {
            await supabase.from('documents').update({ comments: doc.comments, updated_at: new Date().toISOString() }).eq('id', docId);
          }
        } catch (e) {
          console.warn('[Comments] Supabase add reply sync failed:', e);
        }
      })();
    },

    deleteCommentReply: (docId: string, commentId: string, replyId: string) => {
      const updated = get().documents.map((d) => {
        if (d.id !== docId) return d;
        const newComments = (d.comments || []).map((c) => {
          if (c.id !== commentId) return c;
          const replies = (c.replies || []).filter((r) => r.id !== replyId);
          return { ...c, replies };
        });
        return { ...d, comments: newComments, updatedAt: Date.now() };
      });

      set({ documents: updated });
      saveToStorage(updated);

      // Async sync to Supabase
      (async () => {
        try {
          const { createClient } = await import('../../../shared/utils/supabase/client');
          const supabase = createClient();
          const targetComment = updated.find((d) => d.id === docId)?.comments?.find((c) => c.id === commentId);
          if (targetComment) {
            await supabase.from('document_comments').update({ replies: targetComment.replies, updated_at: new Date().toISOString() }).eq('id', commentId);
          }
          const doc = updated.find((d) => d.id === docId);
          if (doc) {
            await supabase.from('documents').update({ comments: doc.comments, updated_at: new Date().toISOString() }).eq('id', docId);
          }
        } catch (e) {
          console.warn('[Comments] Supabase delete reply sync failed:', e);
        }
      })();
    },

    setViewMode: (mode: DocsViewMode) => set({ viewMode: mode }),

    setEditorFontSize: (size: number) => set({ editorFontSize: size }),

    toggleCopilot: () => set((s) => ({ isCopilotOpen: !s.isCopilotOpen })),

    toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

    setGeneratingStatus: (progress: number, step: string) =>
      set({ generatingProgress: progress, generatingStep: step }),
  };
});
