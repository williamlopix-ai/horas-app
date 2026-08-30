import { type HTMLAttributes, type ReactNode } from 'react'

export type ElevacaoSurface = 0 | 1 | 2 | 3
export type PaddingSurface = 'nenhum' | 'sm' | 'md' | 'lg'

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevacao?: ElevacaoSurface
  padding?: PaddingSurface
  comBorda?: boolean
  comSombra?: boolean
  interativo?: boolean
  children?: ReactNode
}

export function Surface({
  elevacao = 2,
  padding = 'md',
  comBorda = false,
  comSombra = true,
  interativo = false,
  className = '',
  children,
  onClick,
  onKeyDown,
  tabIndex,
  role,
  ...rest
}: SurfaceProps) {
  const elevacaoClasses = {
    0: 'bg-surface-0',
    1: 'bg-surface-1',
    2: 'bg-surface-2',
    3: 'bg-surface-3',
  }[elevacao]

  const paddingClasses = {
    nenhum: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding]

  const ehInterativo = interativo && !!onClick

  return (
    <div
      onClick={onClick}
      role={role ?? (ehInterativo ? 'button' : undefined)}
      tabIndex={tabIndex ?? (ehInterativo ? 0 : undefined)}
      onKeyDown={onKeyDown ?? (ehInterativo ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(e as unknown as React.MouseEvent<HTMLDivElement>)
        }
      } : undefined)}
      className={`rounded-card ${elevacaoClasses} ${paddingClasses} ${comBorda ? 'border border-hair' : ''} ${comSombra ? 'shadow-e1' : ''} ${ehInterativo ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-bg focus-visible:border-accent' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
