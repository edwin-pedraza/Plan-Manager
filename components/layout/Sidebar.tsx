import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { t } from '@/context/i18n';
import { ViewType } from '@/types';
import NavItem from './NavItem';

const Sidebar: React.FC = () => {
  const {
    activeView, setActiveView,
    isSidebarOpen, setIsSidebarOpen,
    language,
  } = useAppContext();

  const handleNav = (view: ViewType) => {
    setActiveView(view);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  return (
    <aside style={{ background: '#1A365D' }} className={`text-white flex-none transition-all duration-300 overflow-hidden z-50 fixed inset-y-0 left-0 md:relative md:inset-auto md:z-40 ${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
      <div className="md:hidden absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Cerrar menu"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <i className="fas fa-times text-lg"></i>
        </button>
      </div>
      <div className="p-5 flex items-center space-x-3 overflow-hidden h-20">
        <img
          src="/LogoEdwin.svg"
          alt="Planea"
          className={`flex-none transition-all duration-300 ${isSidebarOpen ? 'h-10 w-auto' : 'h-8 w-auto'}`}
        />
        {isSidebarOpen && (
          <span className="font-black text-xl tracking-tight" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            Planea
          </span>
        )}
      </div>

      <nav className="mt-6 px-3 space-y-2">
        <NavItem icon="fa-chart-pie" label={t(language, 'dashboard')} active={activeView === 'Dashboard'} onClick={() => handleNav('Dashboard')} collapsed={!isSidebarOpen} />
        <NavItem icon="fa-align-left" label={t(language, 'roadmap')} active={activeView === 'Gantt'} onClick={() => handleNav('Gantt')} collapsed={!isSidebarOpen} />
        <NavItem icon="fa-layer-group" label={t(language, 'kanbanBoard')} active={activeView === 'Board'} onClick={() => handleNav('Board')} collapsed={!isSidebarOpen} />
        <NavItem icon="fa-stopwatch" label={t(language, 'implementation')} active={activeView === 'Weekly'} onClick={() => handleNav('Weekly')} collapsed={!isSidebarOpen} />

        <div className="pt-8 pb-2 border-t border-slate-800/50 my-4">
          {isSidebarOpen && <span className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t(language, 'system')}</span>}
        </div>

        <NavItem
          icon="fa-shield-halved"
          label={t(language, 'administration')}
          active={activeView === 'Admin'}
          onClick={() => handleNav('Admin')}
          collapsed={!isSidebarOpen}
        />
      </nav>

      <div className="hidden md:block absolute bottom-8 left-0 w-full px-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? t(language, 'collapseSidebar') : t(language, 'expandSidebar')}
          className="w-full flex items-center p-3.5 rounded-xl hover:bg-slate-800 text-slate-500 transition-all group"
        >
          <i className={`fas ${isSidebarOpen ? 'fa-angles-left' : 'fa-angles-right'} w-6 transition-transform group-hover:scale-110`}></i>
          {isSidebarOpen && <span className="ml-3 font-bold text-xs uppercase tracking-widest">{t(language, 'collapse')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
