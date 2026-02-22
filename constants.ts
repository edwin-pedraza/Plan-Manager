
import { Project, TimeLog, Member } from './types';
import seed from './data/seed.json';

const FALLBACK_PROJECT: Project = {
  id: 'p0',
  name: 'Proyecto',
  description: '',
  stages: [
    { id: 'stg-default-0', name: 'Planeación', order: 0 },
    { id: 'stg-default-1', name: 'Descubrimiento', order: 1 },
    { id: 'stg-default-2', name: 'Desarrollo', order: 2 },
    { id: 'stg-default-3', name: 'Pruebas', order: 3 },
    { id: 'stg-default-4', name: 'Verificación', order: 4 },
    { id: 'stg-default-5', name: 'Lanzamiento', order: 5 },
  ],
  tasks: []
};

const seedProjects = Array.isArray(seed.projects) && seed.projects.length > 0
  ? (seed.projects as Project[])
  : [FALLBACK_PROJECT];

const seedTimeLogs = Array.isArray(seed.timeLogs)
  ? (seed.timeLogs as TimeLog[])
  : [];

const seedMembers = Array.isArray((seed as any).members)
  ? ((seed as any).members as Member[])
  : [];

export const INITIAL_PROJECTS: Project[] = seedProjects;
export const INITIAL_PROJECT: Project = seedProjects[0];
export const INITIAL_TIMELOGS: TimeLog[] = seedTimeLogs;
export const INITIAL_MEMBERS: Member[] = seedMembers;
