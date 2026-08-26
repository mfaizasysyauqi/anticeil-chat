'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger?: string;
  action?: string;
  status: 'active' | 'paused';
  lastRun?: string;
  runsCount: number;
  categoryId?: string | null;
  nodes?: any[];
  edges?: any[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowRunLog {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'success' | 'failed';
  triggerSource: string;
  durationMs: number;
  timestamp: number;
  outputSummary?: string;
}

interface AutomationState {
  workflows: AutomationWorkflow[];
  runsHistory: WorkflowRunLog[];
  isLoading: boolean;
  error: string | null;
  activeWorkflowId: string | null;
  activeWorkflowTitle: string | null;

  // Actions
  fetchWorkflows: (accessToken?: string) => Promise<void>;
  createWorkflow: (data: Partial<AutomationWorkflow>, accessToken?: string) => Promise<AutomationWorkflow>;
  updateWorkflow: (id: string, updates: Partial<AutomationWorkflow>, accessToken?: string) => Promise<void>;
  deleteWorkflow: (id: string, accessToken?: string) => Promise<void>;
  toggleWorkflowStatus: (id: string, accessToken?: string) => Promise<void>;
  incrementRunsCount: (id: string, accessToken?: string) => Promise<void>;
  addRunLog: (log: WorkflowRunLog) => void;
  setActiveWorkflow: (id: string | null, title?: string | null) => void;
  reset: () => void;
}

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set, get) => ({
      workflows: [],
      runsHistory: [],
      isLoading: false,
      error: null,
      activeWorkflowId: null,
      activeWorkflowTitle: null,

      reset: () => set({ workflows: [], runsHistory: [], activeWorkflowId: null, activeWorkflowTitle: null, error: null }),

      addRunLog: (log) => set((s) => ({ runsHistory: [log, ...s.runsHistory].slice(0, 50) })),

      fetchWorkflows: async (accessToken) => {
        if (!accessToken) return;
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/automations/workflows', {
            headers: authHeaders(accessToken),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const { workflows } = await res.json();
          if (Array.isArray(workflows)) {
            set({ workflows, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      createWorkflow: async (data, accessToken) => {
        const id = data.id || `wf_${Date.now().toString(36)}`;
        const newWf: AutomationWorkflow = {
          id,
          name: data.name || 'Alur Kerja AI Baru',
          description: data.description || '',
          trigger: data.trigger || 'Manual Trigger',
          action: data.action || 'AI Agent Processing',
          status: data.status || 'active',
          lastRun: 'Belum pernah',
          runsCount: 0,
          categoryId: data.categoryId || null,
          nodes: data.nodes || [],
          edges: data.edges || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Optimistic UI update
        set((s) => ({
          workflows: [newWf, ...s.workflows.filter((w) => w.id !== id)],
          activeWorkflowId: id,
          activeWorkflowTitle: newWf.name,
        }));

        if (accessToken) {
          try {
            const res = await fetch('/api/automations/workflows', {
              method: 'POST',
              headers: authHeaders(accessToken),
              body: JSON.stringify(newWf),
            });
            if (res.ok) {
              const resData = await res.json();
              if (resData.workflow) {
                set((s) => ({
                  workflows: s.workflows.map((w) => (w.id === id ? resData.workflow : w)),
                }));
              }
            }
          } catch (err: any) {
            console.warn('Sync workflow creation to Supabase failed (persisted locally):', err.message);
          }
        }

        return newWf;
      },

      updateWorkflow: async (id, updates, accessToken) => {
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
          ),
          activeWorkflowTitle: updates.name !== undefined ? updates.name : s.activeWorkflowTitle,
        }));

        if (accessToken) {
          try {
            await fetch(`/api/automations/workflows/${id}`, {
              method: 'PATCH',
              headers: authHeaders(accessToken),
              body: JSON.stringify(updates),
            });
          } catch (err: any) {
            console.warn('Sync workflow update to Supabase failed (persisted locally):', err.message);
          }
        }
      },

      deleteWorkflow: async (id, accessToken) => {
        set((s) => ({
          workflows: s.workflows.filter((w) => w.id !== id),
          activeWorkflowId: s.activeWorkflowId === id ? null : s.activeWorkflowId,
          activeWorkflowTitle: s.activeWorkflowId === id ? null : s.activeWorkflowTitle,
        }));

        if (accessToken) {
          try {
            await fetch(`/api/automations/workflows/${id}`, {
              method: 'DELETE',
              headers: authHeaders(accessToken),
            });
          } catch (err: any) {
            console.warn('Sync workflow deletion to Supabase failed (removed locally):', err.message);
          }
        }
      },

      toggleWorkflowStatus: async (id, accessToken) => {
        const wf = get().workflows.find((w) => w.id === id);
        if (!wf) return;
        const newStatus = wf.status === 'active' ? 'paused' : 'active';
        await get().updateWorkflow(id, { status: newStatus }, accessToken);
      },

      incrementRunsCount: async (id, accessToken) => {
        const wf = get().workflows.find((w) => w.id === id);
        if (!wf) return;
        const runsCount = (wf.runsCount || 0) + 1;
        const lastRun = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        await get().updateWorkflow(id, { runsCount, lastRun }, accessToken);
      },

      setActiveWorkflow: (id, title) => {
        set({ activeWorkflowId: id, activeWorkflowTitle: title ?? null });
      },
    }),
    {
      name: 'anticeil_automations_storage',
      partialize: (state) => ({
        workflows: state.workflows,
        activeWorkflowId: state.activeWorkflowId,
        activeWorkflowTitle: state.activeWorkflowTitle,
      }),
    }
  )
);
