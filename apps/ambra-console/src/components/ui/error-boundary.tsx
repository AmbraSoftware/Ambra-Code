"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary para capturar erros de renderização
 * e exibir uma UI amigável ao usuário
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para exibir a UI de fallback
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para monitoramento
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Aqui você pode integrar com Sentry, LogRocket, etc:
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // Recarrega a página para tentar novamente
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // UI customizada de erro
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-6 rounded-lg border border-destructive/50 bg-card p-8 shadow-lg">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Algo deu errado
                </h2>
                <p className="text-sm text-muted-foreground">
                  Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada.
                </p>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="w-full rounded-md bg-muted p-3 text-left">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                    Detalhes do erro (apenas em desenvolvimento)
                  </summary>
                  <pre className="mt-2 overflow-auto text-xs text-destructive">
                    {this.state.error.toString()}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}

              <Button 
                onClick={this.handleReset}
                className="w-full"
                variant="default"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
