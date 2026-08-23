import { create } from 'zustand';

interface AutomationState {
  activeWorkflowTitle: string | null;
  activeWorkflowId: string | null;
  setActiveWorkflow: (id: string | null, title: string | null) => void;
}

export const useAutomationStore = create<AutomationState>((set) => ({
  activeWorkflowTitle: null,
  activeWorkflowId: null,
  setActiveWorkflow: (id, title) => set({ activeWorkflowId: id, activeWorkflowTitle: title }),
}));
