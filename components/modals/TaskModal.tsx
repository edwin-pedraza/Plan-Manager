import React, { useState, useEffect, useRef } from 'react';
import { Task, Stage, TaskStatus, Member } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { getStatusLabel } from '@/context/i18n';

const getInitials = (name: string) =>
  name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();

interface MemberPickerText {
  noMembers: string;
  goToAdmin: string;
  unassignedLong: string;
  unassignedShort: string;
}

const MemberPicker: React.FC<{
  members: Member[];
  value: string;
  onChange: (name: string) => void;
  text: MemberPickerText;
}> = ({ members, value, onChange, text }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const selected = members.find(m => m.name === value);

  if (members.length === 0) {
    return (
      <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
        <i className="fas fa-triangle-exclamation text-amber-500 flex-shrink-0 text-sm"></i>
        <p className="text-xs font-medium text-amber-700 leading-snug">
          {text.noMembers} <strong>{text.goToAdmin}</strong>
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full bg-slate-50 border rounded-2xl px-4 py-2.5 flex items-center gap-3 text-left transition-all hover:border-[#4299E1] focus:outline-none ${open ? 'border-[#4299E1] ring-2 ring-[#4299E1]/10' : 'border-slate-200'}`}
      >
        {selected ? (
          <>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 shadow-sm"
              style={{ background: selected.color }}
            >
              {getInitials(selected.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 leading-none truncate">{selected.name}</p>
              {selected.role && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{selected.role}</p>}
            </div>
          </>
        ) : (
          <span className="text-sm text-slate-400 font-medium flex-1">{text.unassignedLong}</span>
        )}
        <i className={`fas fa-chevron-down text-slate-400 text-[10px] flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 ${!value ? 'bg-blue-50/60' : ''}`}
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-user-slash text-slate-400 text-xs"></i>
            </div>
            <span className="text-sm text-slate-400 font-medium flex-1 text-left">{text.unassignedShort}</span>
            {!value && <i className="fas fa-check text-xs flex-shrink-0" style={{ color: '#4299E1' }}></i>}
          </button>
          <div className="max-h-44 overflow-y-auto">
            {members.map(member => (
              <button
                key={member.id}
                type="button"
                onClick={() => { onChange(member.name); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${value === member.name ? 'bg-blue-50/60' : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 shadow-sm"
                  style={{ background: member.color }}
                >
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-slate-800 leading-none truncate">{member.name}</p>
                  {member.role && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{member.role}</p>}
                </div>
                {value === member.name && <i className="fas fa-check text-xs flex-shrink-0" style={{ color: '#4299E1' }}></i>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: Stage[];
  members: Member[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  editingTask?: Task | null;
  onUpdateTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

const getDefaultFormData = (stages: Stage[]) => ({
  title: '',
  description: '',
  stageId: stages.length > 0 ? stages[0].id : '',
  status: 'Todo' as TaskStatus,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
  estimatedHours: 10,
  assignee: ''
});

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, stages, members, onAddTask, editingTask, onUpdateTask, onDeleteTask }) => {
  const { language } = useAppContext();

  const text = language === 'es'
    ? {
        editTask: 'Editar tarea',
        addTask: 'Anadir nueva tarea',
        editSubtitle: 'Modificar tarea existente',
        addSubtitle: 'Asignacion al flujo actual',
        taskName: 'Nombre de la tarea',
        taskNameRequired: 'El nombre de la tarea es obligatorio.',
        taskPlaceholder: 'Ej: Analisis de requisitos tecnicos',
        description: 'Descripcion',
        descriptionPlaceholder: 'Detalla los entregables o pasos...',
        stage: 'Etapa del proyecto',
        status: 'Estado',
        owner: 'Responsable',
        start: 'Inicio',
        end: 'Fin',
        estimatedHours: 'Horas est.',
        badDate: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
        confirmDelete: 'Confirmar eliminacion',
        delete: 'Eliminar',
        discard: 'Descartar',
        updateTask: 'Actualizar tarea',
        confirmTask: 'Confirmar tarea',
        noMembers: 'No hay miembros. Ve a',
        goToAdmin: 'Administracion para anadir el equipo.',
        unassignedLong: '- Sin asignar -',
        unassignedShort: 'Sin asignar',
      }
    : {
        editTask: 'Edit task',
        addTask: 'Add new task',
        editSubtitle: 'Modify existing task',
        addSubtitle: 'Assignment to current workflow',
        taskName: 'Task name',
        taskNameRequired: 'Task name is required.',
        taskPlaceholder: 'e.g. Technical requirements analysis',
        description: 'Description',
        descriptionPlaceholder: 'Describe deliverables or steps...',
        stage: 'Project stage',
        status: 'Status',
        owner: 'Owner',
        start: 'Start',
        end: 'End',
        estimatedHours: 'Est. hours',
        badDate: 'Start date cannot be after end date.',
        confirmDelete: 'Confirm delete',
        delete: 'Delete',
        discard: 'Discard',
        updateTask: 'Update task',
        confirmTask: 'Confirm task',
        noMembers: 'No members found. Go to',
        goToAdmin: 'Administration to add the team.',
        unassignedLong: '- Unassigned -',
        unassignedShort: 'Unassigned',
      };

  const [formData, setFormData] = useState(getDefaultFormData(stages));
  const [dateError, setDateError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditMode = !!editingTask;

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description,
        stageId: editingTask.stageId,
        status: editingTask.status,
        startDate: editingTask.startDate,
        endDate: editingTask.endDate,
        estimatedHours: editingTask.estimatedHours,
        assignee: editingTask.assignee,
      });
    } else if (stages.length > 0) {
      setFormData(getDefaultFormData(stages));
    }
    setDateError('');
    setTitleError('');
    setConfirmDelete(false);
  }, [editingTask, stages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      setTitleError(text.taskNameRequired);
      return;
    }
    setTitleError('');

    if (formData.startDate > formData.endDate) {
      setDateError(text.badDate);
      return;
    }
    setDateError('');

    const hours = isNaN(formData.estimatedHours) || formData.estimatedHours < 0 ? 0 : formData.estimatedHours;

    if (isEditMode && editingTask && onUpdateTask) {
      onUpdateTask({
        ...editingTask,
        ...formData,
        estimatedHours: hours,
      });
    } else {
      onAddTask({
        ...formData,
        estimatedHours: hours,
        actualHours: 0
      });
    }
    onClose();
    setFormData(getDefaultFormData(stages));
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (editingTask && onDeleteTask) {
      onDeleteTask(editingTask.id);
      onClose();
      setFormData(getDefaultFormData(stages));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-50 px-4 py-4 sm:px-8 sm:py-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">
              {isEditMode ? text.editTask : text.addTask}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">
              {isEditMode ? text.editSubtitle : text.addSubtitle}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{text.taskName}</label>
              <input
                required
                maxLength={200}
                className={`w-full bg-slate-50 border rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4299E1] focus:bg-white transition-all font-bold text-slate-800 ${titleError ? 'border-red-400' : 'border-slate-200'}`}
                value={formData.title}
                onChange={e => { setFormData({ ...formData, title: e.target.value }); setTitleError(''); }}
                placeholder={text.taskPlaceholder}
              />
              {titleError && <p className="text-xs text-red-500 font-bold mt-1"><i className="fas fa-exclamation-triangle mr-1"></i>{titleError}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{text.description}</label>
              <textarea
                maxLength={2000}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4299E1] focus:bg-white transition-all h-20 resize-none text-slate-600"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder={text.descriptionPlaceholder}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{text.stage}</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4299E1] transition-all font-bold"
                value={formData.stageId}
                onChange={e => setFormData({ ...formData, stageId: e.target.value })}
              >
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {isEditMode && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{text.status}</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4299E1] transition-all font-bold"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                >
                  <option value="Todo">{getStatusLabel(language, 'Todo')}</option>
                  <option value="In Progress">{getStatusLabel(language, 'In Progress')}</option>
                  <option value="Review">{getStatusLabel(language, 'Review')}</option>
                  <option value="Done">{getStatusLabel(language, 'Done')}</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{text.owner}</label>
              <MemberPicker
                members={members}
                value={formData.assignee}
                onChange={name => setFormData({ ...formData, assignee: name })}
                text={{
                  noMembers: text.noMembers,
                  goToAdmin: text.goToAdmin,
                  unassignedLong: text.unassignedLong,
                  unassignedShort: text.unassignedShort,
                }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:col-span-2">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{text.start}</label>
                <input
                  type="date"
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-[#4299E1] font-bold ${dateError ? 'border-red-400' : 'border-slate-200'}`}
                  value={formData.startDate}
                  onChange={e => { setFormData({ ...formData, startDate: e.target.value }); setDateError(''); }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{text.end}</label>
                <input
                  type="date"
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-[#4299E1] font-bold ${dateError ? 'border-red-400' : 'border-slate-200'}`}
                  value={formData.endDate}
                  onChange={e => { setFormData({ ...formData, endDate: e.target.value }); setDateError(''); }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{text.estimatedHours}</label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4299E1] font-bold"
                  value={formData.estimatedHours}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setFormData({ ...formData, estimatedHours: isNaN(val) ? 0 : Math.max(0, val) });
                  }}
                />
              </div>
            </div>

            {dateError && (
              <div className="md:col-span-2">
                <p className="text-xs text-red-500 font-bold flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {dateError}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3 sm:gap-4">
            {isEditMode && onDeleteTask && (
              <button
                type="button"
                onClick={handleDelete}
                className={`py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  confirmDelete
                    ? 'bg-red-600 text-white shadow-xl hover:bg-red-700'
                    : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                {confirmDelete ? text.confirmDelete : text.delete}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-grow py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
            >
              {text.discard}
            </button>
            <button
              type="submit"
              className="flex-grow py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl active:scale-[0.98] transition-all"
              style={{ background: '#1A365D' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4299E1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1A365D'; }}
            >
              {isEditMode ? text.updateTask : text.confirmTask}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
