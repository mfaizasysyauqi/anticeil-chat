export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  columnId: string; // 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  channelId: string;
  channelName?: string;
  hubId: string;
  hubName?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string | null;
  priority: KanbanPriority;
  dueDate?: string; // YYYY-MM-DD
  tags?: string[];
  createdAt: string;
  completedAt?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
}
