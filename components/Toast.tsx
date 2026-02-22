import React from 'react';
import { useToast } from '@/context/ToastContext';
import { useAppContext } from '@/context/AppContext';

const Toast: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const { language } = useAppContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => {
        const bg =
          toast.type === 'success' ? 'bg-green-600' :
          toast.type === 'error' ? 'bg-red-600' :
          'bg-slate-800';
        const icon =
          toast.type === 'success' ? 'fa-check-circle' :
          toast.type === 'error' ? 'fa-exclamation-circle' :
          'fa-info-circle';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto ${bg} text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-right duration-300 max-w-sm`}
            role="alert"
          >
            <i className={`fas ${icon} text-white/80`}></i>
            <span className="flex-1">{toast.text}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label={language === 'es' ? 'Cerrar notificacion' : 'Close notification'}
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
