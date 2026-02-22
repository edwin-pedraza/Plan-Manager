import React, { useState } from 'react';
import { generateProjectPlan, AIPlanStage, AITaskPlan } from '@/services/geminiService';
import { Project, Stage, Task } from '@/types';
import { useAppContext } from '@/context/AppContext';

interface AIPlannerProps {
  onPlanGenerated: (newProject: Omit<Project, 'id'>) => void;
  model: string;
}

const AIPlanner: React.FC<AIPlannerProps> = ({ onPlanGenerated, model }) => {
  const { language } = useAppContext();

  const text = language === 'es'
    ? {
        emptyDescription: 'Por favor describe el proyecto.',
        generationFailed: 'No se pudo generar el plan. Intenta de nuevo.',
        title: 'Planificador de proyectos IA',
        subtitle: 'Describe tu proyecto y deja que Gemini genere una jerarquia de tareas y cronograma.',
        scopeLabel: 'Alcance y objetivos del proyecto',
        scopePlaceholder: 'Ej: Quiero crear una app movil de compras sostenibles con backend en Node.js y frontend en React Native...',
        generateAria: 'Generar plan de proyecto con IA',
        analyzing: 'Analizando y planificando...',
        generatePlan: 'Generar plan profesional',
        feature1: 'Desglose automatico por etapas',
        feature2: 'Estimaciones de esfuerzo calculadas',
        feature3: 'Secuencia de cronograma optimizada',
        feature4: 'Descripciones detalladas de tareas',
        unassigned: 'Sin asignar',
      }
    : {
        emptyDescription: 'Please provide a project description.',
        generationFailed: 'Failed to generate project plan. Please try again.',
        title: 'AI Project Planner',
        subtitle: 'Describe your project and let Gemini generate a full task hierarchy and timeline.',
        scopeLabel: 'Project Scope and Objectives',
        scopePlaceholder: 'e.g. I want to build a mobile app for sustainable grocery shopping with a Node.js backend and a React Native frontend...',
        generateAria: 'Generate AI project plan',
        analyzing: 'Analyzing and planning...',
        generatePlan: 'Generate professional plan',
        feature1: 'Automatic stage breakdown',
        feature2: 'Calculated effort estimations',
        feature3: 'Optimized timeline sequence',
        feature4: 'Detailed task descriptions',
        unassigned: 'Unassigned',
      };

  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError(text.emptyDescription);
      return;
    }

    setLoading(true);
    setError('');

    const result = await generateProjectPlan(description, model);

    if (result && result.stages && result.stages.length > 0) {
      const stages: Stage[] = result.stages.map((s: AIPlanStage, idx: number) => ({
        id: `s-gen-${idx}`,
        name: s.name,
        order: idx
      }));

      const tasks: Task[] = [];
      let currentDate = new Date();

      result.stages.forEach((s: AIPlanStage, sIdx: number) => {
        s.tasks.forEach((t: AITaskPlan, tIdx: number) => {
          const endDate = new Date(currentDate);
          endDate.setDate(currentDate.getDate() + (t.durationDays || 2));

          tasks.push({
            id: `t-gen-${sIdx}-${tIdx}`,
            title: t.title,
            description: t.description,
            stageId: `s-gen-${sIdx}`,
            status: 'Todo',
            startDate: currentDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            estimatedHours: t.estimatedHours,
            actualHours: 0,
            assignee: text.unassigned,
          });

          currentDate = new Date(endDate);
        });
      });

      onPlanGenerated({
        name: description.split('.')[0],
        description,
        stages,
        tasks,
      });
      setDescription('');
    } else {
      setError(text.generationFailed);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
          <i className="fas fa-magic text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{text.title}</h2>
        <p className="text-slate-500 mt-2">{text.subtitle}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">{text.scopeLabel}</label>
          <textarea
            className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            placeholder={text.scopePlaceholder}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          aria-label={text.generateAria}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {text.analyzing}
            </span>
          ) : text.generatePlan}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="flex items-start space-x-3 text-xs text-slate-400">
          <i className="fas fa-check text-green-500 mt-1"></i>
          <span>{text.feature1}</span>
        </div>
        <div className="flex items-start space-x-3 text-xs text-slate-400">
          <i className="fas fa-check text-green-500 mt-1"></i>
          <span>{text.feature2}</span>
        </div>
        <div className="flex items-start space-x-3 text-xs text-slate-400">
          <i className="fas fa-check text-green-500 mt-1"></i>
          <span>{text.feature3}</span>
        </div>
        <div className="flex items-start space-x-3 text-xs text-slate-400">
          <i className="fas fa-check text-green-500 mt-1"></i>
          <span>{text.feature4}</span>
        </div>
      </div>
    </div>
  );
};

export default AIPlanner;
