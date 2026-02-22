import React, { useEffect, useState } from 'react';
import { Project } from '@/types';
import { useAppContext } from '@/context/AppContext';

interface DeleteProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: (projectId: string) => void;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({ isOpen, project, onClose, onConfirm }) => {
  const { language } = useAppContext();

  const text = language === 'es'
    ? {
        title: 'Eliminar proyecto',
        subtitle: 'Esta accion no se puede deshacer',
        warning: 'Se eliminara el proyecto y todas sus tareas.',
        summary: 'Resumen',
        project: 'Proyecto',
        tasks: 'Tareas',
        noTasks: 'Sin tareas',
        cancel: 'Cancelar',
        confirmDelete: 'Confirmar eliminacion',
        deleteProject: 'Eliminar proyecto',
      }
    : {
        title: 'Delete project',
        subtitle: 'This action cannot be undone',
        warning: 'The project and all its tasks will be deleted.',
        summary: 'Summary',
        project: 'Project',
        tasks: 'Tasks',
        noTasks: 'No tasks',
        cancel: 'Cancel',
        confirmDelete: 'Confirm deletion',
        deleteProject: 'Delete project',
      };

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [isOpen, project?.id]);

  if (!isOpen || !project) return null;

  const taskNames = project.tasks.map(task => task.title);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onConfirm(project.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-4 sm:px-8 sm:py-6 text-white">
          <h3 className="text-xl font-black tracking-tight">{text.title}</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{text.subtitle}</p>
        </div>

        <div className="p-4 sm:p-8 space-y-4 sm:space-y-5">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-sm text-red-800 font-bold">
              {text.warning}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{text.summary}</div>
            <div className="text-sm font-bold text-slate-800 mb-3">
              {text.project}: <span className="font-black">{project.name}</span>
            </div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              {text.tasks} ({taskNames.length})
            </div>
            {taskNames.length > 0 ? (
              <ul className="text-sm text-slate-700 space-y-1 max-h-40 overflow-auto">
                {taskNames.map(name => (
                  <li key={name} className="flex items-center">
                    <i className="fas fa-circle text-[6px] text-red-400 mr-2"></i>
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">{text.noTasks}</p>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-8 sm:pb-8 flex gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-grow py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            {text.cancel}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`flex-grow py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
              confirmDelete
                ? 'bg-red-600 text-white shadow-xl hover:bg-red-700'
                : 'text-red-500 hover:text-white hover:bg-red-600'
            }`}
          >
            {confirmDelete ? text.confirmDelete : text.deleteProject}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
