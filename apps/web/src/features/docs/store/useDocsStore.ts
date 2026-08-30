import { create } from 'zustand';
import { DOC_TEMPLATES } from '../data/docTemplates';

export type DocFormat = 'markdown' | 'latex' | 'sheet' | 'slide';
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
  setMainSubFile: (docId: string, fileId: string) => void;
  setActiveFileId: (docId: string, fileId: string | null) => void;

  // Actions
  setStudioPhase: (phase: StudioPhase) => void;
  setSelectedFormat: (format: DocFormat) => void;
  setActiveDocId: (id: string) => void;
  setActiveProjectId: (projectId: string | null) => void;
  createDocument: (title?: string, content?: string, format?: DocFormat, projectId?: string | null) => string;
  createFromTemplate: (templateId: string, projectId?: string | null) => string;
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
}

const STORAGE_KEY = 'anticeil_docs_v2';
const FOLDERS_STORAGE_KEY = 'anticeil_doc_folders_v2';

function getDefaultMainFileName(format: DocFormat): string {
  if (format === 'slide') return 'main.slide';
  if (format === 'sheet') return 'sheet1.csv';
  if (format === 'latex') return 'main.tex';
  return 'main.md';
}

function ensureDocFiles(doc: DocItem): DocItem {
  if (doc.files && doc.files.length > 0) {
    const hasMain = doc.files.some((f) => f.isMain);
    const files = hasMain
      ? doc.files
      : doc.files.map((f, i) => (i === 0 ? { ...f, isMain: true } : f));
    const activeFileId = doc.activeFileId || (files.find((f) => f.isMain) || files[0]).id;
    return { ...doc, files, activeFileId };
  }

  const defaultName = getDefaultMainFileName(doc.format);
  const mainSubFile: DocSubFile = {
    id: 'subfile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: defaultName,
    content: doc.content || '',
    isMain: true,
    createdAt: doc.updatedAt || Date.now(),
    updatedAt: doc.updatedAt || Date.now(),
  };

  return {
    ...doc,
    files: [mainSubFile],
    activeFileId: mainSubFile.id,
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
  const initialActiveId = initialDocs.length > 0 ? initialDocs[0].id : null;

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

  return {
    documents: initialDocs,
    folders: initialFolders,
    activeDocId: initialActiveId,
    activeProjectId: null,
    studioPhase: 'landing',
    selectedFormat: 'latex',
    viewMode: 'split',
    editorFontSize: 13,
    isCopilotOpen: true,
    isSidebarOpen: true,
    generatingProgress: 0,
    generatingStep: '',

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
        return {
          ...currentDoc,
          files: [...currentFiles, newSubFile],
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
          content: mainFile ? mainFile.content : currentDoc.content,
          activeFileId: nextActiveId,
          updatedAt: Date.now(),
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
      const updated = get().documents.map((d) =>
        d.id === docId ? { ...d, activeFileId: fileId } : d
      );
      set({ documents: updated });
      saveToStorage(updated);
    },

    setStudioPhase: (phase: StudioPhase) => set({ studioPhase: phase }),

    setSelectedFormat: (format: DocFormat) => set({ selectedFormat: format }),

    setActiveDocId: (id: string) => set({ activeDocId: id, studioPhase: 'editor' }),

    setActiveProjectId: (projectId: string | null) => set({ activeProjectId: projectId }),

    createDocument: (
      title = 'Dokumen Baru',
      content = '# Dokumen Baru\n\nKetik di sini dengan format Markdown dan KaTeX $E = mc^2$...\n',
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
      return newDoc.id;
    },

    createFromTemplate: (templateId: string, projectId?: string | null) => {
      const tpl = DOC_TEMPLATES.find((t) => t.id === templateId) || DOC_TEMPLATES[0];
      const assignedProjectId = projectId !== undefined ? projectId : get().activeProjectId;
      const format: DocFormat =
        tpl.id === 'academic-paper' || tpl.id === 'math-physics-notes' ? 'latex' : 'markdown';
      const defaultName = getDefaultMainFileName(format);
      const mainSubFile: DocSubFile = {
        id: 'subfile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: defaultName,
        content: tpl.content,
        isMain: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newDoc: DocItem = {
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: tpl.title,
        content: tpl.content,
        format,
        updatedAt: Date.now(),
        isPinned: false,
        tags: [tpl.category],
        projectId: assignedProjectId || null,
        files: [mainSubFile],
        activeFileId: mainSubFile.id,
      };

      const updated = [newDoc, ...get().documents];
      set({ documents: updated, activeDocId: newDoc.id, studioPhase: 'editor' });
      saveToStorage(updated);
      return newDoc.id;
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

      set({ documents: remaining, activeDocId: nextActiveId });
      saveToStorage(remaining);
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

    setViewMode: (mode: DocsViewMode) => set({ viewMode: mode }),

    setEditorFontSize: (size: number) => set({ editorFontSize: size }),

    toggleCopilot: () => set((s) => ({ isCopilotOpen: !s.isCopilotOpen })),

    toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

    setGeneratingStatus: (progress: number, step: string) =>
      set({ generatingProgress: progress, generatingStep: step }),
  };
});
