import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#051E44] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#082A5E] rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-blue-900/50 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-[#172033] dark:text-white">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                An unexpected display issue occurred. Your data is safe. You can reload this view or return to the main dashboard.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 text-left overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/60 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md border border-[#D4AF37]/40"
              >
                <Home className="w-4 h-4 text-[#D4AF37]" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
 );
 }

 return this.props.children;
 }
}