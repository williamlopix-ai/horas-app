import { type ReactNode } from 'react'

export type VarianteEmptyState = 'padrao' | 'display'

export interface EmptyStateProps {
  icone: ReactNode
  corIcone: string
  corFundoIcone: string
  titulo: string
  descricao: ReactNode
  variante?: VarianteEmptyState
  acao?: ReactNode
}

export function EmptyState({
  icone,
  corIcone,
  corFundoIcone,
  titulo,
  descricao,
  variante = 'padrao',
  acao,
}: EmptyStateProps) {
  const classeTitulo =
    variante === 'display'
      ? 'text-lg font-bold text-ink-900 font-display'
      : 'text-lg font-bold text-ink-900'

  const classeDescricao =
    variante === 'display'
      ? 'text-sm text-ink-500 leading-relaxed font-ui'
      : 'text-sm text-ink-700'

  return (
    <>
      <div className={`inline-flex p-4 rounded-full ${corFundoIcone} ${corIcone} mb-2`}>
        {icone}
      </div>
      <h3 className={classeTitulo}>{titulo}</h3>
      <p className={classeDescricao}>{descricao}</p>
      {acao}
    </>
  )
}
