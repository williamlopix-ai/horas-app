import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert, RefreshCw } from 'lucide-react'
import { Button, Surface } from './ui'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary capturou um erro não tratado:', error, errorInfo)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-surface-0 flex items-center justify-center p-4">
          <Surface
            elevacao={2}
            padding="lg"
            comBorda={true}
            className="w-full max-w-md flex flex-col items-center text-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-bad-bg flex items-center justify-center text-bad shrink-0">
              <TriangleAlert className="w-icon-lg h-icon-lg" />
            </div>

            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-ink-900">
                Algo deu errado
              </h1>
              <p className="text-sm text-ink-700">
                Ocorreu um erro inesperado ao carregar esta tela.
              </p>
            </div>

            <Button
              variante="primario"
              tamanho="md"
              larguraTotal={true}
              iconeEsquerda={<RefreshCw className="w-icon-xs h-icon-xs" />}
              onClick={this.handleReload}
            >
              Recarregar a página
            </Button>

            {this.state.error && (
              <details className="w-full text-left text-xs bg-surface-1 border border-hair rounded-ctl p-3 text-ink-500 overflow-hidden">
                <summary className="cursor-pointer text-ink-700 font-medium hover:text-ink-900 select-none">
                  Detalhes técnicos do erro
                </summary>
                <div className="mt-2 font-mono text-[11px] text-ink-500 whitespace-pre-wrap break-all select-all">
                  {this.state.error.toString()}
                </div>
              </details>
            )}
          </Surface>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
