import { type HTMLAttributes, type ReactNode } from 'react'

export type ElevacaoSurface = 0 | 1 | 2 | 3
export type PaddingSurface = 'nenhum' | 'sm' | 'md' | 'lg'

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevacao?: ElevacaoSurface
  padding?: PaddingSurface
  comBorda?: boolean
  comSombra?: boolean
  children?: ReactNode
}

export function Surface({
  elevacao = 2,
  padding = 'md',
  comBorda = false,
  comSombra = true,
  className = '',
  children,
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

  return (
    <div
      className={`rounded-card ${elevacaoClasses} ${paddingClasses} ${comBorda ? 'border border-hair' : ''} ${comSombra ? 'shadow-e1' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
