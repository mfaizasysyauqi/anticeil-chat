'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MediaType = 'image' | 'video' | 'audio';

export function getMediaType(url?: string, explicitType?: string): MediaType {
  if (explicitType === 'video' || explicitType === 'audio' || explicitType === 'image') return explicitType;
  if (!url) return 'image';
  const u = url.toLowerCase();
  if (u.includes('.webm') || u.includes('.mp4') || u.includes('.mov') || u.startsWith('data:video/')) return 'video';
  if (u.includes('.mp3') || u.includes('.wav') || u.includes('.ogg') || u.includes('.m4a') || u.startsWith('data:audio/')) return 'audio';
  return 'image';
}

export interface MediaRevision {
  id: string;
  version: number;
  url: string;
  prompt: string;
  mediaType?: MediaType;
  revisedFromId?: string | null;
  revisionInstruction?: string;
  model: string;
  style: string;
  ratio: string;
  seed: number;
  createdAt: number;
  width?: number;
  height?: number;
}

export interface MediaProject {
  id: string;
  title: string;
  revisions: MediaRevision[];
  activeRevisionId: string;
  isPinned?: boolean;
  collectionId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export type MediaViewMode = 'split' | 'coeditor' | 'canvas';

interface MediaEditorState {
  projects: MediaProject[];
  activeProjectId: string | null;
  isGenerating: boolean;
  comparisonMode: boolean;
  compareWithRevisionId: string | null;
  zoomPercent: number; // 0 = Fit, 50, 100, 200
  isCanvasOpen: boolean;
  viewMode: MediaViewMode;

  // Actions
  createProject: (initialData: {
    prompt: string;
    url: string;
    model: string;
    style: string;
    ratio: string;
    seed: number;
    title?: string;
    mediaType?: MediaType;
  }) => string;
  addRevision: (
    projectId: string,
    revisionData: {
      prompt: string;
      url: string;
      revisionInstruction: string;
      model: string;
      style: string;
      ratio: string;
      seed: number;
      revisedFromId: string;
      mediaType?: MediaType;
    }
  ) => void;
  setActiveRevision: (projectId: string, revisionId: string) => void;
  setActiveProject: (projectId: string | null) => void;
  setComparisonMode: (enabled: boolean, compareWithId?: string | null) => void;
  setZoomPercent: (zoom: number) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsCanvasOpen: (open: boolean) => void;
  setViewMode: (mode: MediaViewMode) => void;
  renameProject: (projectId: string, title: string) => void;
  toggleProjectPin: (projectId: string) => void;
  moveProjectToCollection: (projectId: string, collectionId: string | null) => void;
  deleteProject: (projectId: string) => void;
  deleteRevision: (projectId: string, revisionId: string) => void;
}

export const useMediaEditorStore = create<MediaEditorState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      isGenerating: false,
      comparisonMode: false,
      compareWithRevisionId: null,
      zoomPercent: 0, // 0 means 'Fit'
      isCanvasOpen: true,
      viewMode: 'split',

      setIsCanvasOpen: (open) => {
        set((state) => ({
          isCanvasOpen: open,
          viewMode: open ? (state.viewMode === 'coeditor' ? 'split' : state.viewMode) : 'coeditor',
        }));
      },
      setViewMode: (mode) => {
        set({
          viewMode: mode,
          isCanvasOpen: mode !== 'coeditor',
        });
      },

      createProject: ({ prompt, url, model, style, ratio, seed, title, mediaType }) => {
        const projId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const revId = `rev_${Date.now()}_1`;
        const autoTitle = title || prompt.slice(0, 36) || 'Untitled Media';

        const initialRevision: MediaRevision = {
          id: revId,
          version: 1,
          url,
          prompt,
          mediaType: getMediaType(url, mediaType),
          model,
          style,
          ratio,
          seed,
          createdAt: Date.now(),
        };

        const newProject: MediaProject = {
          id: projId,
          title: autoTitle,
          revisions: [initialRevision],
          activeRevisionId: revId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          projects: [newProject, ...state.projects],
          activeProjectId: projId,
          comparisonMode: false,
          compareWithRevisionId: null,
        }));

        return projId;
      },

      addRevision: (projectId, revisionData) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (!project) return state;

          const nextVersion = project.revisions.length + 1;
          const newRevId = `rev_${Date.now()}_${nextVersion}`;

          const newRevision: MediaRevision = {
            id: newRevId,
            version: nextVersion,
            url: revisionData.url,
            prompt: revisionData.prompt,
            mediaType: getMediaType(revisionData.url, revisionData.mediaType),
            revisionInstruction: revisionData.revisionInstruction,
            revisedFromId: revisionData.revisedFromId,
            model: revisionData.model,
            style: revisionData.style,
            ratio: revisionData.ratio,
            seed: revisionData.seed,
            createdAt: Date.now(),
          };

          const updatedProject: MediaProject = {
            ...project,
            revisions: [...project.revisions, newRevision],
            activeRevisionId: newRevId,
            updatedAt: Date.now(),
          };

          return {
            projects: state.projects.map((p) => (p.id === projectId ? updatedProject : p)),
            comparisonMode: false,
            compareWithRevisionId: revisionData.revisedFromId,
          };
        });
      },

      setActiveRevision: (projectId, revisionId) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (!project) return state;

          const currentActiveIdx = project.revisions.findIndex((r) => r.id === revisionId);
          const prevRevision = currentActiveIdx > 0 ? project.revisions[currentActiveIdx - 1] : null;

          return {
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, activeRevisionId: revisionId } : p
            ),
            comparisonMode: false,
            compareWithRevisionId: prevRevision ? prevRevision.id : null,
          };
        });
      },

      setActiveProject: (projectId) => {
        set({ activeProjectId: projectId, comparisonMode: false, compareWithRevisionId: null });
      },

      setComparisonMode: (enabled, compareWithId) => {
        set({
          comparisonMode: enabled,
          compareWithRevisionId: compareWithId !== undefined ? compareWithId : get().compareWithRevisionId,
        });
      },

      setZoomPercent: (zoom) => set({ zoomPercent: zoom }),

      setIsGenerating: (generating) => set({ isGenerating: generating }),

      renameProject: (projectId, title) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === projectId ? { ...p, title } : p)),
        }));
      },

      toggleProjectPin: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, isPinned: !p.isPinned } : p
          ),
        }));
      },

      moveProjectToCollection: (projectId, collectionId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, collectionId } : p
          ),
        }));
      },

      deleteProject: (projectId) => {
        set((state) => {
          const nextProjects = state.projects.filter((p) => p.id !== projectId);
          const nextActiveId =
            state.activeProjectId === projectId
              ? nextProjects.length > 0
                ? nextProjects[0].id
                : null
              : state.activeProjectId;
          return { projects: nextProjects, activeProjectId: nextActiveId };
        });
      },

      deleteRevision: (projectId, revisionId) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (!project || project.revisions.length <= 1) return state;

          const filteredRevisions = project.revisions.filter((r) => r.id !== revisionId);
          const nextActiveRevId =
            project.activeRevisionId === revisionId
              ? filteredRevisions[filteredRevisions.length - 1].id
              : project.activeRevisionId;

          return {
            projects: state.projects.map((p) =>
              p.id === projectId
                ? { ...p, revisions: filteredRevisions, activeRevisionId: nextActiveRevId }
                : p
            ),
          };
        });
      },
    }),
    {
      name: 'anticeil_media_editor_store',
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
        isCanvasOpen: state.isCanvasOpen,
        viewMode: state.viewMode,
      }),
    }
  )
);
