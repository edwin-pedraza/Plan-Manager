import { useState } from 'react';
import { Project, Task } from '@/types';

export function useModals() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const openTaskModal = (task?: Task) => {
    setEditingTask(task || null);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const openProjectModal = (project?: Project) => {
    setEditingProject(project || null);
    setIsProjectModalOpen(true);
  };

  const closeProjectModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  const openDeleteProjectModal = (project?: Project) => {
    setDeletingProject(project || null);
    setIsDeleteProjectModalOpen(true);
  };

  const closeDeleteProjectModal = () => {
    setIsDeleteProjectModalOpen(false);
    setDeletingProject(null);
  };

  return {
    isTaskModalOpen,
    isProjectModalOpen,
    isDeleteProjectModalOpen,
    editingTask,
    editingProject,
    deletingProject,
    openTaskModal,
    closeTaskModal,
    openProjectModal,
    closeProjectModal,
    openDeleteProjectModal,
    closeDeleteProjectModal,
  };
}
