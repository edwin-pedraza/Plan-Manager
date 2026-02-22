import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project, Task, TaskStatus, TimeLog, ViewType, AISettings, Member, Language } from '@/types';
import { Insight } from '@/services/geminiService';
import { useProjects } from '@/hooks/useProjects';
import { useTimeLogs } from '@/hooks/useTimeLogs';
import { useAISettings } from '@/hooks/useAISettings';
import { useInsights } from '@/hooks/useInsights';
import { useModals } from '@/hooks/useModals';
import { useMembers } from '@/hooks/useMembers';
import { useLanguage } from '@/hooks/useLanguage';

interface AppContextValue {
  // Projects
  projects: Project[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  activeProject: Project | undefined;
  isLoading: boolean;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  addProjectFromPlan: (plan: Omit<Project, 'id'>) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;

  // Time logs
  timeLogs: TimeLog[];
  addLog: (log: Omit<TimeLog, 'id'>) => void;
  updateLog: (logId: string, updates: Pick<TimeLog, 'hours' | 'date'>) => void;
  deleteLog: (logId: string) => void;

  // AI
  aiSettings: AISettings;
  toggleAI: () => void;
  setModel: (model: string) => void;
  insights: Insight[];
  isLoadingInsights: boolean;

  // View
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;

  // Members
  members: Member[];
  addMember: (data: Omit<Member, 'id'>) => void;
  updateMember: (member: Member) => void;
  deleteMember: (memberId: string) => void;

  // Modals
  isTaskModalOpen: boolean;
  isProjectModalOpen: boolean;
  isDeleteProjectModalOpen: boolean;
  editingTask: Task | null;
  editingProject: Project | null;
  deletingProject: Project | null;
  openTaskModal: (task?: Task) => void;
  closeTaskModal: () => void;
  openProjectModal: (project?: Project) => void;
  closeProjectModal: () => void;
  openDeleteProjectModal: (project?: Project) => void;
  closeDeleteProjectModal: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const projectsHook = useProjects();
  const timeLogsHook = useTimeLogs();
  const aiSettingsHook = useAISettings();
  const { insights, isLoadingInsights } = useInsights(projectsHook.activeProject, aiSettingsHook.aiSettings);
  const modalsHook = useModals();
  const membersHook = useMembers();
  const languageHook = useLanguage();

  const [activeView, setActiveView] = useState<ViewType>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Hydration-aware backfill: only run once both hooks have loaded from server
  useEffect(() => {
    if (!projectsHook.isHydrated || !timeLogsHook.isHydrated) return;
    const taskStageMap = new Map<string, string>();
    projectsHook.projects.forEach(project => {
      project.tasks.forEach(task => {
        taskStageMap.set(task.id, task.stageId);
      });
    });
    timeLogsHook.backfillStageIds(taskStageMap);
  }, [projectsHook.projects, timeLogsHook.timeLogs, projectsHook.isHydrated, timeLogsHook.isHydrated]);

  // Cross-hook: deleteTask also removes associated time logs
  const deleteTask = (taskId: string) => {
    projectsHook.deleteTask(taskId);
    timeLogsHook.removeLogsForTask(taskId);
  };

  const deleteProject = (projectId: string) => {
    const project = projectsHook.projects.find(p => p.id === projectId);
    const taskIds = project ? project.tasks.map(t => t.id) : [];
    projectsHook.deleteProject(projectId);
    timeLogsHook.removeLogsForTasks(taskIds);
  };

  // Cross-hook: addLog also updates actual hours on the task
  const addLog = (log: Omit<TimeLog, 'id'>) => {
    timeLogsHook.addLog(log);
    projectsHook.addActualHours(log.taskId, log.hours);
  };

  const updateLog = (logId: string, updates: Pick<TimeLog, 'hours' | 'date'>) => {
    const existing = timeLogsHook.timeLogs.find(l => l.id === logId);
    if (!existing) return;
    timeLogsHook.updateLog(logId, updates);
    const delta = updates.hours - existing.hours;
    if (delta !== 0) {
      projectsHook.addActualHours(existing.taskId, delta);
    }
  };

  const deleteLog = (logId: string) => {
    const existing = timeLogsHook.timeLogs.find(l => l.id === logId);
    if (!existing) return;
    timeLogsHook.deleteLog(logId);
    projectsHook.addActualHours(existing.taskId, -existing.hours);
  };

  // Cross-hook: addProject also navigates to Dashboard
  const addProject = (project: Project) => {
    projectsHook.addProject(project);
    setActiveView('Dashboard');
  };

  const updateProject = (project: Project) => {
    projectsHook.updateProject(project);
  };

  // Cross-hook: addProjectFromPlan also navigates to Dashboard
  const addProjectFromPlan = (plan: Omit<Project, 'id'>) => {
    projectsHook.addProjectFromPlan(plan);
    setActiveView('Dashboard');
  };

  const value: AppContextValue = {
    projects: projectsHook.projects,
    activeProjectId: projectsHook.activeProjectId,
    setActiveProjectId: projectsHook.setActiveProjectId,
    activeProject: projectsHook.activeProject,
    isLoading: !projectsHook.isHydrated,
    addProject,
    updateProject,
    deleteProject,
    addProjectFromPlan,
    addTask: projectsHook.addTask,
    updateTask: projectsHook.updateTask,
    deleteTask,
    updateTaskStatus: projectsHook.updateTaskStatus,

    timeLogs: timeLogsHook.timeLogs,
    addLog,
    updateLog,
    deleteLog,

    aiSettings: aiSettingsHook.aiSettings,
    toggleAI: aiSettingsHook.toggleAI,
    setModel: aiSettingsHook.setModel,
    insights,
    isLoadingInsights,

    activeView,
    setActiveView,
    isSidebarOpen,
    setIsSidebarOpen,
    language: languageHook.language,
    setLanguage: languageHook.setLanguage,
    toggleLanguage: languageHook.toggleLanguage,

    members: membersHook.members,
    addMember: membersHook.addMember,
    updateMember: membersHook.updateMember,
    deleteMember: membersHook.deleteMember,

    ...modalsHook,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
