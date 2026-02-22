import { useState, useEffect } from 'react';
import { TimeLog } from '@/types';
import { StorageService } from '@/services/storageService';

export function useTimeLogs() {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(() => StorageService.loadTimeLogs());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    StorageService.loadData().then((data) => {
      if (!alive) return;
      setTimeLogs(data.timeLogs);
      setIsHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    StorageService.saveTimeLogs(timeLogs);
  }, [timeLogs, isHydrated]);

  const addLog = (log: Omit<TimeLog, 'id'>) => {
    const newLog = { ...log, id: `log-${Date.now()}` };
    setTimeLogs(prev => [...prev, newLog]);
  };

  const updateLog = (logId: string, updates: Pick<TimeLog, 'hours' | 'date'>) => {
    setTimeLogs(prev => prev.map(l => (l.id === logId ? { ...l, ...updates } : l)));
  };

  const deleteLog = (logId: string) => {
    setTimeLogs(prev => prev.filter(l => l.id !== logId));
  };

  const backfillStageIds = (taskStageMap: Map<string, string>) => {
    setTimeLogs(prev => {
      let changed = false;
      const next = prev.map(log => {
        if (log.stageId) return log;
        const stageId = taskStageMap.get(log.taskId);
        if (!stageId) return log;
        changed = true;
        return { ...log, stageId };
      });
      return changed ? next : prev;
    });
  };

  const removeLogsForTask = (taskId: string) => {
    setTimeLogs(prev => prev.filter(l => l.taskId !== taskId));
  };

  const removeLogsForTasks = (taskIds: string[]) => {
    if (taskIds.length === 0) return;
    const ids = new Set(taskIds);
    setTimeLogs(prev => prev.filter(l => !ids.has(l.taskId)));
  };

  return { timeLogs, isHydrated, addLog, updateLog, deleteLog, backfillStageIds, removeLogsForTask, removeLogsForTasks };
}
