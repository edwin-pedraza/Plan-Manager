import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { t } from '@/context/i18n';

const getInitials = (name: string) =>
  name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();

const Header: React.FC = () => {
  const {
    projects, activeProjectId, setActiveProjectId,
    activeProject, openProjectModal, openTaskModal, openDeleteProjectModal,
    members, setActiveView,
    language, setLanguage,
    setIsSidebarOpen,
  } = useAppContext();

  const SHOW_COUNT = 4;
  const visibleMembers = members.slice(0, SHOW_COUNT);
  const extraCount = Math.max(0, members.length - SHOW_COUNT);

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-4 py-3 md:px-6 md:py-4 lg:px-10 lg:py-5 flex items-center gap-3 flex-none relative z-30 shadow-sm">
        <button
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Abrir menu"
          className="md:hidden flex-none w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-all text-slate-600"
        >
          <i className="fas fa-bars text-base"></i>
        </button>

        <div className="flex items-center gap-2 md:gap-4 lg:gap-6 flex-1 min-w-0">
          <div className="relative group min-w-0 flex-1 md:flex-none">
            <label className="hidden sm:block absolute -top-3 left-0 text-[9px] font-black uppercase tracking-widest bg-white px-2" style={{ color: '#4299E1' }}>{t(language, 'activeProject')}</label>
            <select
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              aria-label={t(language, 'selectActiveProject')}
              className="appearance-none bg-slate-50 border-2 border-slate-100 rounded-2xl pl-5 pr-12 py-3 text-lg font-black text-slate-900 focus:bg-white transition-all outline-none cursor-pointer min-w-0 w-full md:w-auto md:min-w-[200px] lg:min-w-[300px]"
              style={{ '--tw-ring-color': '#4299E1' } as React.CSSProperties}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <i className="fas fa-chevron-down text-sm"></i>
            </div>
          </div>

          <button
            onClick={() => openProjectModal(activeProject)}
            disabled={!activeProject}
            className="w-12 h-12 bg-slate-100 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed flex-none"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1A365D'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            title={t(language, 'editProject')}
            aria-label={t(language, 'editProject')}
          >
            <i className="fas fa-pen group-hover:scale-110"></i>
          </button>
          <button
            onClick={() => openDeleteProjectModal(activeProject)}
            disabled={!activeProject}
            className="w-12 h-12 bg-slate-100 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed flex-none"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e53e3e'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            title={t(language, 'deleteProject')}
            aria-label={t(language, 'deleteProject')}
          >
            <i className="fas fa-trash group-hover:scale-110"></i>
          </button>
          <button
            onClick={() => openProjectModal()}
            className="w-12 h-12 bg-slate-100 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm group flex-none"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1A365D'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            title={t(language, 'addNewProject')}
            aria-label={t(language, 'addNewProject')}
          >
            <i className="fas fa-folder-plus group-hover:scale-110"></i>
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4 lg:gap-6 flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <span className="hidden md:inline text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t(language, 'language')}</span>
            <button
              onClick={() => setLanguage('en')}
              aria-label={language === 'es' ? 'Cambiar a ingles' : 'Switch to English'}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              aria-label={language === 'es' ? 'Cambiar a espanol' : 'Switch to Spanish'}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${language === 'es' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ES
            </button>
          </div>

          <button
            onClick={() => setActiveView('Admin')}
            className="hidden lg:flex flex-col items-end mr-4 group cursor-pointer"
            title={t(language, 'goToAdmin')}
            aria-label={t(language, 'viewTeam')}
          >
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 transition-colors group-hover:text-[#4299E1]">
              {t(language, 'team')}
            </span>
            <div className="flex -space-x-2">
              {visibleMembers.map(member => (
                <div
                  key={member.id}
                  title={`${member.name}${member.role ? ` - ${member.role}` : ''}`}
                  className="w-9 h-9 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-white ring-1 ring-white/30 flex-shrink-0"
                  style={{ background: member.color }}
                >
                  {getInitials(member.name)}
                </div>
              ))}
              {extraCount > 0 && (
                <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 ring-1 ring-slate-100 flex-shrink-0">
                  +{extraCount}
                </div>
              )}
              {members.length === 0 && (
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
                  <i className="fas fa-user-plus text-[9px]"></i>
                </div>
              )}
            </div>
          </button>

          <button
            onClick={() => openTaskModal()}
            disabled={!activeProject}
            aria-label={t(language, 'newTask')}
            className="text-white px-3 py-2.5 md:px-5 md:py-3 lg:px-8 lg:py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-xl active:scale-95 transition-all flex items-center gap-2 min-w-[44px] min-h-[44px] justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#4299E1', boxShadow: '0 8px 24px rgba(66,153,225,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#3182CE'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#4299E1'; }}
          >
            <i className="fas fa-plus-circle text-sm"></i>
            <span className="hidden md:inline">{t(language, 'newTask')}</span>
          </button>
        </div>
      </header>

    </>
  );
};

export default Header;
