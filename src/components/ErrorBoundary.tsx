'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showHomeButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    
    // Optional: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (typeof window !== 'undefined') {
    //   // Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle, fallbackMessage, showHomeButton = true } = this.props;
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full border-destructive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <CardTitle className="text-2xl">
                  {fallbackTitle || 'Ups! Etwas ist schiefgelaufen'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {fallbackMessage || 
                  'Die Seite konnte nicht geladen werden. Bitte versuche es erneut oder kehre zur Startseite zurück.'}
              </p>

              {/* Development: Show error details */}
              {isDev && this.state.error && (
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="font-mono text-sm text-destructive font-semibold mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-64 text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={this.handleReset} variant="default" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Erneut versuchen
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Seite neu laden
                </Button>
                {showHomeButton && (
                  <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                    <Home className="h-4 w-4" />
                    Zur Startseite
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


