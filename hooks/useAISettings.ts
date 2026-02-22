import { useState, useEffect } from 'react';
import { AISettings } from '@/types';
import { StorageService } from '@/services/storageService';

export function useAISettings() {
  const [aiSettings, setAISettings] = useState<AISettings>(() => StorageService.loadAISettings());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    StorageService.loadData().then((data) => {
      if (!alive) return;
      setAISettings(data.aiSettings);
      setIsHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    StorageService.saveAISettings(aiSettings);
  }, [aiSettings, isHydrated]);

  const toggleAI = () => {
    setAISettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const setModel = (model: string) => {
    setAISettings(prev => ({ ...prev, model }));
  };

  return { aiSettings, toggleAI, setModel };
}
