import { type ReactNode } from 'react'

export type TomChip = 'neutro' | 'ok' | 'alerta' | 'erro' | 'acento'

export interface ChipProps {
  tom?: TomChip
  icone?: ReactNode
  pontoCor?: string
  children: ReactNode
  className?: string
}

export function Chip({
  tom = 'neutro',
  icone,
  pontoCor,
  children,
  className = '',
}: ChipProps) {
  const baseClasses =
    'inline-flex items-center gap-1.5 font-mono text-[10.5px] px-2 py-0.5 rounded-chip whitespace-nowrap'

  const tomClasses = {
    neutro: 'bg-surface-3 text-ink-500 border border-hair',
    ok: 'bg-ok-bg text-ok',
    alerta: 'bg-warn-bg text-warn',
    erro: 'bg-bad-bg text-bad',
    acento: 'bg-accent-bg text-accent-fg',
  }[tom]

  return (
    <span className={`${baseClasses} ${tomClasses} ${className}`}>
      {pontoCor && (
        <span
          className="w-[7px] h-[7px] rounded-[2px] shrink-0"
          style={{ backgroundColor: pontoCor }}
        />
      )}
      {icone && <span className="shrink-0 flex items-center">{icone}</span>}
      <span>{children}</span>
    </span>
  )
}
