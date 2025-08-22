import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  text 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

interface LoadingCardProps {
  className?: string;
  children?: React.ReactNode;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ className = '', children }) => {
  return (
    <div className={`card animate-pulse ${className}`}>
      {children || (
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      )}
    </div>
  );
};

interface PageLoadingProps {
  text?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  text = 'Carregando dados...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">
          {text}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Por favor, aguarde um momento
        </p>
      </div>
    </div>
  );
};
