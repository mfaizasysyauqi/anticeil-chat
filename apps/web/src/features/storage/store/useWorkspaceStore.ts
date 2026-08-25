'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStorageStore } from './useStorageStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkspaceFile {
  id: string;
  name: string;
  size: number;       // bytes
  contentType: string;
  r2Key: string;
  publicUrl: string | null;
  uploadedAt: number; // epoch ms
  category: 'docs' | 'images' | 'audio' | 'other';
}

export interface ProjectFolder {
  id: string;
  name: string;
  createdAt: number;
  files: WorkspaceFile[];
  sessionIds: string[]; // chat sessions assigned to this project
}

export interface ImageCollection {
  id: string;
  name: string;
  createdAt: number;
  files: WorkspaceFile[];
}

export interface WorkflowCategory {
  id: string;
  name: string;
  createdAt: number;
  files: WorkspaceFile[];
}

export interface DocumentCategory {
  id: string;
  name: string;
  createdAt: number;
  files: WorkspaceFile[];
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface WorkspaceState {
  // Data
  projects: ProjectFolder[];
  imageCollections: ImageCollection[];
  workflowCategories: WorkflowCategory[];
  documentCategories: DocumentCategory[];

  // Active selections (drive sidebar filter)
  activeProjectId: string | null;
  activeImageCollectionId: string | null;
  activeWorkflowCategoryId: string | null;
  activeDocumentCategoryId: string | null;

  // ── Project Actions ────────────────────────────────────────────────────────
  createProject: (name: string) => string;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  addFileToProject: (projectId: string, file: WorkspaceFile) => void;
  removeFileFromProject: (projectId: string, fileId: string) => void;
  assignSessionToProject: (projectId: string, sessionId: string) => void;
  removeSessionFromProject: (projectId: string, sessionId: string) => void;

  // ── Image Collection Actions ───────────────────────────────────────────────
  createImageCollection: (name: string) => string;
  renameImageCollection: (id: string, name: string) => void;
  deleteImageCollection: (id: string) => void;
  setActiveImageCollection: (id: string | null) => void;
  addFileToImageCollection: (collectionId: string, file: WorkspaceFile) => void;
  removeFileFromImageCollection: (collectionId: string, fileId: string) => void;

  // ── Workflow Category Actions ──────────────────────────────────────────────
  createWorkflowCategory: (name: string) => string;
  renameWorkflowCategory: (id: string, name: string) => void;
  deleteWorkflowCategory: (id: string) => void;
  setActiveWorkflowCategory: (id: string | null) => void;
  addFileToWorkflowCategory: (categoryId: string, file: WorkspaceFile) => void;
  removeFileFromWorkflowCategory: (categoryId: string, fileId: string) => void;

  // ── Document Category Actions ──────────────────────────────────────────────
  createDocumentCategory: (name: string) => string;
  renameDocumentCategory: (id: string, name: string) => void;
  deleteDocumentCategory: (id: string) => void;
  setActiveDocumentCategory: (id: string | null) => void;
  addFileToDocumentCategory: (categoryId: string, file: WorkspaceFile) => void;
  removeFileFromDocumentCategory: (categoryId: string, fileId: string) => void;

  // ── Utility ───────────────────────────────────────────────────────────────
  getTotalFileCount: () => number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // ── Initial Data ────────────────────────────────────────────────────────
      projects: [],
      imageCollections: [],
      workflowCategories: [
        { id: 'wc_productivity', name: 'Productivity', createdAt: Date.now(), files: [] },
        { id: 'wc_marketing', name: 'Marketing', createdAt: Date.now(), files: [] },
        { id: 'wc_crm', name: 'CRM & Leads', createdAt: Date.now(), files: [] },
      ],
      documentCategories: [
        { id: 'dc_all', name: 'Semua Dokumen', createdAt: Date.now(), files: [] },
        { id: 'dc_contracts', name: 'Kontrak & Invoice', createdAt: Date.now(), files: [] },
        { id: 'dc_research', name: 'Laporan Riset', createdAt: Date.now(), files: [] },
      ],

      activeProjectId: null,
      activeImageCollectionId: null,
      activeWorkflowCategoryId: null,
      activeDocumentCategoryId: null,

      // ── Project ──────────────────────────────────────────────────────────────
      createProject: (name) => {
        const id = `proj_${uid()}`;
        set((s) => ({
          projects: [...s.projects, { id, name, createdAt: Date.now(), files: [], sessionIds: [] }],
        }));
        return id;
      },
      renameProject: (id, name) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)) })),
      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        })),
      setActiveProject: (id) => set({ activeProjectId: id }),
      addFileToProject: (projectId, file) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, files: [...p.files, file] } : p
          ),
        })),
      removeFileFromProject: (projectId, fileId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, files: p.files.filter((f) => f.id !== fileId) } : p
          ),
        })),
      assignSessionToProject: (projectId, sessionId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId && !p.sessionIds.includes(sessionId)
              ? { ...p, sessionIds: [...p.sessionIds, sessionId] }
              : p
          ),
        })),
      removeSessionFromProject: (projectId, sessionId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, sessionIds: p.sessionIds.filter((id) => id !== sessionId) } : p
          ),
        })),

      // ── Image Collections ────────────────────────────────────────────────────
      createImageCollection: (name) => {
        const id = `ic_${uid()}`;
        set((s) => ({
          imageCollections: [...s.imageCollections, { id, name, createdAt: Date.now(), files: [] }],
        }));
        return id;
      },
      renameImageCollection: (id, name) =>
        set((s) => ({ imageCollections: s.imageCollections.map((c) => (c.id === id ? { ...c, name } : c)) })),
      deleteImageCollection: (id) =>
        set((s) => ({
          imageCollections: s.imageCollections.filter((c) => c.id !== id),
          activeImageCollectionId: s.activeImageCollectionId === id ? null : s.activeImageCollectionId,
        })),
      setActiveImageCollection: (id) => set({ activeImageCollectionId: id }),
      addFileToImageCollection: (collectionId, file) =>
        set((s) => ({
          imageCollections: s.imageCollections.map((c) =>
            c.id === collectionId ? { ...c, files: [...c.files, file] } : c
          ),
        })),
      removeFileFromImageCollection: (collectionId, fileId) =>
        set((s) => ({
          imageCollections: s.imageCollections.map((c) =>
            c.id === collectionId ? { ...c, files: c.files.filter((f) => f.id !== fileId) } : c
          ),
        })),

      // ── Workflow Categories ──────────────────────────────────────────────────
      createWorkflowCategory: (name) => {
        const id = `wc_${uid()}`;
        set((s) => ({
          workflowCategories: [...s.workflowCategories, { id, name, createdAt: Date.now(), files: [] }],
        }));
        return id;
      },
      renameWorkflowCategory: (id, name) =>
        set((s) => ({ workflowCategories: s.workflowCategories.map((c) => (c.id === id ? { ...c, name } : c)) })),
      deleteWorkflowCategory: (id) =>
        set((s) => ({
          workflowCategories: s.workflowCategories.filter((c) => c.id !== id),
          activeWorkflowCategoryId: s.activeWorkflowCategoryId === id ? null : s.activeWorkflowCategoryId,
        })),
      setActiveWorkflowCategory: (id) => set({ activeWorkflowCategoryId: id }),
      addFileToWorkflowCategory: (categoryId, file) =>
        set((s) => ({
          workflowCategories: s.workflowCategories.map((c) =>
            c.id === categoryId ? { ...c, files: [...c.files, file] } : c
          ),
        })),
      removeFileFromWorkflowCategory: (categoryId, fileId) =>
        set((s) => ({
          workflowCategories: s.workflowCategories.map((c) =>
            c.id === categoryId ? { ...c, files: c.files.filter((f) => f.id !== fileId) } : c
          ),
        })),

      // ── Document Categories ──────────────────────────────────────────────────
      createDocumentCategory: (name) => {
        const id = `dc_${uid()}`;
        set((s) => ({
          documentCategories: [...s.documentCategories, { id, name, createdAt: Date.now(), files: [] }],
        }));
        return id;
      },
      renameDocumentCategory: (id, name) =>
        set((s) => ({ documentCategories: s.documentCategories.map((c) => (c.id === id ? { ...c, name } : c)) })),
      deleteDocumentCategory: (id) => {
        const s = get();
        const category = s.documentCategories.find((c) => c.id === id);
        if (category && category.files.length > 0) {
          const storageStore = useStorageStore.getState();
          category.files.forEach((f) => storageStore.removeUsage(f.size, f.category));
        }
        set((state) => ({
          documentCategories: state.documentCategories.filter((c) => c.id !== id),
          activeDocumentCategoryId: state.activeDocumentCategoryId === id ? null : state.activeDocumentCategoryId,
        }));
      },
      setActiveDocumentCategory: (id) => set({ activeDocumentCategoryId: id }),
      addFileToDocumentCategory: (categoryId, file) =>
        set((s) => ({
          documentCategories: s.documentCategories.map((c) =>
            c.id === categoryId ? { ...c, files: [...c.files, file] } : c
          ),
        })),
      removeFileFromDocumentCategory: (categoryId, fileId) => {
        const s = get();
        const category = s.documentCategories.find((c) => c.id === categoryId);
        const file = category?.files.find((f) => f.id === fileId);
        if (file) {
          useStorageStore.getState().removeUsage(file.size, file.category);
        }
        set((state) => ({
          documentCategories: state.documentCategories.map((c) =>
            c.id === categoryId ? { ...c, files: c.files.filter((f) => f.id !== fileId) } : c
          ),
        }));
      },

      // ── Utility ──────────────────────────────────────────────────────────────
      getTotalFileCount: () => {
        const s = get();
        return (
          s.projects.reduce((a, p) => a + p.files.length, 0) +
          s.imageCollections.reduce((a, c) => a + c.files.length, 0) +
          s.workflowCategories.reduce((a, c) => a + c.files.length, 0) +
          s.documentCategories.reduce((a, c) => a + c.files.length, 0)
        );
      },
    }),
    { name: 'anticeil-workspace-v2' }
  )
);
