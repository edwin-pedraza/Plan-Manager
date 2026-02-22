
import React, { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ContentArea from '@/components/layout/ContentArea';
import TaskModal from '@/components/modals/TaskModal';
import ProjectModal from '@/components/modals/ProjectModal';
import DeleteProjectModal from '@/components/modals/DeleteProjectModal';
import { StorageService } from '@/services/storageService';
import { t } from '@/context/i18n';

const App: React.FC = () => {
  const {
    activeProject, members,
    isTaskModalOpen, closeTaskModal, editingTask,
    addTask, updateTask, deleteTask,
    isProjectModalOpen, closeProjectModal, addProject, updateProject, editingProject,
    isDeleteProjectModalOpen, closeDeleteProjectModal, deleteProject, deletingProject,
    language,
    isSidebarOpen, setIsSidebarOpen,
  } = useAppContext();

  const { addToast } = useToast();

  useEffect(() => {
    StorageService.onSaveError((error) => {
      addToast(`${t(language, 'saveError')}: ${error.message}`, 'error');
    });
  }, [addToast, language]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="min-h-screen flex text-slate-900 bg-[#fbfcfd]">
      <Sidebar />
      <main className="flex-grow flex flex-col h-screen overflow-hidden min-w-0">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <Header />
        <ContentArea />

        {activeProject && (
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={closeTaskModal}
            stages={activeProject.stages}
            members={members}
            onAddTask={addTask}
            editingTask={editingTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}

        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={closeProjectModal}
          onAddProject={addProject}
          editingProject={editingProject}
          onUpdateProject={updateProject}
        />

        <DeleteProjectModal
          isOpen={isDeleteProjectModalOpen}
          project={deletingProject}
          onClose={closeDeleteProjectModal}
          onConfirm={deleteProject}
        />
      </main>
    </div>
  );
};

export default App;
