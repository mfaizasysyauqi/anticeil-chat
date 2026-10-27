import type { KanbanCard } from '@/features/kanban';

export type AssignmentItem = KanbanCard;

export type AssignmentTab = 'assigned_to_me' | 'upcoming' | 'overdue' | 'completed';
