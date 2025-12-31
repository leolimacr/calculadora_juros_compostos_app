import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-4 text-center">
          <div className="bg-slate-800 border border-red-500/30 p-8 rounded-2xl max-w-md">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Algo deu errado.</h2>
            <p className="text-slate-400 mb-6">
              Ocorreu um erro inesperado nesta seção. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-bold"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;