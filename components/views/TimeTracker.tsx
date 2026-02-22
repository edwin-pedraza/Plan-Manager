
import React, { useEffect, useMemo, useState } from 'react';
import { Project, TimeLog } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { getLocale, getStatusLabel } from '@/context/i18n';

interface TimeTrackerProps {
  project: Project;
  timeLogs: TimeLog[];
  onAddLog: (log: Omit<TimeLog, 'id'>) => void;
  onUpdateLog: (logId: string, updates: Pick<TimeLog, 'hours' | 'date'>) => void;
  onDeleteLog: (logId: string) => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ project, timeLogs, onAddLog, onUpdateLog, onDeleteLog }) => {
  const { language } = useAppContext();
  const locale = getLocale(language);
  const l = (es: string, en: string) => (language === 'es' ? es : en);

  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [selectedTaskId, setSelectedTaskId] = useState(project.tasks[0]?.id || '');
  const [logHours, setLogHours] = useState('1');
  const [allowPastEntry, setAllowPastEntry] = useState(false);
  const [focusDate, setFocusDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState('');
  const [editingHours, setEditingHours] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const today = new Date();

  const toInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = toInputDate(today);

  const parseInputDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return new Date();
    return new Date(year, month - 1, day);
  };

  const normalizeDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const startOfWeek = (date: Date) => {
    const d = normalizeDate(date);
    const day = d.getDay();
    const diff = (day + 6) % 7; // Monday start
    d.setDate(d.getDate() - diff);
    return d;
  };

  const endOfWeek = (date: Date) => {
    const start = startOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const isSameDay = (a: Date, b: Date) => (
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
  );

  const formatDayLabel = (date: Date) =>
    date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });

  const formatRange = (start: Date, end: Date) => {
    const startLabel = start.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return `${startLabel} - ${endLabel}`;
  };

  const weekStart = useMemo(() => startOfWeek(focusDate), [focusDate]);
  const weekEnd = useMemo(() => endOfWeek(focusDate), [focusDate]);

  const dates = useMemo(() => {
    if (viewMode === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      });
    }
    // Day view: 3 days before focus, focus, 3 days after
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(focusDate);
      d.setDate(focusDate.getDate() - 3 + i);
      return d;
    });
  }, [viewMode, focusDate, weekStart]);

  const weekLabel = useMemo(() => formatRange(weekStart, weekEnd), [weekStart, weekEnd]);
  const dayLabel = useMemo(() => formatDayLabel(focusDate), [focusDate]);

  const prevWeekLabel = useMemo(() => {
    const start = new Date(weekStart);
    start.setDate(start.getDate() - 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return formatRange(start, end);
  }, [weekStart]);

  const nextWeekLabel = useMemo(() => {
    const start = new Date(weekStart);
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return formatRange(start, end);
  }, [weekStart]);

  const prevDayLabel = useMemo(() => {
    const d = new Date(focusDate);
    d.setDate(focusDate.getDate() - 1);
    return formatDayLabel(d);
  }, [focusDate]);

  const nextDayLabel = useMemo(() => {
    const d = new Date(focusDate);
    d.setDate(focusDate.getDate() + 1);
    return formatDayLabel(d);
  }, [focusDate]);

  const monthLabel = useMemo(
    () => focusDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    [focusDate, locale]
  );

  const calendarStart = useMemo(() => {
    const firstOfMonth = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
    return startOfWeek(firstOfMonth);
  }, [focusDate]);

  const calendarWeeks = useMemo(() => (
    Array.from({ length: 6 }, (_, weekIndex) => (
      Array.from({ length: 7 }, (_, dayIndex) => {
        const d = new Date(calendarStart);
        d.setDate(calendarStart.getDate() + weekIndex * 7 + dayIndex);
        return d;
      })
    ))
  ), [calendarStart]);

  useEffect(() => {
    if (project.tasks.length === 0) {
      setSelectedTaskId('');
      return;
    }
    const exists = project.tasks.some(task => task.id === selectedTaskId);
    if (!exists) {
      setSelectedTaskId(project.tasks[0].id);
    }
    setEditingLogId(null);
    setConfirmDeleteId(null);
  }, [project.id, project.tasks, selectedTaskId]);

  const getHoursForDay = (date: Date, taskId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return timeLogs
      .filter(l => l.taskId === taskId && l.date === dateStr)
      .reduce((sum, l) => sum + l.hours, 0);
  };

  const totalsByTask = useMemo(() => {
    const totals = new Map<string, number>();
    const taskIds = new Set(project.tasks.map(task => task.id));
    timeLogs.forEach(log => {
      if (!taskIds.has(log.taskId)) return;
      totals.set(log.taskId, (totals.get(log.taskId) || 0) + log.hours);
    });
    return totals;
  }, [timeLogs, project.tasks]);

  const selectedTaskLogs = useMemo(() => {
    if (!selectedTaskId) return [];
    return timeLogs
      .filter(l => l.taskId === selectedTaskId)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [timeLogs, selectedTaskId]);

  const stageByTaskId = useMemo(() => {
    const map = new Map<string, string>();
    project.tasks.forEach(task => {
      map.set(task.id, task.stageId);
    });
    return map;
  }, [project.tasks]);

  const stageNameById = useMemo(() => {
    const map = new Map<string, string>();
    project.stages.forEach(stage => {
      map.set(stage.id, stage.name);
    });
    return map;
  }, [project.stages]);

  const visibleDateKeys = useMemo(
    () => new Set(dates.map(d => toInputDate(d))),
    [dates]
  );

  const stageTotalsVisible = useMemo(() => {
    const totals = new Map<string, number>();
    timeLogs.forEach(log => {
      if (!visibleDateKeys.has(log.date)) return;
      const stageId = log.stageId || stageByTaskId.get(log.taskId);
      if (!stageId) return;
      totals.set(stageId, (totals.get(stageId) || 0) + log.hours);
    });
    return totals;
  }, [timeLogs, visibleDateKeys, stageByTaskId]);

  const visibleTotalHours = useMemo(() => (
    Array.from(stageTotalsVisible.values()).reduce((sum, v) => sum + v, 0)
  ), [stageTotalsVisible]);

  const handleAddLog = (date: Date) => {
    const hoursNum = parseFloat(logHours);
    if (!selectedTaskId || isNaN(hoursNum) || hoursNum <= 0) return;
    if (!project.tasks.some(task => task.id === selectedTaskId)) return;
    const dateStr = date.toISOString().split('T')[0];
    if (dateStr > todayStr) return;
    if (dateStr < todayStr && !allowPastEntry) return;

    const task = project.tasks.find(t => t.id === selectedTaskId);
    onAddLog({
      taskId: selectedTaskId,
      stageId: task?.stageId,
      date: dateStr,
      hours: hoursNum,
      userId: 'u1'
    });
  };

  const startEdit = (log: TimeLog) => {
    setEditingLogId(log.id);
    setEditingDate(log.date);
    setEditingHours(String(log.hours));
    setConfirmDeleteId(null);
  };

  const cancelEdit = () => {
    setEditingLogId(null);
    setEditingDate('');
    setEditingHours('');
  };

  const saveEdit = (logId: string) => {
    const hoursNum = parseFloat(editingHours);
    if (!editingDate || isNaN(hoursNum) || hoursNum <= 0) return;
    onUpdateLog(logId, { date: editingDate, hours: hoursNum });
    cancelEdit();
  };

  const handleDelete = (logId: string) => {
    if (confirmDeleteId !== logId) {
      setConfirmDeleteId(logId);
      return;
    }
    onDeleteLog(logId);
    setConfirmDeleteId(null);
  };

  const shiftFocus = (days: number) => {
    setFocusDate(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + days);
      return d;
    });
  };

  const shiftMonth = (months: number) => {
    setFocusDate(prev => new Date(prev.getFullYear(), prev.getMonth() + months, prev.getDate()));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{l('Implementacion de tiempo', 'Time Implementation')}</h3>
            <p className="text-sm text-slate-500">{l('Registra y gestiona horas implementadas por tarea', 'Track and manage hours implemented at task level')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {l('Vista diaria', 'Daily View')}
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {l('Vista semanal', 'Weekly View')}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {viewMode === 'week' ? `${l('Rango seleccionado (Lun-Dom):', 'Selected range (Mon-Sun):')} ` : `${l('Dia seleccionado:', 'Selected day:')} `}
                  <span className="text-slate-700">
                    {viewMode === 'week' ? weekLabel : dayLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFocusDate(new Date())}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600"
                >
                  {l('Hoy', 'Today')}
                </button>
                <input
                  type="date"
                  className="text-xs font-bold text-slate-700 outline-none"
                  value={toInputDate(focusDate)}
                  onChange={(e) => setFocusDate(parseInputDate(e.target.value))}
                />
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(prev => !prev)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 flex items-center gap-2"
                  aria-expanded={isCalendarOpen}
                >
                  <i className={`fas ${isCalendarOpen ? 'fa-chevron-up' : 'fa-calendar-day'} text-xs`}></i>
                  {isCalendarOpen ? l('Ocultar calendario', 'Hide calendar') : l('Mostrar calendario', 'Show calendar')}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => shiftFocus(viewMode === 'week' ? -7 : -1)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
                >
                  {viewMode === 'week' ? `${l('Semana anterior', 'Previous week')}: ${prevWeekLabel}` : `${l('Dia anterior', 'Previous day')}: ${prevDayLabel}`}
                </button>
                <button
                  type="button"
                  onClick={() => shiftFocus(viewMode === 'week' ? 7 : 1)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
                >
                  {viewMode === 'week' ? `${l('Semana siguiente', 'Next week')}: ${nextWeekLabel}` : `${l('Dia siguiente', 'Next day')}: ${nextDayLabel}`}
                </button>
              </div>
            </div>

            {isCalendarOpen && (
              <div className="w-full lg:w-[320px] bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 flex items-center gap-2"
                    title={l('Mes anterior', 'Previous month')}
                    aria-label={l('Mes anterior', 'Previous month')}
                  >
                    <i className="fas fa-angle-left text-xs"></i>
                    {l('Mes anterior', 'Previous month')}
                  </button>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {monthLabel}
                  </div>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 flex items-center gap-2"
                    title={l('Mes siguiente', 'Next month')}
                    aria-label={l('Mes siguiente', 'Next month')}
                  >
                    {l('Mes siguiente', 'Next month')}
                    <i className="fas fa-angle-right text-xs"></i>
                  </button>
                </div>
                <div className="grid grid-cols-7 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center mb-2">
                  {(language === 'es' ? ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map(label => (
                    <div key={label}>{label}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarWeeks.flat().map((date) => {
                    const inMonth = date.getMonth() === focusDate.getMonth();
                    const inWeekRange = viewMode === 'week' && date >= weekStart && date <= weekEnd;
                    const isFocus = isSameDay(date, focusDate);
                    const isToday = isSameDay(date, today);
                    const cellClass = [
                      'w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center transition-colors',
                      inMonth ? 'text-slate-700' : 'text-slate-300',
                      inWeekRange ? 'bg-blue-50' : 'bg-white',
                      isFocus ? 'bg-blue-600 text-white' : '',
                      isToday && !isFocus ? 'ring-1 ring-blue-300' : '',
                    ].filter(Boolean).join(' ');
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        className={cellClass}
                        onClick={() => setFocusDate(date)}
                        title={formatDayLabel(date)}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-blue-50/20 border-b border-slate-100 flex flex-wrap gap-4 items-end">
          <div className="flex-grow min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{l('Seleccionar tarea para implementacion', 'Select task for implementation')}</label>
            <select
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              disabled={project.tasks.length === 0}
            >
              {project.tasks.map(t => (
                <option key={t.id} value={t.id}>{t.title} ({getStatusLabel(language, t.status)})</option>
              ))}
            </select>
          </div>
          <div className="w-24">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{l('Horas', 'Hours')}</label>
             <input
              type="number"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              value={logHours}
              onChange={(e) => setLogHours(e.target.value)}
              min="0.5"
              step="0.5"
              disabled={project.tasks.length === 0}
             />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l('Permitir dias anteriores', 'Allow past days')}</label>
            <button
              type="button"
              onClick={() => setAllowPastEntry(prev => !prev)}
              className={`relative w-10 h-5 rounded-full transition-colors ${allowPastEntry ? 'bg-blue-500' : 'bg-slate-300'}`}
              aria-pressed={allowPastEntry}
              disabled={project.tasks.length === 0}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${allowPastEntry ? 'translate-x-5' : ''}`}></span>
            </button>
          </div>
          <div className="text-xs text-slate-400 mb-3 italic">
            {allowPastEntry ? l('Puedes registrar horas en dias anteriores (no futuros).', 'You can log hours on past days (not future days).') : l('Solo puedes registrar horas en el dia actual.', 'You can only log hours on the current day.')}
          </div>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {l('Horas por etapa (periodo visible):', 'Hours by stage (visible period):')}
              <span className="text-slate-700 ml-2">
                {viewMode === 'week' ? weekLabel : dayLabel}
              </span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {l('Total', 'Total')}: <span className="text-slate-800">{visibleTotalHours}h</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.stages.map(stage => {
              const hours = stageTotalsVisible.get(stage.id) || 0;
              return (
                <div key={stage.id} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                  {stage.name} <span className="ml-2 text-slate-500">{hours}h</span>
                </div>
              );
            })}
            {project.stages.length === 0 && (
              <div className="text-xs text-slate-500">{l('Sin etapas configuradas.', 'No configured stages.')}</div>
            )}
          </div>
        </div>

        {project.tasks.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            <div className="text-sm font-bold">{l('No hay tareas en este proyecto.', 'No tasks in this project.')}</div>
            <div className="text-xs mt-2">{l('Crea una tarea para registrar horas.', 'Create a task to log hours.')}</div>
          </div>
        )}

        {/* Mobile view: date pill strip + task cards */}
        <div className="md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 px-4 py-3 border-b border-slate-100">
            {dates.map(date => {
              const dateStr = toInputDate(date);
              const totalHours = project.tasks.reduce((sum, task) => sum + getHoursForDay(date, task.id), 0);
              const isActive = isSameDay(date, focusDate);
              const isToday = isSameDay(date, today);
              return (
                <button
                  key={dateStr}
                  onClick={() => setFocusDate(date)}
                  className={`flex-none flex flex-col items-center gap-1 min-w-[56px] min-h-[56px] rounded-xl p-2 transition-all ${
                    isActive ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase">
                    {date.toLocaleDateString(locale, { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-black leading-none">{date.getDate()}</span>
                  {totalHours > 0 && (
                    <span className={`text-[8px] font-bold leading-none ${isActive ? 'text-white/80' : 'text-blue-500'}`}>{totalHours}h</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="divide-y divide-slate-50">
            {project.tasks.map(task => {
              const logged = getHoursForDay(focusDate, task.id);
              const dateStr = toInputDate(focusDate);
              const isFuture = dateStr > todayStr;
              const isSelected = task.id === selectedTaskId;
              const canLogHere = isSelected && !isFuture && (isSameDay(focusDate, today) || allowPastEntry);
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer min-h-[44px] ${isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-blue-600' : task.status === 'Done' ? 'bg-green-500' : 'bg-blue-400 opacity-40'}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{task.title}</div>
                    <div className="text-[10px] text-slate-400">
                      {l('Est', 'Est')}: {task.estimatedHours}h | {l('Reg', 'Log')}: {totalsByTask.get(task.id) || 0}h
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-sm font-black ${logged > 0 ? 'text-blue-600' : 'text-slate-200'}`}>
                      {logged > 0 ? `${logged}h` : '0h'}
                    </span>
                    {canLogHere && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddLog(focusDate); }}
                        className="min-h-[32px] px-2 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                      >
                        +{logHours}h
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {(() => {
            const dayTotal = project.tasks.reduce((sum, task) => sum + getHoursForDay(focusDate, task.id), 0);
            return dayTotal > 0 ? (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l('Total del dia', 'Day total')}</span>
                <span className="text-sm font-black text-slate-700">{dayTotal}h</span>
              </div>
            ) : null;
          })()}
        </div>

        {/* Desktop view: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">{l('Jerarquia de tareas', 'Task hierarchy')}</th>
                {dates.map(date => {
                  const isToday = isSameDay(date, today);
                  const isFocus = isSameDay(date, focusDate);
                  return (
                    <th key={date.toISOString()} className={`p-5 text-center min-w-[100px] ${isToday ? 'bg-blue-50/50' : ''} ${isFocus ? 'ring-1 ring-blue-200' : ''}`}>
                      <div className={`text-[10px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                        {date.toLocaleDateString(locale, { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-black mt-1 ${isToday ? 'text-blue-700 underline decoration-blue-200 underline-offset-4' : 'text-slate-700'}`}>
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right bg-slate-50/50">{l('Acumulado', 'Cumulative')}</th>
              </tr>
            </thead>
            <tbody>
              {project.tasks.map(task => {
                const totalForTask = totalsByTask.get(task.id) || 0;
                const isSelected = task.id === selectedTaskId;
                return (
                  <tr key={task.id} className={`border-b border-slate-50 transition-colors ${isSelected ? 'bg-blue-50/60 ring-1 ring-blue-200' : 'hover:bg-slate-50/50'}`}>
                    <td className={`p-5 ${isSelected ? 'border-l-4 border-blue-600 bg-blue-50/30' : ''}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-blue-600' : task.status === 'Done' ? 'bg-green-500' : 'bg-blue-400 opacity-40'}`}></div>
                        <div>
                          <div className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{task.title}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{language === 'es' ? `Est: ${task.estimatedHours}h | Reg: ${totalForTask}h` : `Est: ${task.estimatedHours}h | Log: ${totalForTask}h`}</div>
                        </div>
                      </div>
                    </td>
                    {dates.map(date => {
                      const logged = getHoursForDay(date, task.id);
                      const isToday = isSameDay(date, today);
                      const dateStr = date.toISOString().split('T')[0];
                      const isFuture = dateStr > todayStr;
                      const canLogHere = isSelected && !isFuture && (isToday || allowPastEntry);
                      return (
                        <td key={date.toISOString()} className={`p-5 text-center group ${isToday ? 'bg-blue-50/20' : ''}`}>
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-black transition-all ${logged > 0 ? 'text-blue-600 scale-110' : 'text-slate-200'}`}>
                              {logged > 0 ? `${logged}h` : '0h'}
                            </span>
                            {canLogHere && (
                              <button
                                onClick={() => handleAddLog(date)}
                                className={`mt-3 text-[9px] font-black px-3 py-1.5 rounded-lg transition-all ${
                                  isToday
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-90'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {language === 'es' ? `REG ${logHours}H` : `LOG ${logHours}H`}
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-5 text-right">
                      <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                        {totalForTask}h
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50/50">
              <tr>
                <td className="p-5 font-black text-slate-500 text-xs uppercase tracking-widest">{l('Totales diarios', 'Daily totals')}</td>
                {dates.map(date => {
                  const total = project.tasks.reduce((sum, task) => sum + getHoursForDay(date, task.id), 0);
                  return (
                    <td key={date.toISOString()} className="p-5 text-center">
                       <span className={`text-xs font-black ${total > 8 ? 'text-amber-600' : total > 0 ? 'text-slate-600' : 'text-slate-300'}`}>
                         {total}h
                       </span>
                    </td>
                  );
                })}
                <td className="p-5 text-right font-black text-slate-800">
                  {Array.from(totalsByTask.values()).reduce((sum, v) => sum + v, 0)}h
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-800">{l('Registros de horas', 'Hour logs')}</h4>
            <p className="text-xs text-slate-500">{l('Ver, editar o eliminar horas registradas', 'View, edit, or delete logged hours')}</p>
          </div>
          {selectedTaskId && (
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {l('Tarea seleccionada:', 'Selected task:')} <span className="text-slate-800">{project.tasks.find(t => t.id === selectedTaskId)?.title || '-'}</span>
            </div>
          )}
        </div>
        <div className="p-6">
          {selectedTaskId ? (
            selectedTaskLogs.length > 0 ? (
              <div className="space-y-3">
                {selectedTaskLogs.map(log => {
                  const logStageId = log.stageId || stageByTaskId.get(log.taskId);
                  const logStageName = logStageId ? stageNameById.get(logStageId) : null;
                  return (
                  <div key={log.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{l('Fecha', 'Date')}</div>
                      {editingLogId === log.id ? (
                        <input
                          type="date"
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          value={editingDate}
                          onChange={(e) => setEditingDate(e.target.value)}
                        />
                      ) : (
                        <div className="text-sm font-bold text-slate-700">{log.date}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{l('Horas', 'Hours')}</div>
                      {editingLogId === log.id ? (
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          value={editingHours}
                          onChange={(e) => setEditingHours(e.target.value)}
                        />
                      ) : (
                        <div className="text-sm font-bold text-slate-700">{log.hours}h</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{l('Etapa', 'Stage')}</div>
                      <div className="text-sm font-bold text-slate-700">{logStageName || l('Sin etapa', 'No stage')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {editingLogId === log.id ? (
                        <>
                          <button
                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800"
                            onClick={cancelEdit}
                          >
                            {l('Cancelar', 'Cancel')}
                          </button>
                          <button
                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                            onClick={() => saveEdit(log.id)}
                          >
                            {l('Guardar', 'Save')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800"
                            onClick={() => startEdit(log)}
                          >
                            {l('Editar', 'Edit')}
                          </button>
                          <button
                            className={`text-[10px] font-black uppercase tracking-widest ${confirmDeleteId === log.id ? 'text-white bg-red-600 px-2 py-1 rounded-lg' : 'text-red-500 hover:text-red-700'}`}
                            onClick={() => handleDelete(log.id)}
                          >
                            {confirmDeleteId === log.id ? l('Confirmar', 'Confirm') : l('Eliminar', 'Delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="text-sm text-slate-500">{l('No hay registros para la tarea seleccionada.', 'No logs for the selected task.')}</div>
            )
          ) : (
            <div className="text-sm text-slate-500">{l('Selecciona una tarea para ver sus registros.', 'Select a task to view its logs.')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
