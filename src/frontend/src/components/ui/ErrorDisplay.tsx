import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import type { AppError } from '../../types';

interface ErrorDisplayProps {
  error: AppError | string | null;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  className = '' 
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = typeof error === 'string' ? 'UNKNOWN' : error.code;
  const isNetworkError = errorCode === 'NETWORK_ERROR';

  return (
    <div className={`card border-red-200 bg-red-50 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {isNetworkError ? (
            <WifiOff className="h-5 w-5 text-red-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800">
            {isNetworkError ? 'Erro de Conexão' : 'Ops! Algo deu errado'}
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {errorMessage}
          </p>
          {import.meta.env.DEV && errorCode !== 'UNKNOWN' && (
            <p className="text-xs text-red-600 mt-1 font-mono">
              Código: {errorCode}
            </p>
          )}
        </div>
        
        {onRetry && (
          <div className="flex-shrink-0">
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-100 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; onRetry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} onRetry={this.handleRetry} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={{
                code: 'COMPONENT_ERROR',
                message: this.state.error?.message || 'Erro inesperado na aplicação'
              }}
              onRetry={this.handleRetry}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface NetworkStatusProps {
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 ${className}`}>
      <div className="container mx-auto flex items-center justify-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">
          Sem conexão com a internet
        </span>
      </div>
    </div>
  );
};
