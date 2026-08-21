import { type ReactNode } from 'react'

export type BarraSegmentada = {
  realizado: number // horas lançadas
  reservado: number // horas reservadas
  teto: number // horas previstas (denominador)
}

export interface DataRowProps {
  titulo: ReactNode
  descricao?: ReactNode
  valor?: ReactNode // alinhado à direita, font-mono tabular-nums
  percentual?: number | null
  barra?: BarraSegmentada
  acoes?: ReactNode // slot à direita, tipicamente um MenuAcoes
  onClick?: () => void
  className?: string
}

export function DataRow({
  titulo,
  descricao,
  valor,
  percentual,
  barra,
  acoes,
  onClick,
  className = '',
}: DataRowProps) {
  const renderBarra = () => {
    if (!barra || barra.teto <= 0) return null

    const { realizado, reservado, teto } = barra

    if (realizado > teto) {
      return (
        <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden mt-1.5">
          <div className="h-full w-full bg-bad transition-all duration-d2 ease-ez" />
        </div>
      )
    }

    const realizadoClamp = Math.min(Math.max(0, realizado), teto)
    const reservadoNaoRealizado = Math.max(0, reservado - realizado)
    const reservadoClamp = Math.min(reservadoNaoRealizado, Math.max(0, teto - realizadoClamp))

    const pctRealizado = (realizadoClamp / teto) * 100
    const pctReservado = (reservadoClamp / teto) * 100

    return (
      <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden flex mt-1.5">
        {pctRealizado > 0 && (
          <div
            className="h-full bg-ok transition-all duration-d2 ease-ez"
            style={{ width: `${pctRealizado}%` }}
          />
        )}
        {pctReservado > 0 && (
          <div
            className="h-full bg-accent transition-all duration-d2 ease-ez"
            style={{ width: `${pctReservado}%` }}
          />
        )}
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-2 text-left transition-colors duration-d1 ease-ez ${
        onClick ? 'cursor-pointer hover:bg-surface-3 rounded-ctl -mx-2 px-2' : ''
      } ${className}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-ink-900 truncate">{titulo}</div>
        {descricao && <div className="text-[11.5px] text-ink-500 truncate mt-0.5">{descricao}</div>}
        {renderBarra()}
      </div>

      <div className="shrink-0 font-mono tabular-nums text-[13px] text-ink-900 text-right">
        {valor ?? ''}
      </div>

      <div className="w-10 shrink-0 text-right font-mono tabular-nums text-[11px] text-ink-500">
        {percentual != null ? `${percentual}%` : ''}
      </div>

      {acoes && (
        <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
          {acoes}
        </div>
      )}
    </div>
  )
}
