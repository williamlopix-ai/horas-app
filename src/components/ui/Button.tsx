import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export type VarianteBotao = 'primario' | 'secundario' | 'fantasma' | 'destrutivo'
export type TamanhoBotao = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao
  tamanho?: TamanhoBotao
  carregando?: boolean
  iconeEsquerda?: ReactNode
  iconeDireita?: ReactNode
  larguraTotal?: boolean
}

export function Button({
  variante = 'secundario',
  tamanho = 'md',
  carregando = false,
  iconeEsquerda,
  iconeDireita,
  larguraTotal = false,
  disabled,
  className = '',
  children,
  style,
  ...rest
}: ButtonProps) {
  const estaDesabilitado = disabled || carregando

  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 rounded-ctl font-medium whitespace-nowrap transition-colors duration-d1 ease-ez focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg focus-visible:border-accent active:translate-y-[0.5px] disabled:opacity-50 disabled:cursor-not-allowed'

  const tamanhoClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-[13px]',
  }[tamanho]

  const varianteClasses = {
    primario: 'bg-pri text-pri-fg font-semibold shadow-e1 hover:bg-pri-hover',
    secundario: 'bg-surface-2 border border-hair-strong text-ink-900 shadow-e1 hover:bg-surface-3',
    fantasma: 'bg-transparent text-ink-700 hover:bg-surface-3 hover:text-ink-900',
    destrutivo: 'bg-transparent text-bad border hover:bg-bad-bg',
  }[variante]

  const inlineStyles =
    variante === 'destrutivo'
      ? {
          borderColor: 'color-mix(in srgb, var(--bad) 30%, transparent)',
          ...style,
        }
      : style

  return (
    <button
      disabled={estaDesabilitado}
      style={inlineStyles}
      className={`${baseClasses} ${tamanhoClasses} ${varianteClasses} ${larguraTotal ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {carregando ? (
        <Loader2 className={`animate-spin ${tamanho === 'sm' ? 'w-icon-xs h-icon-xs' : 'w-icon-xs h-icon-xs'}`} />
      ) : (
        iconeEsquerda && <span className="shrink-0 flex items-center">{iconeEsquerda}</span>
      )}
      {children}
      {iconeDireita && !carregando && (
        <span className="shrink-0 flex items-center">{iconeDireita}</span>
      )}
    </button>
  )
}
