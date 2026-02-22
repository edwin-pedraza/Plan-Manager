import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const getLanguage = (): 'en' | 'es' => {
  if (typeof window === 'undefined' || !window.localStorage) return 'en';
  const value = window.localStorage.getItem('planner-language');
  return value === 'es' ? 'es' : 'en';
};

const copy = {
  en: {
    title: 'Something went wrong',
    body: 'An unexpected error occurred. You can try to reload the application.',
    retry: 'Try Again',
  },
  es: {
    title: 'Algo salio mal',
    body: 'Ocurrio un error inesperado. Puedes intentar recargar la aplicacion.',
    retry: 'Reintentar',
  },
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const language = getLanguage();
    const text = copy[language];

    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <h1 className="text-xl font-black text-slate-800 mb-2">{text.title}</h1>
            <p className="text-sm text-slate-500 mb-6">
              {text.body}
            </p>
            {this.state.error && (
              <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 mb-6 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleRetry}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
            >
              {text.retry}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
