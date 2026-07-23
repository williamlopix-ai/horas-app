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
    <div className="bg-[#1E2530]/50 rounded-xl p-4 border border-gray-800/60">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Subcategorias</span>
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
              <div className="flex justify-between items-center text-xs gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sub.id === null ? 'border border-gray-500 bg-transparent' : 'bg-[#03A9F4]'}`} />
                  <span className="text-gray-300 whitespace-normal break-words" title={sub.nome}>{sub.nome}</span>
                  {temAlgumaAlocacao && !temAlocacao && sub.id !== null && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0B0E14] border border-gray-700 text-[#8B949E] shrink-0 font-medium">
                      sem alocação
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <span className="font-mono font-semibold text-white text-right">
                    {temAlocacao ? `${duracaoFormatada} / ${alocadoFormatado}` : duracaoFormatada}
                  </span>
                  {!temAlocacao && (
                    <span className="font-mono w-10 text-right font-medium text-[#6B7280]">
                      {sub.percentual ?? 0}%
                    </span>
                  )}
                </div>
              </div>

              {temAlocacao && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-[#0B0E14] h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${larguraBarra}%`,
                        backgroundColor: excedeu ? '#F44336' : '#03A9F4'
                      }}
                    />
                  </div>
                  <span
                    className="font-mono text-[10px] w-10 text-right font-medium shrink-0"
                    style={{ color: excedeu ? '#F44336' : '#6B7280' }}
                  >
                    {percentualAlocado}%
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {exibirRodape && (
        <div className="mt-3 pt-2 border-t border-gray-800/60 text-[10px] text-[#8B949E] text-right font-mono">
          {somaSemAlocacao.toFixed(2).replace('.', ',')}h sem alocação
        </div>
      )}
    </div>
  )
}
