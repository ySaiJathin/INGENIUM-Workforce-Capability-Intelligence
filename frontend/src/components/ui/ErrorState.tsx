import React from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { ApiError } from '../../services/httpClient';

interface ErrorStateProps {
  error: ApiError | Error;
  onRetry?: () => void;
}

function describe(error: ApiError | Error): { title: string; message: string; icon: React.ReactNode } {
  if (error instanceof ApiError) {
    if (error.kind === 'network') {
      return {
        title: "Couldn't reach the server",
        message: 'Check that the backend is running and try again.',
        icon: <WifiOff className="w-6 h-6 text-rose-500" />
      };
    }
    if (error.kind === 'server') {
      return {
        title: 'Server error',
        message: error.message || 'Something went wrong on the server — try again.',
        icon: <AlertTriangle className="w-6 h-6 text-rose-500" />
      };
    }
    return {
      title: 'Request failed',
      message: error.message,
      icon: <AlertTriangle className="w-6 h-6 text-amber-500" />
    };
  }
  return {
    title: 'Something went wrong',
    message: error.message || 'An unexpected error occurred.',
    icon: <AlertTriangle className="w-6 h-6 text-rose-500" />
  };
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const { title, message, icon } = describe(error);

  return (
    <div className="card-enterprise flex flex-col items-center justify-center gap-3 py-12 px-6 text-center border-rose-200/80">
      {icon}
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-2">
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Retry
        </button>
      )}
    </div>
  );
};
