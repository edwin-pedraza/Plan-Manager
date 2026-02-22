
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done';
export type Language = 'en' | 'es';

export interface Task {
  id: string;
  title: string;
  description: string;
  stageId: string;
  status: TaskStatus;
  startDate: string; // ISO string
  endDate: string; // ISO string
  estimatedHours: number;
  actualHours: number;
  assignee: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  dueDate?: string; // ISO date string, e.g. "2025-07-31"
  stages: Stage[];
  tasks: Task[];
}

export interface TimeLog {
  id: string;
  taskId: string;
  stageId?: string;
  date: string;
  hours: number;
  userId: string;
}

export interface AISettings {
  enabled: boolean;
  model: string;
}

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
];

export interface Member {
  id: string;
  name: string;
  role: string;
  color: string; // hex color for avatar
}

export type ViewType = 'Dashboard' | 'Gantt' | 'Board' | 'Weekly' | 'AIPlanner' | 'Admin';
