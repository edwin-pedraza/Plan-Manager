import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Task, Project, Stage } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { getLocale, getStatusLabel } from '@/context/i18n';

const STAGE_COLORS = [
  { bar: 'bg-blue-500', barLight: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', headerBg: 'bg-blue-50/60' },
  { bar: 'bg-violet-500', barLight: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500', headerBg: 'bg-violet-50/60' },
  { bar: 'bg-amber-500', barLight: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', headerBg: 'bg-amber-50/60' },
  { bar: 'bg-teal-500', barLight: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500', headerBg: 'bg-teal-50/60' },
  { bar: 'bg-rose-500', barLight: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', headerBg: 'bg-rose-50/60' },
  { bar: 'bg-cyan-500', barLight: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500', headerBg: 'bg-cyan-50/60' },
  { bar: 'bg-orange-500', barLight: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500', headerBg: 'bg-orange-50/60' },
  { bar: 'bg-indigo-500', barLight: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500', headerBg: 'bg-indigo-50/60' },
];

const STATUS_DOT_COLORS: Record<string, string> = {
  Todo: 'bg-slate-400',
  'In Progress': 'bg-blue-500',
  Review: 'bg-amber-500',
  Done: 'bg-green-500',
};

const MONTH_ROW_H = 36;
const DAY_ROW_H = 52;
const HEADER_H = MONTH_ROW_H + DAY_ROW_H;
const STAGE_ROW_H = 48;
const TASK_ROW_H = 64;
const LABEL_W = 272;

const formatDate = (dateStr: string, locale: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};

const StatPill: React.FC<{ icon: string; label: string; value: string | number; colorCls: string; alert?: boolean }> = ({ icon, label, value, colorCls, alert }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm select-none ${alert ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${colorCls}`}>
      <i className={`fas ${icon} text-white text-[9px]`}></i>
    </div>
    <div className="flex flex-col leading-none gap-0.5">
      <span className={`text-sm font-black leading-none ${alert ? 'text-red-700' : 'text-slate-800'}`}>{value}</span>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">{label}</span>
    </div>
  </div>
);

interface StageGroupHeaderProps {
  stage: Stage;
  taskCount: number;
  progressPct: number;
  color: typeof STAGE_COLORS[0];
  collapsed: boolean;
  onToggle: () => void;
  labelWidth: number;
  chartWidth: number;
  ariaLabel: string;
}

const StageGroupHeader: React.FC<StageGroupHeaderProps> = ({ stage, taskCount, progressPct, color, collapsed, onToggle, labelWidth, chartWidth, ariaLabel }) => (
  <div
    role="button"
    tabIndex={0}
    aria-expanded={!collapsed}
    aria-label={ariaLabel}
    className={`flex border-b border-slate-200 cursor-pointer hover:brightness-95 transition-all select-none ${color.headerBg}`}
    onClick={onToggle}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
  >
    <div
      className="flex-none border-r border-slate-200 flex items-center px-4 gap-2.5 sticky left-0 z-10 bg-inherit"
      style={{ width: labelWidth, height: STAGE_ROW_H }}
    >
      <i className={`fas fa-chevron-${collapsed ? 'right' : 'down'} text-[10px] ${color.text} w-3 flex-shrink-0`}></i>
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.dot}`}></span>
      <span className={`text-xs font-black ${color.text} truncate flex-1`}>{stage.name}</span>
      <span className={`text-[9px] font-bold ${color.text} bg-white/60 px-1.5 py-0.5 rounded-md flex-shrink-0`}>{taskCount}</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-16 h-1.5 bg-white/50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${progressPct}%` }}></div>
        </div>
        <span className="text-[9px] font-bold text-slate-500 w-7 text-right">{progressPct}%</span>
      </div>
    </div>
    <div style={{ width: chartWidth, height: STAGE_ROW_H }}></div>
  </div>
);

interface TaskTooltipProps {
  task: Task;
  x: number;
  y: number;
  language: 'en' | 'es';
  locale: string;
  labels: { start: string; end: string; est: string; actual: string };
}

const TaskTooltip: React.FC<TaskTooltipProps> = ({ task, x, y, language, locale, labels }) => {
  const flippedX = x > window.innerWidth - 340;
  const statusColors: Record<string, string> = {
    Todo: 'bg-slate-500',
    'In Progress': 'bg-blue-500',
    Review: 'bg-amber-500',
    Done: 'bg-green-500',
  };
  const progress = task.estimatedHours > 0 ? Math.round((task.actualHours / task.estimatedHours) * 100) : 0;

  return (
    <div
      className="fixed z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-4 pointer-events-none"
      style={{ left: flippedX ? x - 310 : x + 12, top: Math.max(y - 60, 8), width: 300 }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-[10px] font-black text-white uppercase">
          {task.assignee.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{task.title}</div>
          <div className="text-[10px] text-slate-400">{task.assignee}</div>
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${statusColors[task.status] || 'bg-slate-500'}`}>
          {getStatusLabel(language, task.status)}
        </span>
      </div>
      {task.description && <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">{task.description}</p>}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-500">{labels.start}:</span> <span className="font-bold">{formatDate(task.startDate, locale)}</span>
        </div>
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-500">{labels.end}:</span> <span className="font-bold">{formatDate(task.endDate, locale)}</span>
        </div>
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-500">{labels.est}:</span> <span className="font-bold">{task.estimatedHours}h</span>
        </div>
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-500">{labels.actual}:</span> <span className="font-bold">{task.actualHours}h ({progress}%)</span>
        </div>
      </div>
    </div>
  );
};

interface TaskRowProps {
  task: Task;
  stageColor: typeof STAGE_COLORS[0];
  isOverdue: boolean;
  isDone: boolean;
  rowIndex: number;
  labelWidth: number;
  chartWidth: number;
  dayWidth: number;
  dates: Date[];
  getPosition: (dateStr: string) => number;
  onEditTask?: (task: Task) => void;
  onMouseEnter: (task: Task, e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  language: 'en' | 'es';
  progressLabel: string;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task, stageColor, isOverdue, isDone, rowIndex, labelWidth, chartWidth, dayWidth, dates, getPosition, onEditTask, onMouseEnter, onMouseLeave, language, progressLabel,
}) => {
  const startPos = getPosition(task.startDate);
  const endPos = getPosition(task.endDate);
  const width = Math.max(endPos - startPos, dayWidth);
  const progress = task.estimatedHours > 0 ? task.actualHours / task.estimatedHours : 0;
  const progressWidth = Math.min(width * progress, width);

  let barClass: string;
  let barBgClass: string;
  let borderClass: string;
  if (isOverdue) {
    barClass = 'bg-red-500';
    barBgClass = 'bg-red-50';
    borderClass = 'border-red-200';
  } else if (isDone) {
    barClass = 'bg-green-500';
    barBgClass = 'bg-green-50';
    borderClass = 'border-green-200';
  } else {
    barClass = stageColor.bar;
    barBgClass = stageColor.barLight;
    borderClass = stageColor.border;
  }

  const statusDot = STATUS_DOT_COLORS[task.status] || 'bg-slate-400';
  const isEvenRow = rowIndex % 2 === 1;

  const handleClick = () => { if (onEditTask) onEditTask(task); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onEditTask) {
      e.preventDefault();
      onEditTask(task);
    }
  };

  return (
    <div className={`flex border-b border-slate-100 group hover:bg-blue-50/30 transition-colors ${isEvenRow ? 'bg-slate-50/40' : 'bg-white'}`} style={{ height: TASK_ROW_H }}>
      <div className={`flex-none border-r border-slate-200 flex items-center px-3 gap-2.5 sticky left-0 z-10 group-hover:bg-blue-50/30 transition-colors ${isEvenRow ? 'bg-slate-50/40' : 'bg-white'}`} style={{ width: labelWidth }}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`}></span>
        <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-[9px] font-black text-slate-500 uppercase flex-shrink-0">
          {task.assignee.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <span className="text-[11px] font-bold text-slate-800 truncate flex-1 leading-snug">{task.title}</span>
        <span className="text-[9px] text-slate-400 font-bold flex-shrink-0">{task.estimatedHours}h</span>
      </div>

      <div className="relative flex-grow" style={{ width: chartWidth }}>
        <div className="absolute inset-0 flex pointer-events-none">
          {dates.map((date, dIdx) => (
            <div
              key={dIdx}
              className={`h-full border-r ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-slate-100/60 border-slate-100' : 'border-slate-50/70'}`}
              style={{ width: dayWidth }}
            ></div>
          ))}
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label={`${task.title}, ${getStatusLabel(language, task.status)}, ${Math.round(progress * 100)}% ${progressLabel}`}
          className={`absolute top-1/2 -translate-y-1/2 rounded-xl h-10 flex flex-col overflow-hidden shadow-sm border transition-all group-hover:shadow-md cursor-pointer ${barBgClass} ${borderClass}`}
          style={{ left: startPos, width }}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={(e) => onMouseEnter(task, e)}
          onMouseLeave={onMouseLeave}
        >
          <div className={`h-full absolute left-0 top-0 transition-all duration-500 ${barClass}`} style={{ width: progressWidth }}></div>

          <div className="relative z-10 flex items-center h-full px-3 gap-2 overflow-hidden">
            {isOverdue && <i className="fas fa-exclamation-triangle text-[10px] text-red-600 flex-shrink-0"></i>}
            {isDone && <i className="fas fa-check-circle text-[10px] text-green-600 flex-shrink-0"></i>}
            <span className={`text-[10px] font-black uppercase tracking-tight whitespace-nowrap ${progress > 0.4 ? 'text-white' : 'text-slate-600'}`}>
              {Math.round(progress * 100)}%
            </span>
            {width > 100 && <span className={`text-[9px] font-bold truncate ${progress > 0.6 ? 'text-white/90' : 'text-slate-500'}`}>{task.title}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

interface GanttChartProps {
  project: Project;
  onEditTask?: (task: Task) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({ project, onEditTask }) => {
  const { language } = useAppContext();
  const locale = getLocale(language);

  const text = language === 'es'
    ? {
        noTasksTitle: 'No hay tareas disponibles para la linea de tiempo',
        noTasksSub: 'Agrega tareas o usa el planificador IA para poblar tu proyecto',
        regionLabel: 'Diagrama de Gantt del proyecto',
        title: 'Mapa de ruta',
        subtitle: 'Cronograma de tareas agrupadas por etapa',
        tasks: 'Tareas',
        completed: 'Completadas',
        estimatedHours: 'Horas est.',
        overdue: 'Atrasadas',
        goToToday: 'Ir a hoy',
        today: 'Hoy',
        days: 'Dias',
        weeks: 'Semanas',
        completedLegend: 'Completada',
        overdueLegend: 'Atrasada',
        noStage: 'Sin etapa',
        start: 'Inicio',
        end: 'Fin',
        est: 'Est.',
        actual: 'Real',
        progress: 'progreso',
        stageAria: (name: string, count: number, pct: number) => `Etapa ${name}, ${count} tareas, ${pct}% completado`,
      }
    : {
        noTasksTitle: 'No tasks available for timeline',
        noTasksSub: 'Add tasks or use the AI planner to populate your project',
        regionLabel: 'Project Gantt chart',
        title: 'Roadmap',
        subtitle: 'Task timeline grouped by stage',
        tasks: 'Tasks',
        completed: 'Completed',
        estimatedHours: 'Est. hours',
        overdue: 'Overdue',
        goToToday: 'Go to today',
        today: 'Today',
        days: 'Days',
        weeks: 'Weeks',
        completedLegend: 'Completed',
        overdueLegend: 'Overdue',
        noStage: 'No stage',
        start: 'Start',
        end: 'End',
        est: 'Est.',
        actual: 'Actual',
        progress: 'progress',
        stageAria: (name: string, count: number, pct: number) => `Stage ${name}, ${count} tasks, ${pct}% completed`,
      };

  const [resolution, setResolution] = useState<'day' | 'week'>('day');
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());
  const [tooltipTask, setTooltipTask] = useState<{ task: Task; x: number; y: number } | null>(null);
  const chartViewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const scrollToTodayRef = useRef<() => void>(() => {});
  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    const el = chartViewportRef.current;
    if (!el) return;

    const update = () => setViewportWidth(el.clientWidth);
    update();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => update());
      observer.observe(el);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (initialScrollDoneRef.current || viewportWidth === 0) return;
    const timer = setTimeout(() => {
      scrollToTodayRef.current();
      initialScrollDoneRef.current = true;
    }, 120);
    return () => clearTimeout(timer);
  }, [viewportWidth]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tasks = useMemo(
    () => [...project.tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [project.tasks]
  );

  const stageGroups = useMemo(() => {
    const stages = [...project.stages].sort((a, b) => a.order - b.order);
    const groups: { stage: Stage; tasks: Task[] }[] = [];
    const tasksByStage = new Map<string, Task[]>();

    for (const task of tasks) {
      const list = tasksByStage.get(task.stageId) || [];
      list.push(task);
      tasksByStage.set(task.stageId, list);
    }

    for (const stage of stages) {
      const stageTasks = tasksByStage.get(stage.id) || [];
      if (stageTasks.length > 0) {
        groups.push({ stage, tasks: stageTasks });
      }
    }

    const knownStageIds = new Set(stages.map(s => s.id));
    const orphanTasks = tasks.filter(t => !knownStageIds.has(t.stageId));
    if (orphanTasks.length > 0) {
      groups.push({ stage: { id: '__orphan', name: text.noStage, order: 999 }, tasks: orphanTasks });
    }

    return groups;
  }, [project.stages, tasks, text.noStage]);

  const toggleStage = useCallback((stageId: string) => {
    setCollapsedStages(prev => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  }, []);

  const handleTooltipEnter = useCallback((task: Task, e: React.MouseEvent) => {
    setTooltipTask({ task, x: e.clientX, y: e.clientY });
  }, []);

  const handleTooltipLeave = useCallback(() => {
    setTooltipTask(null);
  }, []);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-project-diagram text-2xl"></i>
        </div>
        <p className="font-bold">{text.noTasksTitle}</p>
        <p className="text-sm">{text.noTasksSub}</p>
      </div>
    );
  }

  const minDate = new Date(Math.min(...tasks.map(t => new Date(t.startDate).getTime())));
  const maxDate = new Date(Math.max(...tasks.map(t => new Date(t.endDate).getTime())));
  minDate.setDate(minDate.getDate() - 5);
  maxDate.setDate(maxDate.getDate() + 10);

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const minDayWidth = resolution === 'day' ? 28 : 16;
  const preferredDayWidth = resolution === 'day' ? 44 : 26;
  const availableChartWidth = Math.max(viewportWidth - LABEL_W, 0);
  const computedDayWidth = totalDays > 0 ? availableChartWidth / totalDays : preferredDayWidth;
  const dayWidth = Math.max(minDayWidth, computedDayWidth || preferredDayWidth);
  const chartWidth = totalDays * dayWidth;
  const canvasWidth = Math.max(LABEL_W + chartWidth, viewportWidth, LABEL_W + 680);

  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.ceil((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff * dayWidth;
  };

  const todayPos = (() => {
    if (today >= minDate && today <= maxDate) {
      const diff = Math.ceil((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      return diff * dayWidth;
    }
    return null;
  })();

  scrollToTodayRef.current = () => {
    if (!chartViewportRef.current || todayPos === null) return;
    const scrollX = Math.max(0, LABEL_W + todayPos - viewportWidth / 2);
    chartViewportRef.current.scrollLeft = scrollX;
  };

  const dates: Date[] = [];
  const temp = new Date(minDate);
  for (let i = 0; i < totalDays; i++) {
    dates.push(new Date(temp));
    temp.setDate(temp.getDate() + 1);
  }

  const months: { label: string; span: number; startIdx: number }[] = [];
  let currentMonth = -1;
  for (let i = 0; i < dates.length; i++) {
    const m = dates[i].getMonth();
    const y = dates[i].getFullYear();
    const key = y * 12 + m;
    if (key !== currentMonth) {
      months.push({ label: dates[i].toLocaleDateString(locale, { month: 'long', year: 'numeric' }), span: 1, startIdx: i });
      currentMonth = key;
    } else {
      months[months.length - 1].span++;
    }
  }

  let visibleRowCount = 0;
  for (const group of stageGroups) {
    if (!collapsedStages.has(group.stage.id)) {
      visibleRowCount += group.tasks.length;
    }
  }
  const bodyHeight = stageGroups.length * STAGE_ROW_H + visibleRowCount * TASK_ROW_H;
  const minChartHeight = Math.max(HEADER_H + bodyHeight, 520);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const completedPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const estHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
  const overdueCount = tasks.filter(t => new Date(t.endDate) < today && t.status !== 'Done').length;

  const legendItems = stageGroups.map((g, i) => ({
    label: g.stage.name,
    dot: STAGE_COLORS[i % STAGE_COLORS.length].dot,
  }));

  return (
    <div role="region" aria-label={text.regionLabel} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-shrink-0">
            <h3 className="text-base font-black text-slate-800 tracking-tight leading-none">{text.title}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{text.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-1 justify-center md:justify-start">
            <StatPill icon="fa-tasks" label={text.tasks} value={totalTasks} colorCls="bg-blue-500" />
            <StatPill icon="fa-check-circle" label={text.completed} value={`${completedPct}%`} colorCls="bg-green-500" />
            <StatPill icon="fa-clock" label={text.estimatedHours} value={estHours} colorCls="bg-violet-500" />
            <StatPill icon="fa-exclamation-triangle" label={text.overdue} value={overdueCount} colorCls={overdueCount > 0 ? 'bg-red-500' : 'bg-slate-400'} alert={overdueCount > 0} />
          </div>

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {todayPos !== null && (
              <button
                onClick={() => scrollToTodayRef.current()}
                title={text.goToToday}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-white border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"
              >
                <i className="fas fa-crosshairs text-[9px]"></i>
                {text.today}
              </button>
            )}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setResolution('day')}
                aria-pressed={resolution === 'day'}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${resolution === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {text.days}
              </button>
              <button
                onClick={() => setResolution('week')}
                aria-pressed={resolution === 'week'}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${resolution === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {text.weeks}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {legendItems.map((item, i) => (
            <span key={i} className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${item.dot}`}></span>{item.label}
            </span>
          ))}
          <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>{text.completedLegend}
          </span>
          <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>{text.overdueLegend}
          </span>
        </div>
      </div>

      {/* Mobile list view */}
      <div className="lg:hidden divide-y divide-slate-100">
        {stageGroups.map((group, stageIndex) => {
          const color = STAGE_COLORS[stageIndex % STAGE_COLORS.length];
          const isCollapsed = collapsedStages.has(group.stage.id);
          const doneGroupTasks = group.tasks.filter(t => t.status === 'Done').length;
          const progressPct = group.tasks.length > 0 ? Math.round((doneGroupTasks / group.tasks.length) * 100) : 0;

          return (
            <div key={group.stage.id}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={!isCollapsed}
                aria-label={text.stageAria(group.stage.name, group.tasks.length, progressPct)}
                onClick={() => toggleStage(group.stage.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStage(group.stage.id); } }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer min-h-[44px] select-none ${color.headerBg}`}
              >
                <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'down'} text-[10px] ${color.text} flex-shrink-0`}></i>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.dot}`}></span>
                <span className={`text-xs font-black ${color.text} flex-1 truncate`}>{group.stage.name}</span>
                <span className={`text-[9px] font-bold ${color.text} bg-white/60 px-1.5 py-0.5 rounded-md flex-shrink-0`}>{group.tasks.length}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-12 h-1.5 bg-white/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${progressPct}%` }}></div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500">{progressPct}%</span>
                </div>
              </div>

              {!isCollapsed && (
                <div className="divide-y divide-slate-50">
                  {group.tasks.map(task => {
                    const isDone = task.status === 'Done';
                    const isOverdue = new Date(task.endDate) < today && !isDone;
                    return (
                      <div
                        key={task.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onEditTask?.(task)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditTask?.(task); } }}
                        className="flex items-center gap-3 px-4 py-3 min-h-[44px] hover:bg-slate-50 cursor-pointer"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[task.status] || 'bg-slate-400'}`}></span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-800 truncate">{task.title}</span>
                            {isOverdue && (
                              <span className="text-[9px] bg-red-50 text-red-600 font-black px-1.5 py-0.5 rounded-full flex-shrink-0">{text.overdue}</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {formatDate(task.startDate, locale)} → {formatDate(task.endDate, locale)} · {task.estimatedHours}h
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                          {task.assignee.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop canvas view */}
      <div ref={chartViewportRef} className="hidden lg:block overflow-x-auto flex-1" style={{ minHeight: minChartHeight }}>
        <div className="relative" style={{ width: canvasWidth, minHeight: minChartHeight }}>
          <div className="flex border-b border-slate-200 sticky top-0 bg-white z-20">
            <div className="flex-none bg-slate-50 border-r border-slate-200 sticky left-0 z-30" style={{ width: LABEL_W, height: MONTH_ROW_H }}></div>
            <div className="flex">
              {months.map((m, idx) => (
                <div
                  key={idx}
                  className="flex-none border-r border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50/60 capitalize"
                  style={{ width: m.span * dayWidth, height: MONTH_ROW_H }}
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex border-b border-slate-200 sticky bg-white z-20" style={{ top: MONTH_ROW_H }}>
            <div
              className="flex-none bg-slate-50 border-r border-slate-200 flex items-center px-4 font-black text-[10px] uppercase tracking-widest text-slate-400 sticky left-0 z-30"
              style={{ width: LABEL_W, height: DAY_ROW_H }}
            >
              {text.tasks}
            </div>
            <div className="flex">
              {dates.map((date, idx) => {
                const isMonday = date.getDay() === 1;
                const showLabel = resolution === 'day' ? true : isMonday;
                const isToday = date.toDateString() === today.toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <div
                    key={idx}
                    className={`flex-none border-r border-slate-100 flex flex-col items-center justify-center text-slate-500 ${isWeekend ? 'bg-slate-50/80' : ''} ${isMonday && !isWeekend ? 'bg-slate-50/30' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                    style={{ width: dayWidth, height: DAY_ROW_H }}
                  >
                    {showLabel && (
                      <>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                          {date.toLocaleDateString(locale, { weekday: 'short' })}
                        </span>
                        <span className={`text-xs font-black ${isToday ? 'bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]' : isMonday ? 'text-blue-600' : 'text-slate-700'}`}>
                          {date.getDate()}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {todayPos !== null && (
            <div className="absolute pointer-events-none" style={{ left: LABEL_W + todayPos, top: 0, bottom: 0, zIndex: 15 }}>
              <div className="relative h-full">
                <div className="absolute top-0 -translate-x-1/2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-b-md z-20 shadow-sm">
                  {text.today.toUpperCase()}
                </div>
                <div className="w-px h-full border-l-2 border-dashed border-red-400/70 mx-auto"></div>
              </div>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            {(() => {
              let globalRowIndex = 0;
              return stageGroups.map((group, stageIndex) => {
                const color = STAGE_COLORS[stageIndex % STAGE_COLORS.length];
                const isCollapsed = collapsedStages.has(group.stage.id);
                const doneGroupTasks = group.tasks.filter(t => t.status === 'Done').length;
                const progressPct = group.tasks.length > 0 ? Math.round((doneGroupTasks / group.tasks.length) * 100) : 0;

                return (
                  <div key={group.stage.id}>
                    <StageGroupHeader
                      stage={group.stage}
                      taskCount={group.tasks.length}
                      progressPct={progressPct}
                      color={color}
                      collapsed={isCollapsed}
                      onToggle={() => toggleStage(group.stage.id)}
                      labelWidth={LABEL_W}
                      chartWidth={chartWidth}
                      ariaLabel={text.stageAria(group.stage.name, group.tasks.length, progressPct)}
                    />
                    {!isCollapsed && group.tasks.map(task => {
                      const isDone = task.status === 'Done';
                      const isOverdue = new Date(task.endDate) < today && !isDone;
                      const rowIdx = globalRowIndex++;

                      return (
                        <TaskRow
                          key={task.id}
                          task={task}
                          stageColor={color}
                          isOverdue={isOverdue}
                          isDone={isDone}
                          rowIndex={rowIdx}
                          labelWidth={LABEL_W}
                          chartWidth={chartWidth}
                          dayWidth={dayWidth}
                          dates={dates}
                          getPosition={getPosition}
                          onEditTask={onEditTask}
                          onMouseEnter={handleTooltipEnter}
                          onMouseLeave={handleTooltipLeave}
                          language={language}
                          progressLabel={text.progress}
                        />
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {tooltipTask && (
        <TaskTooltip
          task={tooltipTask.task}
          x={tooltipTask.x}
          y={tooltipTask.y}
          language={language}
          locale={locale}
          labels={{ start: text.start, end: text.end, est: text.est, actual: text.actual }}
        />
      )}
    </div>
  );
};

export default GanttChart;
