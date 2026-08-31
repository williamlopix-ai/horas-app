import { type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SecaoColapsavelProps {
  titulo: string
  aberto: boolean
  onToggle: () => void
  contador?: string
  descricao?: string
  acao?: ReactNode
  className?: string
}

export function SecaoColapsavel({
  titulo,
  aberto,
  onToggle,
  contador,
  descricao,
  acao,
  className = '',
}: SecaoColapsavelProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-sm group focus:outline-none py-2 min-h-[44px]"
        >
          <ChevronDown
            className={`w-icon-sm h-icon-sm text-ink-500 transition-transform duration-d2 ease-ez ${aberto ? 'rotate-180' : ''}`}
          />
          <h2 className="text-xl font-display font-bold text-ink-900">{titulo}</h2>
          {!aberto && contador && (
            <span className="text-xs text-ink-500 font-ui font-normal">{contador}</span>
          )}
        </button>
        {acao}
      </div>
      {descricao && aberto && (
        <p className="text-xs text-ink-500 mt-xs ml-lg">{descricao}</p>
      )}
    </div>
  )
}
