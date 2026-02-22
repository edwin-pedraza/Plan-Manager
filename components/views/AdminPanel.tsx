
import React, { useMemo, useState } from 'react';
import { AVAILABLE_MODELS, Member } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { getLocale, getStatusLabel } from '@/context/i18n';

// --- Helpers ---

const MEMBER_COLORS = ['#4299E1','#9F7AEA','#38B2AC','#ED8936','#ef4444','#63B3ED','#3182CE','#1A365D'];

const getInitials = (name: string) =>
  name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();

const STATUS_COLORS: Record<string, string> = {
  'Todo': '#94a3b8', 'In Progress': '#4299E1', 'Review': '#ED8936', 'Done': '#38B2AC',
};

// --- Member Form Modal ---

interface MemberFormProps {
  initial?: Member;
  onSave: (data: Omit<Member, 'id'>) => void;
  onClose: () => void;
  language: 'en' | 'es';
}

const MemberForm: React.FC<MemberFormProps> = ({ initial, onSave, onClose, language }) => {
  const l = (es: string, en: string) => (language === 'es' ? es : en);
  const [name, setName]   = useState(initial?.name  ?? '');
  const [role, setRole]   = useState(initial?.role  ?? '');
  const [color, setColor] = useState(initial?.color ?? MEMBER_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), role: role.trim(), color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black text-slate-800">
            {initial ? l('Editar miembro', 'Edit member') : l('Anadir miembro', 'Add member')}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <i className="fas fa-times text-slate-400 text-sm"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar preview */}
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
              style={{ background: color }}
            >
              {getInitials(name || '??')}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              {l('Nombre completo', 'Full name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={l('Ej. Ana Martinez', 'e.g. Jane Doe')}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all"
              style={{ '--tw-ring-color': '#4299E1' } as React.CSSProperties}
              onFocus={e => { e.currentTarget.style.borderColor = '#4299E1'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(66,153,225,0.15)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              {l('Rol / Cargo', 'Role / Title')}
            </label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder={l('Ej. Desarrollador Frontend', 'e.g. Frontend Developer')}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all"
              onFocus={e => { e.currentTarget.style.borderColor = '#4299E1'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(66,153,225,0.15)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              {l('Color de avatar', 'Avatar color')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {MEMBER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: color === c ? '#1e293b' : 'transparent' }}
                  aria-label={l(`Color ${c}`, `Color ${c}`)}
                >
                  {color === c && <i className="fas fa-check text-white text-[10px]"></i>}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {l('Cancelar', 'Cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold active:scale-95 transition-all shadow-md"
              style={{ background: '#4299E1' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#3182CE'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4299E1'; }}
            >
              {initial ? l('Guardar cambios', 'Save changes') : l('Anadir miembro', 'Add member')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Member Card ---

interface MemberCardProps {
  member: Member;
  taskStats: { total: number; done: number; inProgress: number; overdue: number; estHours: number; actHours: number; projectNames: string[] };
  onEdit: () => void;
  onDelete: () => void;
  language: 'en' | 'es';
}

const MemberCard: React.FC<MemberCardProps> = ({ member, taskStats, onEdit, onDelete, language }) => {
  const l = (es: string, en: string) => (language === 'es' ? es : en);
  const { total, done, inProgress, overdue, estHours, actHours, projectNames } = taskStats;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const statusBreakdown = [
    { key: 'Done',        value: done,                      color: STATUS_COLORS['Done'] },
    { key: 'In Progress', value: inProgress,                color: STATUS_COLORS['In Progress'] },
    { key: 'Todo',        value: total - done - inProgress, color: STATUS_COLORS['Todo'] },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-all group">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-md"
          style={{ background: member.color }}
        >
          {getInitials(member.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-800 truncate">{member.name}</p>
          <p className="text-[10px] text-slate-400 font-medium truncate">{member.role || l('Sin rol', 'No role')}</p>
        </div>
        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg text-slate-400 flex items-center justify-center transition-colors"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(66,153,225,0.1)'; (e.currentTarget as HTMLElement).style.color = '#4299E1'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = ''; }}
            title={l('Editar', 'Edit')}
          >
            <i className="fas fa-pen text-[10px]"></i>
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors"
            title={l('Eliminar', 'Delete')}
          >
            <i className="fas fa-trash text-[10px]"></i>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: l('Tareas', 'Tasks'), value: total, color: 'text-slate-800' },
          { label: l('Completadas', 'Completed'), value: done, color: 'text-green-600' },
          { label: l('Atrasadas', 'Overdue'), value: overdue, color: overdue > 0 ? 'text-red-500' : 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className={`text-lg font-black leading-none ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar (task status breakdown) */}
      {total > 0 && (
        <div>
          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            <span>{l('Progreso', 'Progress')}</span>
            <span>{completionPct}%</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 gap-px">
            {statusBreakdown.filter(s => s.value > 0).map(s => (
              <div
                key={s.key}
                className="h-full transition-all duration-700"
                style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                title={`${getStatusLabel(language, s.key as 'Todo' | 'In Progress' | 'Review' | 'Done')}: ${s.value}`}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* Hours */}
      <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 border-t border-slate-100 pt-3">
        <span><span className="text-slate-700 font-bold">{actHours}h</span> {l('registradas', 'logged')}</span>
        <span><span className="text-slate-700 font-bold">{estHours}h</span> {l('estimadas', 'estimated')}</span>
      </div>

      {/* Projects */}
      {projectNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {projectNames.slice(0, 3).map(name => (
            <span key={name} className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full truncate max-w-[120px]">{name}</span>
          ))}
          {projectNames.length > 3 && (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">+{projectNames.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

// --- Project Row ---

interface ProjectRowProps {
  project: { id: string; name: string; description: string; taskCount: number; done: number; overdue: number; completionPct: number; estHours: number; actHours: number; stageCount: number; teamSize: number };
  language: 'en' | 'es';
}

const ProjectRow: React.FC<ProjectRowProps> = ({ project: p, language }) => {
  const l = (es: string, en: string) => (language === 'es' ? es : en);
  return (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all">
    {/* Color dot + name */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-black text-slate-800 truncate">{p.name}</p>
      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{p.description || l('Sin descripcion', 'No description')}</p>
    </div>
    {/* Progress bar */}
    <div className="w-28 hidden sm:block">
      <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
        <span>{l('Avance', 'Progress')}</span>
        <span>{p.completionPct}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${p.completionPct}%` }}></div>
      </div>
    </div>
    {/* Chips */}
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">{p.taskCount} {l('tareas', 'tasks')}</span>
      <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">{p.stageCount} {l('etapas', 'stages')}</span>
      <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">{p.teamSize} {l('miembros', 'members')}</span>
      {p.overdue > 0 && (
        <span className="text-[10px] font-bold px-2.5 py-1 bg-red-50 text-red-500 rounded-lg">{p.overdue} {l('atrasadas', 'overdue')}</span>
      )}
    </div>
  </div>
  );
};

// --- Main ---

const AdminPanel: React.FC = () => {
  const {
    projects, members, addMember, updateMember, deleteMember,
    aiSettings, toggleAI, setModel, setActiveView,
    language,
  } = useAppContext();
  const locale = getLocale(language);
  const l = (es: string, en: string) => (language === 'es' ? es : en);
  const [showForm, setShowForm]         = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const allTasks = useMemo(() => projects.flatMap(p => p.tasks), [projects]);

  // Member task stats
  const memberStats = useMemo(() => {
    return members.map(member => {
      const memberTasks = allTasks.filter(t => t.assignee === member.name);
      const projectNames = [...new Set(
        projects.filter(p => p.tasks.some(t => t.assignee === member.name)).map(p => p.name)
      )];
      return {
        member,
        taskStats: {
          total:      memberTasks.length,
          done:       memberTasks.filter(t => t.status === 'Done').length,
          inProgress: memberTasks.filter(t => t.status === 'In Progress').length,
          overdue:    memberTasks.filter(t => new Date(t.endDate) < today && t.status !== 'Done').length,
          estHours:   memberTasks.reduce((s, t) => s + t.estimatedHours, 0),
          actHours:   memberTasks.reduce((s, t) => s + t.actualHours, 0),
          projectNames,
        },
      };
    });
  }, [members, allTasks, projects, today]);

  // Project stats
  const projectStats = useMemo(() => projects.map(p => {
    const done = p.tasks.filter(t => t.status === 'Done').length;
    const overdue = p.tasks.filter(t => new Date(t.endDate) < today && t.status !== 'Done').length;
    const teamSize = new Set(p.tasks.map(t => t.assignee).filter(Boolean)).size;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      taskCount: p.tasks.length,
      done,
      overdue,
      completionPct: p.tasks.length > 0 ? Math.round((done / p.tasks.length) * 100) : 0,
      estHours: p.tasks.reduce((s, t) => s + t.estimatedHours, 0),
      actHours: p.tasks.reduce((s, t) => s + t.actualHours, 0),
      stageCount: p.stages.length,
      teamSize,
    };
  }), [projects, today]);

  // Global KPIs
  const totalEstHours = allTasks.reduce((s, t) => s + t.estimatedHours, 0);
  const totalActHours = allTasks.reduce((s, t) => s + t.actualHours, 0);
  const totalDone     = allTasks.filter(t => t.status === 'Done').length;
  const globalPct     = allTasks.length > 0 ? Math.round((totalDone / allTasks.length) * 100) : 0;
  const canOpenAIPlanner = aiSettings.enabled && projects.length > 0;

  const handleDeleteConfirm = (memberId: string) => {
    deleteMember(memberId);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{l('Administracion', 'Administration')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{l('Gestion del equipo de trabajo y resumen de proyectos', 'Team management and project summary')}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: l('Proyectos', 'Projects'), value: projects.length, icon: 'fa-folder', color: '#4299E1' },
          { label: l('Total tareas', 'Total tasks'), value: allTasks.length, icon: 'fa-tasks', color: '#9F7AEA' },
          { label: l('Equipo', 'Team'), value: members.length, icon: 'fa-users', color: '#38B2AC' },
          { label: l('Completado', 'Completed'), value: `${globalPct}%`, icon: 'fa-chart-line', color: '#ED8936' },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3"
            style={{ borderLeftWidth: 4, borderLeftColor: kpi.color }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: kpi.color + '18' }}>
              <i className={`fas ${kpi.icon} text-sm`} style={{ color: kpi.color }}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-3xl font-black text-slate-900 leading-none">{kpi.value}</p>
              {kpi.label === l('Completado', 'Completed') && (
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${globalPct}%`, background: '#ED8936' }}></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Settings */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">{l('Control de IA', 'AI control')}</h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {l('Gestiona el acceso al asistente y al planificador de IA desde administracion.', 'Manage assistant and AI planner access from administration.')}
            </p>
          </div>
          <button
            onClick={toggleAI}
            aria-label={aiSettings.enabled ? l('Desactivar IA', 'Disable AI') : l('Activar IA', 'Enable AI')}
            className={`relative w-12 h-6 rounded-full transition-colors ${aiSettings.enabled ? 'bg-teal-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${aiSettings.enabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              {l('Modelo de IA', 'AI model')}
            </label>
            <select
              value={aiSettings.model}
              onChange={e => setModel(e.target.value)}
              aria-label={l('Seleccionar modelo de IA', 'Select AI model')}
              disabled={!aiSettings.enabled}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setActiveView('AIPlanner')}
            disabled={!canOpenAIPlanner}
            className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-slate-300 disabled:hover:bg-slate-300 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <i className="fas fa-wand-sparkles mr-2 text-[10px]"></i>
            {l('Abrir planificador IA', 'Open AI planner')}
          </button>
        </div>

        {!aiSettings.enabled && (
          <p className="text-[11px] text-slate-500">{l('Activa la IA para habilitar el planificador.', 'Enable AI to use the planner.')}</p>
        )}
        {aiSettings.enabled && projects.length === 0 && (
          <p className="text-[11px] text-slate-500">{l('Crea un proyecto para usar el planificador de IA.', 'Create a project to use the AI planner.')}</p>
        )}
      </section>

      {/* Team */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">{l('Equipo de trabajo', 'Team')}</h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {members.length} {language === 'es' ? `miembro${members.length !== 1 ? 's' : ''} registrado${members.length !== 1 ? 's' : ''}` : `member${members.length !== 1 ? 's' : ''} registered`}
            </p>
          </div>
          <button
            onClick={() => { setEditingMember(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-md"
            style={{ background: '#4299E1' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#3182CE'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4299E1'; }}
          >
            <i className="fas fa-user-plus text-xs"></i>
            {l('Anadir miembro', 'Add member')}
          </button>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            <i className="fas fa-users text-3xl mb-3"></i>
            <p className="font-bold text-sm">{l('No hay miembros registrados', 'No registered members')}</p>
            <p className="text-xs mt-1">{l('Anade miembros del equipo para empezar', 'Add team members to get started')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {memberStats.map(({ member, taskStats }) => (
              <MemberCard
                key={member.id}
                member={member}
                taskStats={taskStats}
                language={language}
                onEdit={() => { setEditingMember(member); setShowForm(true); }}
                onDelete={() => setDeleteConfirm(member.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Projects */}
      <section>
        <div className="mb-4">
          <h2 className="text-sm font-black text-slate-800 tracking-tight">{l('Resumen de proyectos', 'Project summary')}</h2>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {projects.length} {language === 'es' ? `proyecto${projects.length !== 1 ? 's' : ''} activo${projects.length !== 1 ? 's' : ''}` : `active project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l('Proyecto', 'Project')}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">{l('Progreso', 'Progress')}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l('Estado', 'Status')}</span>
          </div>
          {projectStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <p className="text-sm">{l('No hay proyectos', 'No projects')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projectStats.map(p => (
                <div key={p.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_auto] gap-4 items-center px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  {/* Name */}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{p.description || l('Sin descripcion', 'No description')}</p>
                  </div>
                  {/* Progress */}
                  <div className="hidden sm:block">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5">
                      <span>{l('Avance', 'Progress')}</span><span>{p.completionPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p.completionPct}%`, background: '#4299E1' }}></div>
                    </div>
                  </div>
                  {/* Chips */}
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">{p.taskCount} {l('tareas', 'tasks')}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">{p.teamSize} {l('eq.', 'team')}</span>
                    {p.overdue > 0 && (
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-red-50 text-red-500 rounded-md">{p.overdue} {l('tarde', 'late')}</span>
                    )}
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1" style={{ background: 'rgba(56,178,172,0.12)', color: '#38B2AC' }}>
                      {p.done}
                      <i className="fas fa-check text-[8px]"></i>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Member Form Modal */}
      {showForm && (
        <MemberForm
          initial={editingMember ?? undefined}
          language={language}
          onSave={(data) => {
            if (editingMember) updateMember({ ...editingMember, ...data });
            else addMember(data);
            setShowForm(false);
            setEditingMember(null);
          }}
          onClose={() => { setShowForm(false); setEditingMember(null); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
            </div>
            <h3 className="text-base font-black text-slate-800 text-center mb-2">{l('Eliminar miembro?', 'Delete member?')}</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              {l('El miembro sera eliminado de la lista del equipo. Las tareas asignadas no se modificaran.', 'The member will be removed from the team list. Assigned tasks will not be modified.')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {l('Cancelar', 'Cancel')}
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all"
              >
                {l('Eliminar', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

