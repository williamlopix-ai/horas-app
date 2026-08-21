import { type ReactNode } from 'react'

export type TomStat = 'neutro' | 'ok' | 'alerta' | 'erro'

export interface StatProps {
  rotulo: string
  valor: ReactNode
  unidade?: string
  apoio?: ReactNode
  tom?: TomStat
  icone?: ReactNode
  className?: string
}

export function Stat({
  rotulo,
  valor,
  unidade,
  apoio,
  tom = 'neutro',
  icone,
  className = '',
}: StatProps) {
  const tomValorClasses = {
    neutro: 'text-ink-900',
    ok: 'text-ok',
    alerta: 'text-warn',
    erro: 'text-bad',
  }[tom]

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">
          {rotulo}
        </span>
        {icone && <span className="text-ink-500 shrink-0">{icone}</span>}
      </div>
      <div className="flex items-baseline font-mono tabular-nums text-2xl font-medium">
        <span className={tomValorClasses}>{valor}</span>
        {unidade && <span className="text-sm text-ink-500 ml-1 font-normal">{unidade}</span>}
      </div>
      {apoio && <div className="text-[11.5px] text-ink-500 mt-1">{apoio}</div>}
    </div>
  )
}
