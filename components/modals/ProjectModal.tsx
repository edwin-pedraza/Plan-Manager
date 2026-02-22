import React, { useEffect, useMemo, useState } from 'react';
import { Project, Stage } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { getLocale } from '@/context/i18n';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: Project) => void;
  editingProject?: Project | null;
  onUpdateProject?: (project: Project) => void;
}

const STAGE_NAMES: Record<'en' | 'es', string[]> = {
  en: ['Planning', 'Discovery', 'Development', 'Testing', 'Validation', 'Launch'],
  es: ['Planeacion', 'Descubrimiento', 'Desarrollo', 'Pruebas', 'Verificacion', 'Lanzamiento'],
};

const createDefaultStages = (stageNames: string[]): Stage[] =>
  stageNames.map((name, index) => ({
    id: `stg-${Date.now()}-${index}`,
    name,
    order: index,
  }));

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onAddProject, editingProject, onUpdateProject }) => {
  const { language } = useAppContext();
  const locale = getLocale(language);

  const text = language === 'es'
    ? {
        editProject: 'Editar proyecto',
        newProject: 'Nuevo proyecto',
        updateInfo: 'Actualizar informacion',
        initialSetup: 'Configuracion inicial',
        projectName: 'Nombre del proyecto',
        nameRequired: 'El nombre del proyecto es obligatorio.',
        projectPlaceholder: 'Ej: Rediseno E-commerce 2026',
        shortDescription: 'Descripcion corta',
        descriptionPlaceholder: 'Objetivos principales del proyecto...',
        dueDate: 'Fecha limite del proyecto',
        optional: '(opcional)',
        limitPrefix: 'Limite:',
        standardFlow: 'Flujo estandar incluido',
        cancel: 'Cancelar',
        saveChanges: 'Guardar cambios',
        createProject: 'Crear proyecto',
      }
    : {
        editProject: 'Edit project',
        newProject: 'New project',
        updateInfo: 'Update information',
        initialSetup: 'Initial setup',
        projectName: 'Project name',
        nameRequired: 'Project name is required.',
        projectPlaceholder: 'e.g. E-commerce redesign 2026',
        shortDescription: 'Short description',
        descriptionPlaceholder: 'Main project goals...',
        dueDate: 'Project due date',
        optional: '(optional)',
        limitPrefix: 'Due:',
        standardFlow: 'Standard flow included',
        cancel: 'Cancel',
        saveChanges: 'Save changes',
        createProject: 'Create project',
      };

  const defaultStageNames = useMemo(() => STAGE_NAMES[language], [language]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [nameError, setNameError] = useState('');
  const isEditMode = !!editingProject;

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description);
      setDueDate(editingProject.dueDate ?? '');
    } else if (isOpen) {
      setName('');
      setDescription('');
      setDueDate('');
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(text.nameRequired);
      return;
    }
    setNameError('');

    if (isEditMode && editingProject && onUpdateProject) {
      onUpdateProject({
        ...editingProject,
        name,
        description,
        dueDate: dueDate || undefined,
      });
    } else {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name,
        description,
        dueDate: dueDate || undefined,
        stages: createDefaultStages(defaultStageNames),
        tasks: []
      };

      onAddProject(newProject);
    }
    onClose();
  };

  const stageNames = isEditMode && editingProject
    ? editingProject.stages.map(stage => stage.name)
    : defaultStageNames;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in duration-300">
        <div className="px-4 py-4 sm:px-8 sm:py-6 text-white" style={{ background: 'linear-gradient(to right, #1A365D, #2D3748)' }}>
          <h3 className="text-xl font-black tracking-tight">
            {isEditMode ? text.editProject : text.newProject}
          </h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            {isEditMode ? text.updateInfo : text.initialSetup}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{text.projectName}</label>
            <input
              required
              maxLength={100}
              className={`w-full bg-slate-50 border rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4299E1] focus:bg-white transition-all font-bold text-slate-800 ${nameError ? 'border-red-400' : 'border-slate-200'}`}
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); }}
              placeholder={text.projectPlaceholder}
            />
            {nameError && <p className="text-xs text-red-500 font-bold mt-1"><i className="fas fa-exclamation-triangle mr-1"></i>{nameError}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{text.shortDescription}</label>
            <textarea
              maxLength={2000}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4299E1] focus:bg-white transition-all h-28 resize-none text-slate-600"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={text.descriptionPlaceholder}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              {text.dueDate} <span className="font-medium normal-case tracking-normal text-slate-300">{text.optional}</span>
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4299E1] focus:bg-white transition-all font-bold text-slate-800"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
            {dueDate && (
              <p className="text-[10px] font-medium text-slate-400 mt-1.5">
                <i className="fas fa-calendar-check mr-1" style={{ color: '#4299E1' }}></i>
                {text.limitPrefix} {new Date(dueDate + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          <div className="rounded-2xl p-4 border" style={{ background: 'rgba(66,153,225,0.06)', borderColor: 'rgba(66,153,225,0.2)' }}>
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center" style={{ color: '#4299E1' }}>
              <i className="fas fa-layer-group mr-2"></i> {text.standardFlow}
            </h4>
            <div className="flex flex-wrap gap-2">
              {stageNames.map(stageName => (
                <span key={stageName} className="text-[9px] bg-white px-2 py-1 rounded-full font-bold" style={{ border: '1px solid rgba(66,153,225,0.25)', color: '#1A365D' }}>
                  {stageName}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-grow py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            >
              {text.cancel}
            </button>
            <button
              type="submit"
              className="flex-grow py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl active:scale-[0.95] transition-all"
              style={{ background: '#4299E1' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#3182CE'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4299E1'; }}
            >
              {isEditMode ? text.saveChanges : text.createProject}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
