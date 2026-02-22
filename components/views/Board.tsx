import React, { useState } from 'react';
import { Project, Task, TaskStatus } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { getStatusLabel } from '@/context/i18n';

interface BoardProps {
  project: Project;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
}

const Board: React.FC<BoardProps> = ({ project, onUpdateTaskStatus, onEditTask }) => {
  const { language } = useAppContext();

  const text = language === 'es'
    ? {
        allStages: 'Todas las etapas',
        noTasks: 'Sin tareas',
        general: 'General',
        moveTo: 'Mover a',
      }
    : {
        allStages: 'All stages',
        noTasks: 'No tasks',
        general: 'General',
        moveTo: 'Move to',
      };

  const statuses: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Done'];
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [activeMobileColumn, setActiveMobileColumn] = useState<TaskStatus>('In Progress');

  const filteredTasks = selectedStageId
    ? project.tasks.filter(t => t.stageId === selectedStageId)
    : project.tasks;

  const getTaskCountForStage = (stageId: string) =>
    project.tasks.filter(t => t.stageId === stageId).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStageId(null)}
          className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
            selectedStageId === null
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
          }`}
        >
          {text.allStages}
          <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">
            {project.tasks.length}
          </span>
        </button>
        {project.stages.map(stage => (
          <button
            key={stage.id}
            onClick={() => setSelectedStageId(stage.id === selectedStageId ? null : stage.id)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              selectedStageId === stage.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300'
            }`}
          >
            {stage.name}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] ${
              selectedStageId === stage.id ? 'bg-white/20' : 'bg-slate-100'
            }`}>
              {getTaskCountForStage(stage.id)}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile view: tab strip + single column cards */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {statuses.map(status => {
            const count = filteredTasks.filter(t => t.status === status).length;
            const dotColor = status === 'Done' ? 'bg-green-500' : status === 'In Progress' ? 'bg-blue-500' : status === 'Review' ? 'bg-amber-500' : 'bg-slate-400';
            return (
              <button
                key={status}
                onClick={() => setActiveMobileColumn(status)}
                className={`flex-none flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest min-h-[44px] transition-all ${
                  activeMobileColumn === status
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}></span>
                {getStatusLabel(language, status)}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeMobileColumn === status ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredTasks.filter(t => t.status === activeMobileColumn).length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <i className="fas fa-inbox text-2xl mb-2 block text-slate-300"></i>
              <p className="text-xs font-bold">{text.noTasks}</p>
            </div>
          ) : (
            filteredTasks.filter(t => t.status === activeMobileColumn).map(task => {
              const statusIndex = statuses.indexOf(activeMobileColumn);
              const prevStatus = statusIndex > 0 ? statuses[statusIndex - 1] : null;
              const nextStatus = statusIndex < statuses.length - 1 ? statuses[statusIndex + 1] : null;
              return (
                <div
                  key={task.id}
                  onClick={() => onEditTask?.(task)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      {project.stages.find(s => s.id === task.stageId)?.name || text.general}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      {prevStatus && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdateTaskStatus(task.id, prevStatus); }}
                          className="flex items-center gap-1 px-2 min-h-[36px] rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title={`${text.moveTo} ${getStatusLabel(language, prevStatus)}`}
                          aria-label={`${text.moveTo} ${getStatusLabel(language, prevStatus)}`}
                        >
                          <i className="fas fa-arrow-left text-[9px]"></i>
                          {getStatusLabel(language, prevStatus)}
                        </button>
                      )}
                      {nextStatus && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdateTaskStatus(task.id, nextStatus); }}
                          className="flex items-center gap-1 px-2 min-h-[36px] rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title={`${text.moveTo} ${getStatusLabel(language, nextStatus)}`}
                          aria-label={`${text.moveTo} ${getStatusLabel(language, nextStatus)}`}
                        >
                          {getStatusLabel(language, nextStatus)}
                          <i className="fas fa-arrow-right text-[9px]"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm mb-2">{task.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{task.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded">
                      <i className="far fa-clock mr-1"></i>
                      {task.estimatedHours}h
                    </div>
                    <img className="w-6 h-6 rounded-full border border-white shadow-sm" src={`https://ui-avatars.com/api/?name=${task.assignee}&background=random`} alt={task.assignee} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Desktop view: 4-column kanban */}
      <div className="hidden lg:flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
        {statuses.map(status => (
          <div key={status} className="flex-none w-80 bg-slate-100/50 rounded-xl p-4 flex flex-col border border-slate-200">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-bold text-slate-700 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  status === 'Done' ? 'bg-green-500' :
                  status === 'In Progress' ? 'bg-blue-500' :
                  status === 'Review' ? 'bg-amber-500' : 'bg-slate-400'
                }`}></span>
                {getStatusLabel(language, status)}
                <span className="ml-2 bg-white text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-200">
                  {filteredTasks.filter(t => t.status === status).length}
                </span>
              </h3>
            </div>

            <div className="flex-grow space-y-3 overflow-y-auto pr-1">
              {filteredTasks.filter(t => t.status === status).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <i className="fas fa-inbox text-2xl mb-2 block text-slate-300"></i>
                  <p className="text-xs font-bold">{text.noTasks}</p>
                </div>
              )}
              {filteredTasks.filter(t => t.status === status).map(task => {
                const statusIndex = statuses.indexOf(status);
                const prevStatus = statusIndex > 0 ? statuses[statusIndex - 1] : null;
                const nextStatus = statusIndex < statuses.length - 1 ? statuses[statusIndex + 1] : null;
                return (
                  <div
                    key={task.id}
                    onClick={() => onEditTask?.(task)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {project.stages.find(s => s.id === task.stageId)?.name || text.general}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end gap-1">
                        {prevStatus && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onUpdateTaskStatus(task.id, prevStatus); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title={`${text.moveTo} ${getStatusLabel(language, prevStatus)}`}
                            aria-label={`${text.moveTo} ${getStatusLabel(language, prevStatus)}`}
                          >
                            <i className="fas fa-arrow-left text-[9px]"></i>
                            {getStatusLabel(language, prevStatus)}
                          </button>
                        )}
                        {nextStatus && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onUpdateTaskStatus(task.id, nextStatus); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title={`${text.moveTo} ${getStatusLabel(language, nextStatus)}`}
                            aria-label={`${text.moveTo} ${getStatusLabel(language, nextStatus)}`}
                          >
                            {getStatusLabel(language, nextStatus)}
                            <i className="fas fa-arrow-right text-[9px]"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="font-semibold text-slate-800 text-sm mb-2">{task.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{task.description}</p>
                    <div className="flex justify-between items-center mt-auto">
                      <div className="flex items-center text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        <i className="far fa-clock mr-1"></i>
                        {task.estimatedHours}h
                      </div>
                      <img className="w-6 h-6 rounded-full border border-white shadow-sm" src={`https://ui-avatars.com/api/?name=${task.assignee}&background=random`} alt={task.assignee} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;
