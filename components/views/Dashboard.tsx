import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Project } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { getLocale, getStatusLabel } from '@/context/i18n';

const STAGE_PALETTE = ['#4299E1', '#9F7AEA', '#ED8936', '#38B2AC', '#f43f5e', '#63B3ED', '#f97316', '#3182CE'];

const getDueDateStatus = (dueDate: string, today: Date, language: 'en' | 'es') => {
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  if (language === 'es') {
    if (diffDays < 0) return { label: 'Vencido', short: 'Vencido', color: '#ef4444', days: diffDays };
    if (diffDays === 0) return { label: 'Vence hoy', short: 'Hoy', color: '#ef4444', days: diffDays };
    if (diffDays <= 7) return { label: `${diffDays} dia${diffDays !== 1 ? 's' : ''}`, short: `${diffDays}d`, color: '#ef4444', days: diffDays };
    if (diffDays <= 30) return { label: `${diffDays} dias`, short: `${diffDays}d`, color: '#ED8936', days: diffDays };
    return { label: `${diffDays} dias`, short: `${diffDays}d`, color: '#38B2AC', days: diffDays };
  }

  if (diffDays < 0) return { label: 'Overdue', short: 'Overdue', color: '#ef4444', days: diffDays };
  if (diffDays === 0) return { label: 'Due today', short: 'Today', color: '#ef4444', days: diffDays };
  if (diffDays <= 7) return { label: `${diffDays} day${diffDays !== 1 ? 's' : ''}`, short: `${diffDays}d`, color: '#ef4444', days: diffDays };
  if (diffDays <= 30) return { label: `${diffDays} days`, short: `${diffDays}d`, color: '#ED8936', days: diffDays };
  return { label: `${diffDays} days`, short: `${diffDays}d`, color: '#38B2AC', days: diffDays };
};

const KpiCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  sub?: string;
  progressValue?: number;
}> = ({ title, value, icon, iconBg, iconColor, accentColor, sub, progressValue }) => (
  <div
    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 group cursor-default"
    style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
  >
    <div className="flex justify-between items-start">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
        style={!iconBg || iconBg === 'bg-transparent' ? { background: accentColor + '20' } : undefined}
      >
        <i className={`fas ${icon} text-sm ${iconColor}`} style={!iconColor ? { color: accentColor } : undefined}></i>
      </div>
      <i className="fas fa-arrow-right text-slate-200 text-xs group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all"></i>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{title}</p>
      <p className="text-3xl font-black text-slate-900 leading-none">{value}</p>
      {progressValue !== undefined && (
        <div className="mt-2.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(progressValue, 100)}%`, background: accentColor }}></div>
        </div>
      )}
      {sub && <p className="text-[10px] text-slate-400 font-medium mt-1.5 leading-snug">{sub}</p>}
    </div>
  </div>
);

interface DashboardProps {
  project: Project;
}

const Dashboard: React.FC<DashboardProps> = ({ project }) => {
  const { language } = useAppContext();
  const locale = getLocale(language);

  const text = language === 'es'
    ? {
        noTasksYet: 'Sin tareas aun',
        addTasksPrompt: 'Anade tareas al proyecto para ver estadisticas y graficos.',
        projectDueDate: 'Fecha limite del proyecto',
        deadlineExpired: 'El plazo ha expirado',
        dueCountdown: 'hasta el vencimiento',
        overallProgress: 'Avance general',
        completedTasksSummary: (done: number, total: number) => `${done} de ${total} tareas completadas`,
        totalTasks: 'Total tareas',
        completed: 'Completadas',
        inProgress: 'En progreso',
        estimatedHours: 'Horas est.',
        loggedHoursSummary: (actual: number, pct: number) => `${actual}h registradas · ${pct}%`,
        delayed: 'Atrasadas',
        attentionRequired: 'Requieren atencion',
        onTrack: 'Todo al dia',
        dueDate: 'Fecha limite',
        undefinedDueDate: 'Sin definir',
        statusDistribution: 'Distribucion por estado',
        statusDistributionSubtitle: 'Desglose de tareas segun su estado actual',
        stageHours: 'Horas por etapa',
        stageHoursSubtitle: 'Horas estimadas vs. registradas',
        estShort: 'Est.',
        realShort: 'Real',
        estimatedSeries: 'Estimadas',
        actualSeries: 'Reales',
        stageProgress: 'Avance por etapa',
        stageProgressSubtitle: 'Progreso de completado por cada etapa del proyecto',
        tasksWord: (n: number) => `tarea${n !== 1 ? 's' : ''}`,
        estLabel: 'est.',
      }
    : {
        noTasksYet: 'No tasks yet',
        addTasksPrompt: 'Add tasks to the project to view stats and charts.',
        projectDueDate: 'Project due date',
        deadlineExpired: 'Deadline has passed',
        dueCountdown: 'until due date',
        overallProgress: 'Overall progress',
        completedTasksSummary: (done: number, total: number) => `${done} of ${total} tasks completed`,
        totalTasks: 'Total tasks',
        completed: 'Completed',
        inProgress: 'In progress',
        estimatedHours: 'Est. hours',
        loggedHoursSummary: (actual: number, pct: number) => `${actual}h logged · ${pct}%`,
        delayed: 'Overdue',
        attentionRequired: 'Needs attention',
        onTrack: 'On track',
        dueDate: 'Due date',
        undefinedDueDate: 'Not set',
        statusDistribution: 'Status distribution',
        statusDistributionSubtitle: 'Task breakdown by current status',
        stageHours: 'Hours by stage',
        stageHoursSubtitle: 'Estimated vs logged hours',
        estShort: 'Est.',
        realShort: 'Actual',
        estimatedSeries: 'Estimated',
        actualSeries: 'Actual',
        stageProgress: 'Stage progress',
        stageProgressSubtitle: 'Completion progress by project stage',
        tasksWord: (n: number) => `task${n !== 1 ? 's' : ''}`,
        estLabel: 'est.',
      };

  const statusConfig = useMemo(() => ({
    Todo: { label: getStatusLabel(language, 'Todo'), color: '#94a3b8' },
    'In Progress': { label: getStatusLabel(language, 'In Progress'), color: '#4299E1' },
    Review: { label: getStatusLabel(language, 'Review'), color: '#ED8936' },
    Done: { label: getStatusLabel(language, 'Done'), color: '#38B2AC' },
  }), [language]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  if (project.tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-white rounded-2xl border border-dashed border-slate-300">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <i className="fas fa-chart-pie text-2xl text-slate-300"></i>
        </div>
        <p className="font-bold text-lg text-slate-600">{text.noTasksYet}</p>
        <p className="text-sm text-slate-400 mt-2">{text.addTasksPrompt}</p>
      </div>
    );
  }

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = project.tasks.filter(t => t.status === 'In Progress').length;
  const totalEstimated = project.tasks.reduce((s, t) => s + t.estimatedHours, 0);
  const totalActual = project.tasks.reduce((s, t) => s + t.actualHours, 0);
  const overdueTasks = project.tasks.filter(t => new Date(t.endDate) < today && t.status !== 'Done').length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const hoursPct = totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0;

  const dueDateStatus = project.dueDate ? getDueDateStatus(project.dueDate, today, language) : null;
  const dueDateFormatted = project.dueDate
    ? new Date(project.dueDate + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const statusCounts = project.tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status],
    color: statusConfig[status as keyof typeof statusConfig]?.color ?? '#94a3b8',
    label: statusConfig[status as keyof typeof statusConfig]?.label ?? status,
  }));

  const sortedStages = [...project.stages].sort((a, b) => a.order - b.order);
  const stageBarData = sortedStages
    .map(stage => {
      const stageTasks = project.tasks.filter(t => t.stageId === stage.id);
      return {
        name: stage.name.length > 14 ? stage.name.slice(0, 13) + '...' : stage.name,
        estimated: stageTasks.reduce((s, t) => s + t.estimatedHours, 0),
        actual: stageTasks.reduce((s, t) => s + t.actualHours, 0),
      };
    })
    .filter(d => d.estimated > 0 || d.actual > 0);

  type StageRow = { stage: typeof sortedStages[0]; done: number; total: number; pct: number; est: number; act: number; color: string };
  const stageProgress: StageRow[] = sortedStages
    .map((stage, i) => {
      const stageTasks = project.tasks.filter(t => t.stageId === stage.id);
      if (stageTasks.length === 0) return null;
      const done = stageTasks.filter(t => t.status === 'Done').length;
      const pct = Math.round((done / stageTasks.length) * 100);
      const est = stageTasks.reduce((s, t) => s + t.estimatedHours, 0);
      const act = stageTasks.reduce((s, t) => s + t.actualHours, 0);
      return { stage, done, total: stageTasks.length, pct, est, act, color: STAGE_PALETTE[i % STAGE_PALETTE.length] };
    })
    .filter((r): r is StageRow => r !== null);

  const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-3 text-xs min-w-[140px]">
        <p className="font-black mb-2 text-slate-200 truncate">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.fill }}></span>
            <span className="text-slate-300">{p.name}:</span>
            <span className="font-bold ml-auto">{p.value}h</span>
          </div>
        ))}
      </div>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    const cfg = statusConfig[name as keyof typeof statusConfig] || { label: name, color: '#94a3b8' };
    return (
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }}></span>
          <span className="font-bold">{cfg.label}:</span>
          <span>{value} {text.tasksWord(value)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {dueDateStatus && dueDateFormatted && (
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ borderLeftWidth: 4, borderLeftColor: dueDateStatus.color }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-sm"
              style={{ background: dueDateStatus.color }}
            >
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{text.projectDueDate}</p>
              <p className="text-base font-black text-slate-900 leading-none">{dueDateFormatted}</p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0 self-start sm:self-auto"
            style={{ background: dueDateStatus.color + '15' }}
          >
            <i className="fas fa-hourglass-half text-sm" style={{ color: dueDateStatus.color }}></i>
            <div>
              <p className="text-xs font-black leading-none" style={{ color: dueDateStatus.color }}>{dueDateStatus.label}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {dueDateStatus.days < 0 ? text.deadlineExpired : text.dueCountdown}
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-[160px] sm:max-w-[240px]">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <span>{text.overallProgress}</span>
              <span style={{ color: dueDateStatus.color }}>{completionPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%`, background: dueDateStatus.color }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">{text.completedTasksSummary(doneTasks, totalTasks)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title={text.totalTasks}
          value={totalTasks}
          icon="fa-tasks"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          accentColor="#4299E1"
        />
        <KpiCard
          title={text.completed}
          value={doneTasks}
          icon="fa-check-circle"
          iconBg="bg-green-50"
          iconColor="text-green-600"
          accentColor="#38B2AC"
          progressValue={completionPct}
          sub={`${completionPct}%`}
        />
        <KpiCard
          title={text.inProgress}
          value={inProgressTasks}
          icon="fa-spinner"
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          accentColor="#9F7AEA"
        />
        <KpiCard
          title={text.estimatedHours}
          value={`${totalEstimated}h`}
          icon="fa-clock"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          accentColor="#f59e0b"
          progressValue={hoursPct}
          sub={text.loggedHoursSummary(totalActual, hoursPct)}
        />
        <KpiCard
          title={text.delayed}
          value={overdueTasks}
          icon="fa-exclamation-triangle"
          iconBg={overdueTasks > 0 ? 'bg-red-50' : 'bg-slate-50'}
          iconColor={overdueTasks > 0 ? 'text-red-500' : 'text-slate-400'}
          accentColor={overdueTasks > 0 ? '#ef4444' : '#cbd5e1'}
          sub={overdueTasks > 0 ? text.attentionRequired : text.onTrack}
        />
        {dueDateStatus ? (
          <KpiCard
            title={text.dueDate}
            value={dueDateStatus.short}
            icon={dueDateStatus.days < 0 ? 'fa-calendar-times' : 'fa-hourglass-half'}
            iconBg="bg-transparent"
            iconColor=""
            accentColor={dueDateStatus.color}
            sub={dueDateFormatted ?? ''}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm p-5 flex flex-col gap-3 items-center justify-center text-center cursor-default">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <i className="fas fa-calendar-plus text-slate-300 text-sm"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{text.dueDate}</p>
              <p className="text-xs text-slate-300 font-medium">{text.undefinedDueDate}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" role="img" aria-label={text.statusDistribution}>
          <div className="mb-5">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">{text.statusDistribution}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{text.statusDistributionSubtitle}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="h-48 sm:h-56 flex-1 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={224}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 sm:gap-3.5 flex-shrink-0">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: entry.color }}></span>
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 leading-none">{entry.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {entry.value} {text.tasksWord(entry.value)} · {Math.round((entry.value / totalTasks) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6" role="img" aria-label={text.stageHours}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">{text.stageHours}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{text.stageHoursSubtitle}</p>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full mr-1.5" style={{ background: '#4299E1' }}></span>{text.estShort}
              </span>
              <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full mr-1.5" style={{ background: '#38B2AC' }}></span>{text.realShort}
              </span>
            </div>
          </div>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={192}>
              <BarChart data={stageBarData} barGap={4} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} width={28} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
                <Bar dataKey="estimated" fill="#4299E1" radius={[6, 6, 0, 0]} name={text.estimatedSeries} barSize={22} />
                <Bar dataKey="actual" fill="#38B2AC" radius={[6, 6, 0, 0]} name={text.actualSeries} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {stageProgress.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">{text.stageProgress}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{text.stageProgressSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {stageProgress.map(({ stage, done, total, pct, est, act, color }) => (
              <div key={stage.id} className="flex flex-col gap-2.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }}></span>
                    <span className="text-[11px] font-black text-slate-700 truncate">{stage.name}</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: color + '20', color }}>
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span><span className="text-slate-600 font-bold">{done}</span> / {total} {text.tasksWord(total)}</span>
                  <span><span className="text-slate-600 font-bold">{act}h</span> / {est}h {text.estLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
