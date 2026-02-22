import { useState, useEffect, useMemo } from 'react';
import { Project, Task, TaskStatus } from '@/types';
import { StorageService } from '@/services/storageService';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => StorageService.loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => StorageService.loadActiveProjectId());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    StorageService.loadData().then((data) => {
      if (!alive) return;
      setProjects(data.projects);
      setActiveProjectId(data.activeProjectId || data.projects[0]?.id || '');
      setIsHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    StorageService.saveProjects(projects);
  }, [projects, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    StorageService.saveActiveProjectId(activeProjectId);
  }, [activeProjectId, isHydrated]);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  const addProject = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const addProjectFromPlan = (newPlan: Omit<Project, 'id'>) => {
    const newProject: Project = { ...newPlan, id: `p-ai-${Date.now()}` };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    return newProject;
  };

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = { ...taskData, id: `task-${Date.now()}` };
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
    ));
  };

  const updateTask = (updatedTask: Task) => {
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? {
        ...p,
        tasks: p.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
      } : p
    ));
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => (p.id === updatedProject.id ? updatedProject : p)));
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== projectId);
      setActiveProjectId(current => (current === projectId ? (next[0]?.id ?? '') : current));
      return next;
    });
  };

  const deleteTask = (taskId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? {
        ...p,
        tasks: p.tasks.filter(t => t.id !== taskId)
      } : p
    ));
  };

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      } : p
    ));
  };

  const addActualHours = (taskId: string, hours: number) => {
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId
          ? { ...t, actualHours: Math.max(0, t.actualHours + hours) }
          : t
        )
      } : p
    ));
  };

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    isHydrated,
    addProject,
    addProjectFromPlan,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    addActualHours,
    updateProject,
    deleteProject,
  };
}
