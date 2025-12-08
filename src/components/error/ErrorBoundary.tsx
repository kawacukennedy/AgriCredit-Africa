'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showError?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (!this.props.showError) {
        return (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">😵</div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-neutral-600">
                We're working to fix this. Please try refreshing the page.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="p-4 space-y-4">
          <Alert
            variant="error"
            title="Application Error"
            message={this.state.error?.message || 'An unexpected error occurred'}
          />
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 text-xs bg-neutral-100 p-2 rounded overflow-auto max-h-40">
                {this.state.error?.stack}
                {'\n\nComponent Stack:\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              Refresh Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
              className="px-4 py-2 bg-neutral-200 text-neutral-900 rounded hover:bg-neutral-300"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different levels
export const PageErrorBoundary: React.FC<{
  children: ReactNode;
  pageName?: string;
}> = ({ children, pageName }) => (
  <ErrorBoundary
    level="page"
    onError={(error, errorInfo) => {
      // Log page-level errors
      console.error(`Page Error (${pageName}):`, error, errorInfo);
    }}
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-8xl mb-6">🚫</div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            Page Unavailable
          </h1>
          <p className="text-neutral-600 mb-6">
            We're experiencing technical difficulties. Our team has been notified.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-neutral-200 text-neutral-900 rounded-lg hover:bg-neutral-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const SectionErrorBoundary: React.FC<{
  children: ReactNode;
  sectionName?: string;
  fallback?: ReactNode;
}> = ({ children, sectionName, fallback }) => (
  <ErrorBoundary
    level="section"
    showError={false}
    onError={(error, errorInfo) => {
      console.error(`Section Error (${sectionName}):`, error, errorInfo);
    }}
    fallback={
      fallback || (
        <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              Section Temporarily Unavailable
            </h3>
            <p className="text-sm text-neutral-600">
              This section encountered an error. Other parts of the page should still work.
            </p>
          </div>
        </div>
      )
    }
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
}> = ({ children, componentName, fallback }) => (
  <ErrorBoundary
    level="component"
    showError={false}
    onError={(error, errorInfo) => {
      console.error(`Component Error (${componentName}):`, error, errorInfo);
    }}
    fallback={
      fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-center">
          <div className="text-red-600 text-sm">
            Component failed to load
          </div>
        </div>
      )
    }
  >
    {children}
  </ErrorBoundary>
);

// Hook for handling async errors in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Async Error:', error, errorInfo);

    // In a real app, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // sendErrorToService(error, errorInfo);
    }
  };
}