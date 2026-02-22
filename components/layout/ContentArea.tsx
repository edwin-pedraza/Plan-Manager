import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { t } from '@/context/i18n';
import Dashboard from '@/components/views/Dashboard';
import GanttChart from '@/components/views/GanttChart';
import Board from '@/components/views/Board';
import TimeTracker from '@/components/views/TimeTracker';
import AIPlanner from '@/components/views/AIPlanner';
import AdminPanel from '@/components/views/AdminPanel';

const ContentArea: React.FC = () => {
  const {
    activeView, activeProject, insights, isLoading, isLoadingInsights,
    aiSettings, timeLogs,
    updateTaskStatus, openTaskModal, openProjectModal, addProjectFromPlan, addLog, updateLog, deleteLog,
    language,
  } = useAppContext();
  const urgencyLabel = (urgency: 'Low' | 'Medium' | 'High') => {
    if (language === 'es') {
      if (urgency === 'High') return 'Alta';
      if (urgency === 'Medium') return 'Media';
      return 'Baja';
    }
    return urgency;
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
          <p className="text-sm text-slate-500 font-bold">{t(language, 'loadingData')}</p>
        </div>
      </div>
    );
  }

  if (!activeProject && activeView !== 'Admin') {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-folder-open text-3xl text-slate-300"></i>
          </div>
          <h2 className="text-lg font-black text-slate-700 mb-2">{t(language, 'noActiveProject')}</h2>
          <p className="text-sm text-slate-400 mb-6">{t(language, 'createNewProjectPrompt')}</p>
          <button
            onClick={() => openProjectModal()}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
          >
            <i className="fas fa-plus-circle mr-2"></i>
            {t(language, 'createProject')}
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeView === 'Admin') return <AdminPanel />;

    const p = activeProject!;
    switch (activeView) {
      case 'Dashboard':
        return <Dashboard project={p} />;
      case 'Gantt':
        return <GanttChart project={p} onEditTask={openTaskModal} />;
      case 'Weekly':
        return (
          <TimeTracker
            project={p}
            timeLogs={timeLogs}
            onAddLog={addLog}
            onUpdateLog={updateLog}
            onDeleteLog={deleteLog}
          />
        );
      case 'AIPlanner':
        if (!aiSettings.enabled) {
          return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-robot text-2xl"></i>
              </div>
              <p className="font-bold text-lg text-slate-600">{t(language, 'aiDisabled')}</p>
              <p className="text-sm mt-2">{t(language, 'enableAIFromAdmin')}</p>
            </div>
          );
        }
        return <AIPlanner onPlanGenerated={addProjectFromPlan} model={aiSettings.model} />;
      case 'Board':
        return <Board project={p} onUpdateTaskStatus={updateTaskStatus} onEditTask={openTaskModal} />;
      default:
        return <Dashboard project={p} />;
    }
  };

  const isFullWidth = activeView === 'Gantt' || activeView === 'Dashboard' || activeView === 'Admin';

  return (
    <div className={`flex-grow overflow-y-auto bg-[#f8fafc] ${isFullWidth ? 'p-3 md:p-4 lg:p-6' : 'p-3 sm:p-5 md:p-6 lg:p-10'}`}>
      <div className={isFullWidth
        ? 'space-y-6 pb-8 animate-in fade-in duration-700'
        : 'max-w-7xl mx-auto space-y-10 pb-16 animate-in fade-in slide-in-from-bottom-2 duration-700'
      }>

        {insights.length > 0 && activeView === 'Dashboard' && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>

            <div className="flex items-center mb-8 relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mr-4 border border-white/20">
                <i className="fas fa-brain text-blue-400"></i>
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight leading-none mb-1">{t(language, 'projectIntelligence')}</h2>
                <p className="text-[10px] text-blue-300/80 font-black uppercase tracking-[0.2em]">{t(language, 'suggestionsBasedOnCurrentData')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 relative z-10">
              {insights.slice(0, 3).map((insight, idx) => (
                <div key={idx} className="group bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-blue-400/50 hover:bg-white/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                      insight.urgency === 'High' ? 'bg-red-500/80' :
                      insight.urgency === 'Medium' ? 'bg-amber-500/80' : 'bg-green-500/80'
                    }`}>
                      {t(language, 'priority')} {urgencyLabel(insight.urgency)}
                    </span>
                  </div>
                  <h4 className="font-black text-sm mb-2 text-blue-50 tracking-tight">{insight.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium group-hover:text-slate-200 transition-colors">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoadingInsights && activeView === 'Dashboard' && insights.length === 0 && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-2xl flex items-center justify-center">
            <i className="fas fa-spinner fa-spin mr-3 text-blue-400"></i>
            <span className="text-sm text-slate-300">{t(language, 'analyzingWithAI')}</span>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

export default ContentArea;
