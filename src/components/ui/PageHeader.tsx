import { type ReactNode } from 'react'

export interface PageHeaderProps {
  titulo: string
  subtitulo?: string
  acao?: ReactNode
  className?: string
}

export function PageHeader({ titulo, subtitulo, acao, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-lg ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-ink-900 tracking-tight">{titulo}</h2>
        {subtitulo && <p className="text-sm text-ink-700">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  )
}
