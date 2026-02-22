import { useState, useEffect } from 'react';
import { Project, AISettings } from '@/types';
import { getProjectInsights, Insight } from '@/services/geminiService';

export function useInsights(activeProject: Project | undefined, aiSettings: AISettings) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    if (!aiSettings.enabled) {
      setInsights([]);
      return;
    }
    if (!activeProject || activeProject.tasks.length === 0) {
      setInsights([]);
      return;
    }

    const controller = new AbortController();
    setIsLoadingInsights(true);

    const fetchInsights = async () => {
      const data = await getProjectInsights(activeProject, aiSettings.model, controller.signal);
      if (!controller.signal.aborted) {
        setInsights(data);
        setIsLoadingInsights(false);
      }
    };
    fetchInsights();
    return () => { controller.abort(); };
  }, [activeProject, aiSettings.enabled, aiSettings.model]);

  return { insights, isLoadingInsights };
}
