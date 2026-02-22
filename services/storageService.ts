import { Project, TimeLog, AISettings, Member } from '../types';
import { INITIAL_PROJECTS, INITIAL_TIMELOGS, INITIAL_MEMBERS } from '../constants';

interface AppData {
  projects: Project[];
  activeProjectId: string;
  timeLogs: TimeLog[];
  aiSettings: AISettings;
  members: Member[];
}

const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: true,
  model: 'gemini-2.5-flash',
};

const DEFAULT_DATA: AppData = {
  projects: INITIAL_PROJECTS,
  activeProjectId: INITIAL_PROJECTS[0]?.id ?? '',
  timeLogs: INITIAL_TIMELOGS,
  aiSettings: DEFAULT_AI_SETTINGS,
  members: INITIAL_MEMBERS,
};

const LEGACY_KEYS = {
  PROJECTS: 'protrack-projects',
  ACTIVE_PROJECT_ID: 'protrack-active-project-id',
  TIME_LOGS: 'protrack-time-logs',
  AI_SETTINGS: 'protrack-ai-settings',
};

let cache: AppData = DEFAULT_DATA;
let loadPromise: Promise<AppData> | null = null;
let saveErrorCallback: ((error: Error) => void) | null = null;

// Debounce state
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 300;

const normalizeData = (input: Partial<AppData>, fallback: AppData): AppData => ({
  projects: Array.isArray(input.projects) ? input.projects : fallback.projects,
  activeProjectId: typeof input.activeProjectId === 'string' ? input.activeProjectId : fallback.activeProjectId,
  timeLogs: Array.isArray(input.timeLogs) ? input.timeLogs : fallback.timeLogs,
  aiSettings: input.aiSettings && typeof input.aiSettings.enabled === 'boolean' && typeof input.aiSettings.model === 'string'
    ? input.aiSettings
    : fallback.aiSettings,
  members: Array.isArray(input.members) ? input.members : fallback.members,
});

const readLegacyData = (): Partial<AppData> | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const projectsRaw = window.localStorage.getItem(LEGACY_KEYS.PROJECTS);
    if (!projectsRaw) return null;
    const projects = JSON.parse(projectsRaw) as Project[];
    if (!Array.isArray(projects) || projects.length === 0) return null;

    const activeProjectIdRaw = window.localStorage.getItem(LEGACY_KEYS.ACTIVE_PROJECT_ID);
    const activeProjectId = activeProjectIdRaw ? JSON.parse(activeProjectIdRaw) as string : '';

    const timeLogsRaw = window.localStorage.getItem(LEGACY_KEYS.TIME_LOGS);
    const timeLogs = timeLogsRaw ? JSON.parse(timeLogsRaw) as TimeLog[] : [];

    const aiSettingsRaw = window.localStorage.getItem(LEGACY_KEYS.AI_SETTINGS);
    const aiSettings = aiSettingsRaw ? JSON.parse(aiSettingsRaw) as AISettings : DEFAULT_AI_SETTINGS;

    return { projects, activeProjectId, timeLogs, aiSettings };
  } catch {
    return null;
  }
};

const clearLegacyData = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(LEGACY_KEYS.PROJECTS);
  window.localStorage.removeItem(LEGACY_KEYS.ACTIVE_PROJECT_ID);
  window.localStorage.removeItem(LEGACY_KEYS.TIME_LOGS);
  window.localStorage.removeItem(LEGACY_KEYS.AI_SETTINGS);
};

const API_URL = '/api/data';

const flushSave = async () => {
  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cache),
    });
    if (!res.ok) {
      throw new Error(`Save failed: ${res.status}`);
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('StorageService save error:', error);
    if (saveErrorCallback) saveErrorCallback(error);
  }
};

export const StorageService = {
  onSaveError: (cb: (error: Error) => void) => {
    saveErrorCallback = cb;
  },

  getData: (): AppData => cache,

  loadData: async (): Promise<AppData> => {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Failed to load data: ${response.status}`);
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Invalid content type');
        }
        const data = await response.json() as Partial<AppData>;
        cache = normalizeData(data, cache);

        const legacy = readLegacyData();
        if (legacy) {
          const migrated = normalizeData(legacy, cache);
          cache = migrated;
          try {
            await fetch(API_URL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cache),
            });
            clearLegacyData();
          } catch {
            // ignore migration failures
          }
        }
      } catch {
        const legacy = readLegacyData();
        if (legacy) {
          cache = normalizeData(legacy, cache);
          try {
            await fetch(API_URL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cache),
            });
            clearLegacyData();
          } catch {
            // ignore migration failures
          }
        }
      } finally {
        loadPromise = null;
      }
      return cache;
    })();
    return loadPromise;
  },

  saveData: async (partial: Partial<AppData>) => {
    cache = normalizeData(partial, cache);
    if (!cache.activeProjectId && cache.projects.length > 0) {
      cache.activeProjectId = cache.projects[0].id;
    } else if (cache.activeProjectId && !cache.projects.find(p => p.id === cache.activeProjectId)) {
      cache.activeProjectId = cache.projects[0]?.id ?? '';
    }

    // Debounce: batch rapid saves into one request
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void flushSave();
    }, DEBOUNCE_MS);
  },

  loadProjects: (): Project[] => cache.projects,
  loadActiveProjectId: (): string => cache.activeProjectId,
  loadTimeLogs: (): TimeLog[] => cache.timeLogs,
  loadAISettings: (): AISettings => cache.aiSettings,
  loadMembersSync: (): Member[] => cache.members,

  saveProjects: (projects: Project[]) => { void StorageService.saveData({ projects }); },
  saveActiveProjectId: (id: string) => { void StorageService.saveData({ activeProjectId: id }); },
  saveTimeLogs: (logs: TimeLog[]) => { void StorageService.saveData({ timeLogs: logs }); },
  saveAISettings: (settings: AISettings) => { void StorageService.saveData({ aiSettings: settings }); },
  loadMembers: (): Member[] => cache.members,
  saveMembers: (members: Member[]) => { void StorageService.saveData({ members }); },
};
