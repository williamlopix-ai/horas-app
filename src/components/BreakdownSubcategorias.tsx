import { Chip, Surface } from './ui'

export interface SubcategoriaBreakdownItem {
  id: string | null
  nome: string
  duracao: number
  horas_alocadas: number | null
  percentual?: number
}

interface BreakdownSubcategoriasProps {
  subcategorias: SubcategoriaBreakdownItem[]
}

export default function BreakdownSubcategorias({ subcategorias }: BreakdownSubcategoriasProps) {
  if (!subcategorias || subcategorias.length === 0) return null

  const temAlgumaAlocacao = subcategorias.some(
    sub => sub.id !== null && sub.horas_alocadas !== null && sub.horas_alocadas > 0
  )

  const somaSemAlocacao = subcategorias.reduce((acc, sub) => {
    const temAloc = sub.id !== null && sub.horas_alocadas !== null && sub.horas_alocadas > 0
    if (!temAloc) {
      return acc + sub.duracao
    }
    return acc
  }, 0)

  const exibirRodape = temAlgumaAlocacao && somaSemAlocacao > 0

  return (
    <Surface elevacao={2} comBorda comSombra={false} padding="nenhum" className="p-4">
      <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest block mb-3 font-ui">Subcategorias</span>
      <div className="space-y-2.5">
        {subcategorias.map((sub) => {
          const horasAlocadas = sub.horas_alocadas
          const temAlocacao = sub.id !== null && horasAlocadas !== null && horasAlocadas > 0
          const excedeu = temAlocacao && sub.duracao > horasAlocadas
          const percentualAlocado = temAlocacao ? Math.round((sub.duracao / horasAlocadas) * 100) : 0
          const larguraBarra = temAlocacao ? Math.min(100, Math.max(0, (sub.duracao / horasAlocadas) * 100)) : 0

          const duracaoFormatada = `${sub.duracao.toFixed(2).replace('.', ',')}h`
          const alocadoFormatado = temAlocacao
            ? (Number.isInteger(horasAlocadas)
                ? `${horasAlocadas}h`
                : `${horasAlocadas.toString().replace('.', ',')}h`)
            : ''

          return (
            <div key={sub.id || 'sem_sub'} className="space-y-1 py-0.5">
              <div className="flex justify-between items-start text-xs gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sub.id === null ? 'border border-ink-500 bg-transparent' : 'bg-accent'}`} />
                  <span className="text-ink-700 whitespace-normal break-words min-w-0 overflow-hidden" title={sub.nome}>{sub.nome}</span>
                  {temAlgumaAlocacao && !temAlocacao && sub.id !== null && (
                    <Chip tom="neutro" className="shrink-0">sem alocação</Chip>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <span className="font-mono tabular-nums font-semibold text-ink-900 text-right">
                    {temAlocacao ? `${duracaoFormatada} / ${alocadoFormatado}` : duracaoFormatada}
                  </span>
                  <span className="font-mono tabular-nums w-10 text-right font-medium text-ink-500">
                    {!temAlocacao ? `${sub.percentual ?? 0}%` : ''}
                  </span>
                </div>
              </div>

              {temAlocacao && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-surface-0 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-d2 ease-ez"
                      style={{
                        width: `${larguraBarra}%`,
                        backgroundColor: excedeu ? 'var(--bad)' : 'var(--accent)'
                      }}
                    />
                  </div>
                  <span className={`font-mono tabular-nums text-[10px] w-10 text-right font-medium shrink-0 ${excedeu ? 'text-bad' : 'text-ink-500'}`}>
                    {percentualAlocado}%
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {exibirRodape && (
        <div className="mt-3 pt-2 border-t border-hair text-[10px] text-ink-500 text-right font-mono tabular-nums">
          {somaSemAlocacao.toFixed(2).replace('.', ',')}h sem alocação
        </div>
      )}
    </Surface>
  )
}
