import { Project } from '../types';

export interface AIPlanStage {
  name: string;
  tasks: AITaskPlan[];
}

export interface AITaskPlan {
  title: string;
  description: string;
  estimatedHours: number;
  durationDays: number;
}

export interface AIPlanResult {
  stages: AIPlanStage[];
}

export interface Insight {
  title: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High';
}

const CLIENT_TIMEOUT_MS = 35_000;

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  const combinedSignal = signal || controller.signal;
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    return await fetch(url, { ...init, signal: combinedSignal });
  } finally {
    clearTimeout(timer);
  }
};

export const generateProjectPlan = async (
  description: string,
  model: string,
  signal?: AbortSignal,
): Promise<AIPlanResult | null> => {
  try {
    const response = await fetchWithTimeout(
      '/api/ai/generate-plan',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, model }),
      },
      signal,
    );

    if (!response.ok) return null;

    const json = await response.json();
    if (!json.ok || !json.data) return null;

    const result = json.data as AIPlanResult;
    if (!result.stages || !Array.isArray(result.stages)) return null;

    // Validate shape
    result.stages = result.stages.filter(
      (s: AIPlanStage) =>
        typeof s.name === 'string' &&
        Array.isArray(s.tasks),
    );
    result.stages.forEach((s: AIPlanStage) => {
      s.tasks = s.tasks.filter(
        (t: AITaskPlan) =>
          typeof t.title === 'string' &&
          typeof t.description === 'string' &&
          typeof t.estimatedHours === 'number' &&
          typeof t.durationDays === 'number',
      );
    });

    return result;
  } catch (error) {
    console.error('AI Generation Error:', error);
    return null;
  }
};

export const getProjectInsights = async (
  projectData: Project,
  model: string,
  signal?: AbortSignal,
): Promise<Insight[]> => {
  try {
    const response = await fetchWithTimeout(
      '/api/ai/insights',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData, model }),
      },
      signal,
    );

    if (!response.ok) return [];

    const json = await response.json();
    if (!json.ok || !json.data) return [];

    const data = json.data as Insight[];
    if (!Array.isArray(data)) return [];

    return data.filter(
      (i: Insight) =>
        typeof i.title === 'string' &&
        typeof i.description === 'string' &&
        typeof i.urgency === 'string',
    );
  } catch (error) {
    console.error('Insight Generation Error:', error);
    return [];
  }
};
